"""
Document ingestion service.
Handles: upload → validate → extract text → chunk → embed → store.
"""

import uuid
import asyncio
from pathlib import Path

from PyPDF2 import PdfReader
from docx import Document as DocxDocument

from services.chunking_service import chunk_text, Chunk
from providers.base import EmbeddingProvider
from repositories.vector_repo import VectorRepository
from repositories.db_repo import DBRepository
from security.validation import validate_file, sanitize_filename, compute_checksum
from observability.logger import get_logger

logger = get_logger(__name__)


class DocumentService:
    """Orchestrates the full document ingestion pipeline."""

    def __init__(
        self,
        embedding_provider: EmbeddingProvider,
        vector_repo: VectorRepository,
        db_repo: DBRepository,
        storage_dir: Path,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        max_file_size_bytes: int = 25 * 1024 * 1024,
    ):
        self.embedding_provider = embedding_provider
        self.vector_repo = vector_repo
        self.db_repo = db_repo
        self.storage_dir = storage_dir
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.max_file_size_bytes = max_file_size_bytes

    async def ingest_document(
        self,
        filename: str,
        content_type: str | None,
        file_data: bytes,
    ) -> dict:
        """
        Full ingestion pipeline:
        1. Validate file
        2. Check for duplicates (checksum)
        3. Store original file
        4. Extract text
        5. Chunk
        6. Generate embeddings
        7. Store in vector DB
        8. Update SQLite metadata

        Returns document metadata dict.
        """
        document_id = str(uuid.uuid4())

        # Step 1: Validate
        is_valid, error = validate_file(
            filename=filename,
            content_type=content_type,
            file_size=len(file_data),
            max_size_bytes=self.max_file_size_bytes,
        )
        if not is_valid:
            raise ValueError(error)

        # Step 2: Checksum + dedup
        checksum = compute_checksum(file_data)
        existing = await self.db_repo.find_document_by_checksum(checksum)
        if existing and existing["status"] == "ready":
            logger.info(f"Duplicate document detected: {filename} (checksum: {checksum[:12]})")
            return existing

        # Step 3: Create DB record (status: uploaded)
        safe_filename = sanitize_filename(filename)
        doc = await self.db_repo.create_document(
            document_id=document_id,
            filename=safe_filename,
            mime_type=content_type or "application/octet-stream",
            size_bytes=len(file_data),
            checksum=checksum,
        )

        # Step 4: Process in background (update status as we go)
        try:
            await self.db_repo.update_document_status(document_id, "processing")

            # Store file
            self.storage_dir.mkdir(parents=True, exist_ok=True)
            file_path = self.storage_dir / f"{document_id}_{safe_filename}"
            file_path.write_bytes(file_data)

            # Extract text
            text = self._extract_text(file_data, safe_filename)
            if not text or len(text.strip()) < 10:
                raise ValueError("Could not extract meaningful text from the document.")

            # Chunk
            chunks = chunk_text(
                text=text,
                document_id=document_id,
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap,
                filename=safe_filename,
            )
            if not chunks:
                raise ValueError("Document produced no text chunks.")

            # Generate embeddings
            chunk_texts = [c.content for c in chunks]
            embeddings = await self.embedding_provider.embed_documents(chunk_texts)

            # Store in Qdrant
            chunk_dicts = [
                {
                    "chunk_id": c.chunk_id,
                    "document_id": c.document_id,
                    "content": c.content,
                    "chunk_index": c.chunk_index,
                    "section": c.section,
                    "page": c.page_number,
                    "filename": safe_filename,
                }
                for c in chunks
            ]
            await self.vector_repo.upsert_chunks(chunk_dicts, embeddings)

            # Extract topics from sections
            topics = self._extract_topics(chunks)

            # Update status to READY
            await self.db_repo.update_document_status(
                document_id=document_id,
                status="ready",
                chunk_count=len(chunks),
                topics=topics,
            )

            updated_doc = await self.db_repo.get_document(document_id)
            logger.info(f"Document ingested: {safe_filename} ({len(chunks)} chunks)")
            return updated_doc

        except Exception as e:
            error_msg = str(e)[:500]
            logger.error(f"Document ingestion failed for {document_id}: {error_msg}")
            await self.db_repo.update_document_status(
                document_id=document_id,
                status="failed",
                error_message=error_msg,
            )
            raise

    def _extract_text(self, file_data: bytes, filename: str) -> str:
        """Extract text from file based on extension."""
        ext = Path(filename).suffix.lower()

        if ext == ".pdf":
            return self._extract_pdf(file_data)
        elif ext == ".docx":
            return self._extract_docx(file_data)
        elif ext in {".txt", ".md"}:
            return self._extract_plain_text(file_data)
        else:
            raise ValueError(f"Unsupported file type: {ext}")

    def _extract_pdf(self, file_data: bytes) -> str:
        """Extract text from PDF using PyPDF2."""
        import io
        reader = PdfReader(io.BytesIO(file_data))
        text_parts = []
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text_parts.append(f"--- Page {i + 1} ---\n{page_text}")
        return "\n\n".join(text_parts)

    def _extract_docx(self, file_data: bytes) -> str:
        """Extract text from DOCX using python-docx."""
        import io
        doc = DocxDocument(io.BytesIO(file_data))
        paragraphs = []
        for para in doc.paragraphs:
            if para.text.strip():
                # Preserve heading styles
                if para.style and para.style.name and "Heading" in para.style.name:
                    level = para.style.name.replace("Heading", "").strip()
                    try:
                        hashes = "#" * int(level)
                    except ValueError:
                        hashes = "##"
                    paragraphs.append(f"{hashes} {para.text}")
                else:
                    paragraphs.append(para.text)
        return "\n\n".join(paragraphs)

    def _extract_plain_text(self, file_data: bytes) -> str:
        """Extract plain text, handling encoding detection."""
        import chardet
        detected = chardet.detect(file_data)
        encoding = detected.get("encoding", "utf-8") or "utf-8"
        try:
            return file_data.decode(encoding)
        except (UnicodeDecodeError, LookupError):
            return file_data.decode("utf-8", errors="replace")

    def _extract_topics(self, chunks: list[Chunk]) -> list[str]:
        """Extract unique topic/section names from chunks."""
        topics = []
        seen = set()
        for chunk in chunks:
            if chunk.section and chunk.section not in seen:
                seen.add(chunk.section)
                topics.append(chunk.section)
        # If no sections found, generate generic topics from first few chunks
        if not topics:
            for i, chunk in enumerate(chunks[:3]):
                # Use first line as topic
                first_line = chunk.content.split("\n")[0].strip()[:80]
                if first_line:
                    topics.append(first_line)
        return topics[:10]  # Max 10 topics

    async def delete_document(self, document_id: str) -> bool:
        """Delete a document from both vector DB and SQLite."""
        await self.vector_repo.delete_by_document(document_id)
        deleted = await self.db_repo.delete_document(document_id)
        if deleted:
            logger.info(f"Document deleted: {document_id}")
        return deleted
