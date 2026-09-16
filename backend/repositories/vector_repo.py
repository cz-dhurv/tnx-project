"""
Vector repository with dual backends:
- Qdrant (if available via Docker)
- In-memory fallback (for hackathon/dev when Docker is unavailable)

The in-memory backend uses cosine similarity for vector search.
"""

import numpy as np
from typing import Optional
from dataclasses import dataclass, field
import uuid

from observability.logger import get_logger

logger = get_logger(__name__)


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    a_arr = np.array(a)
    b_arr = np.array(b)
    dot = np.dot(a_arr, b_arr)
    norm_a = np.linalg.norm(a_arr)
    norm_b = np.linalg.norm(b_arr)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))


@dataclass
class StoredVector:
    """A vector stored in memory with its metadata."""
    chunk_id: str
    document_id: str
    content: str
    section: Optional[str]
    page: Optional[int]
    filename: str
    chunk_index: int
    vector: list[float]


class VectorRepository:
    """
    Vector database with automatic backend selection.
    Tries Qdrant first; falls back to in-memory if unavailable.
    """

    def __init__(self, url: str, collection_name: str):
        self.url = url
        self.collection_name = collection_name
        self._use_qdrant = False
        self._qdrant_client = None
        # In-memory storage
        self._vectors: list[StoredVector] = []

    async def connect(self) -> None:
        """Try to connect to Qdrant; fall back to in-memory."""
        try:
            from qdrant_client import QdrantClient
            from qdrant_client.models import Distance, VectorParams

            client = QdrantClient(url=self.url, timeout=5)
            # Test connection
            client.get_collections()

            # Ensure collection exists
            collections = client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)
            if not exists:
                client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=768,  # Gemini text-embedding-004 dimension
                        distance=Distance.COSINE,
                    ),
                )
                logger.info(f"Created Qdrant collection: {self.collection_name}")

            self._qdrant_client = client
            self._use_qdrant = True
            logger.info("✅ Connected to Qdrant vector database")

        except Exception as e:
            logger.info(f"⚠️ Qdrant unavailable ({e}), using in-memory vector store")
            self._use_qdrant = False

    def is_connected(self) -> bool:
        """Check if vector store is available."""
        if self._use_qdrant:
            try:
                self._qdrant_client.get_collections()
                return True
            except Exception:
                return False
        return True  # In-memory is always available

    async def upsert_chunks(
        self,
        chunks: list[dict],
        embeddings: list[list[float]],
    ) -> None:
        """Store chunk embeddings."""
        if self._use_qdrant:
            await self._qdrant_upsert(chunks, embeddings)
        else:
            await self._memory_upsert(chunks, embeddings)

    async def search_similar(
        self,
        query_vector: list[float],
        top_k: int = 20,
        document_ids: list[str] | None = None,
    ) -> list[dict]:
        """Search for similar chunks."""
        if self._use_qdrant:
            return await self._qdrant_search(query_vector, top_k, document_ids)
        else:
            return await self._memory_search(query_vector, top_k, document_ids)

    async def delete_by_document(self, document_id: str) -> None:
        """Delete all vectors for a document."""
        if self._use_qdrant:
            await self._qdrant_delete(document_id)
        else:
            self._vectors = [v for v in self._vectors if v.document_id != document_id]
            logger.info(f"Deleted in-memory vectors for document {document_id}")

    # ── Qdrant Backend ───────────────────────────────

    async def _qdrant_upsert(self, chunks: list[dict], embeddings: list[list[float]]) -> None:
        from qdrant_client.models import PointStruct

        points = []
        for chunk, embedding in zip(chunks, embeddings):
            point = PointStruct(
                id=chunk["chunk_id"],
                vector=embedding,
                payload={
                    "document_id": chunk["document_id"],
                    "content": chunk["content"],
                    "chunk_index": chunk.get("chunk_index", 0),
                    "section": chunk.get("section", ""),
                    "page": chunk.get("page"),
                    "filename": chunk.get("filename", ""),
                },
            )
            points.append(point)

        batch_size = 100
        for i in range(0, len(points), batch_size):
            batch = points[i:i + batch_size]
            self._qdrant_client.upsert(
                collection_name=self.collection_name,
                points=batch,
            )
        logger.info(f"Upserted {len(points)} vectors to Qdrant")

    async def _qdrant_search(
        self, query_vector: list[float], top_k: int, document_ids: list[str] | None
    ) -> list[dict]:
        from qdrant_client.models import Filter, FieldCondition, MatchValue

        query_filter = None
        if document_ids:
            query_filter = Filter(
                should=[
                    FieldCondition(key="document_id", match=MatchValue(value=doc_id))
                    for doc_id in document_ids
                ]
            )

        results = self._qdrant_client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            limit=top_k,
            query_filter=query_filter,
            with_payload=True,
        )

        chunks = []
        for point in results.points:
            payload = point.payload or {}
            chunks.append({
                "chunk_id": str(point.id),
                "document_id": payload.get("document_id", ""),
                "content": payload.get("content", ""),
                "section": payload.get("section"),
                "page": payload.get("page"),
                "filename": payload.get("filename", ""),
                "chunk_index": payload.get("chunk_index", 0),
                "score": point.score if point.score else 0,
            })
        return chunks

    async def _qdrant_delete(self, document_id: str) -> None:
        from qdrant_client.models import Filter, FieldCondition, MatchValue

        self._qdrant_client.delete(
            collection_name=self.collection_name,
            points_selector=Filter(
                must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
            ),
        )
        logger.info(f"Deleted Qdrant vectors for document {document_id}")

    # ── In-Memory Backend ────────────────────────────

    async def _memory_upsert(self, chunks: list[dict], embeddings: list[list[float]]) -> None:
        for chunk, embedding in zip(chunks, embeddings):
            # Remove existing chunk with same ID
            self._vectors = [v for v in self._vectors if v.chunk_id != chunk["chunk_id"]]

            self._vectors.append(StoredVector(
                chunk_id=chunk["chunk_id"],
                document_id=chunk["document_id"],
                content=chunk["content"],
                section=chunk.get("section"),
                page=chunk.get("page"),
                filename=chunk.get("filename", ""),
                chunk_index=chunk.get("chunk_index", 0),
                vector=embedding,
            ))
        logger.info(f"Stored {len(chunks)} vectors in memory (total: {len(self._vectors)})")

    async def _memory_search(
        self, query_vector: list[float], top_k: int, document_ids: list[str] | None
    ) -> list[dict]:
        """Brute-force cosine similarity search over in-memory vectors."""
        candidates = self._vectors

        # Filter by document IDs if specified
        if document_ids:
            candidates = [v for v in candidates if v.document_id in document_ids]

        if not candidates:
            return []

        # Compute similarities
        scored = []
        for vec in candidates:
            score = cosine_similarity(query_vector, vec.vector)
            scored.append((vec, score))

        # Sort by score descending
        scored.sort(key=lambda x: x[1], reverse=True)

        # Return top-K
        results = []
        for vec, score in scored[:top_k]:
            results.append({
                "chunk_id": vec.chunk_id,
                "document_id": vec.document_id,
                "content": vec.content,
                "section": vec.section,
                "page": vec.page,
                "filename": vec.filename,
                "chunk_index": vec.chunk_index,
                "score": score,
            })

        logger.info(f"In-memory search returned {len(results)} results")
        return results
