"""
Structure-aware text chunking service.
Respects headings, paragraphs, and list structures.
Configurable chunk size and overlap.
"""

import re
import uuid
from dataclasses import dataclass, field

from observability.logger import get_logger

logger = get_logger(__name__)


@dataclass
class Chunk:
    """A single text chunk with metadata."""
    chunk_id: str
    document_id: str
    content: str
    chunk_index: int
    page_number: int | None = None
    section: str | None = None
    metadata: dict = field(default_factory=dict)


def chunk_text(
    text: str,
    document_id: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    filename: str = "",
) -> list[Chunk]:
    """
    Split text into chunks using structure-aware splitting.

    Strategy:
    1. First try to split on major structural boundaries (headings, double newlines).
    2. Within each structural section, split on paragraph boundaries if too large.
    3. Fall back to sentence-level splitting for very long paragraphs.
    4. Apply overlap between chunks for retrieval quality.

    Args:
        text: The full document text.
        document_id: Parent document ID.
        chunk_size: Target max characters per chunk.
        chunk_overlap: Overlap between consecutive chunks.
        filename: Original filename for metadata.

    Returns:
        List of Chunk objects ready for embedding.
    """
    if not text or not text.strip():
        return []

    # Detect sections by headings (markdown-style or ALL-CAPS lines)
    sections = _split_into_sections(text)

    chunks: list[Chunk] = []
    chunk_index = 0

    for section_title, section_text in sections:
        # Split large sections into paragraph-level pieces
        paragraphs = _split_into_paragraphs(section_text)

        current_chunk_text = ""

        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue

            # If adding this paragraph would exceed chunk_size, finalize current chunk
            if current_chunk_text and len(current_chunk_text) + len(paragraph) + 1 > chunk_size:
                chunk = Chunk(
                    chunk_id=str(uuid.uuid4()),
                    document_id=document_id,
                    content=current_chunk_text.strip(),
                    chunk_index=chunk_index,
                    section=section_title,
                    metadata={"filename": filename},
                )
                chunks.append(chunk)
                chunk_index += 1

                # Apply overlap: keep tail of current chunk
                if chunk_overlap > 0:
                    overlap_text = current_chunk_text[-chunk_overlap:]
                    current_chunk_text = overlap_text + "\n" + paragraph
                else:
                    current_chunk_text = paragraph
            else:
                if current_chunk_text:
                    current_chunk_text += "\n" + paragraph
                else:
                    current_chunk_text = paragraph

            # Handle very long paragraphs that exceed chunk_size on their own
            while len(current_chunk_text) > chunk_size * 1.5:
                split_point = _find_sentence_boundary(current_chunk_text, chunk_size)
                chunk = Chunk(
                    chunk_id=str(uuid.uuid4()),
                    document_id=document_id,
                    content=current_chunk_text[:split_point].strip(),
                    chunk_index=chunk_index,
                    section=section_title,
                    metadata={"filename": filename},
                )
                chunks.append(chunk)
                chunk_index += 1

                # Overlap
                overlap_start = max(0, split_point - chunk_overlap)
                current_chunk_text = current_chunk_text[overlap_start:]

        # Finalize remaining text in this section
        if current_chunk_text.strip():
            chunk = Chunk(
                chunk_id=str(uuid.uuid4()),
                document_id=document_id,
                content=current_chunk_text.strip(),
                chunk_index=chunk_index,
                section=section_title,
                metadata={"filename": filename},
            )
            chunks.append(chunk)
            chunk_index += 1

    logger.info(f"Chunked document {document_id} into {len(chunks)} chunks")
    return chunks


def _split_into_sections(text: str) -> list[tuple[str | None, str]]:
    """
    Split text by headings (markdown # or ALL-CAPS lines).
    Returns list of (section_title, section_content) tuples.
    """
    # Match markdown headings or ALL-CAPS lines that look like headings
    heading_pattern = re.compile(
        r"^(#{1,6}\s+.+|[A-Z][A-Z\s]{4,}[A-Z])$",
        re.MULTILINE
    )

    matches = list(heading_pattern.finditer(text))

    if not matches:
        return [(None, text)]

    sections: list[tuple[str | None, str]] = []

    # Text before first heading
    if matches[0].start() > 0:
        pre_text = text[:matches[0].start()].strip()
        if pre_text:
            sections.append((None, pre_text))

    for i, match in enumerate(matches):
        title = match.group().strip().lstrip("#").strip()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        content = text[start:end].strip()
        if content:
            sections.append((title, content))

    return sections if sections else [(None, text)]


def _split_into_paragraphs(text: str) -> list[str]:
    """Split text on double newlines (paragraph boundaries)."""
    paragraphs = re.split(r"\n\s*\n", text)
    return [p.strip() for p in paragraphs if p.strip()]


def _find_sentence_boundary(text: str, target_pos: int) -> int:
    """
    Find the nearest sentence boundary at or before target_pos.
    Falls back to word boundary, then hard split.
    """
    # Look for sentence-ending punctuation near the target
    search_start = max(0, target_pos - 100)
    search_region = text[search_start:target_pos + 50]

    # Find last sentence boundary in search region
    for pattern in [r"[.!?]\s", r"\n", r",\s", r"\s"]:
        matches = list(re.finditer(pattern, search_region))
        if matches:
            last_match = matches[-1]
            return search_start + last_match.end()

    # Hard split at target
    return target_pos
