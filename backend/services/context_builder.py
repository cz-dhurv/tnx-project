"""
Context builder service.
Deduplicates chunks, enforces token limits, assigns citation IDs.
"""

from dataclasses import dataclass

from observability.logger import get_logger

logger = get_logger(__name__)

# Rough estimate: 1 token ≈ 4 characters for English text
CHARS_PER_TOKEN = 4


@dataclass
class ContextChunk:
    """A chunk selected for the LLM context with a citation ID."""
    citation_id: int
    chunk_id: str
    document_id: str
    filename: str
    page: int | None
    section: str | None
    content: str
    score: float


def build_context(
    retrieved_chunks: list[dict],
    max_context_tokens: int = 4000,
    max_chunks: int = 5,
) -> list[ContextChunk]:
    """
    Build the final context for the LLM from retrieved chunks.

    Steps:
    1. Remove exact-duplicate chunks (same content).
    2. Sort by relevance score (highest first).
    3. Take top-K chunks.
    4. Enforce token/character limit.
    5. Assign sequential citation IDs [1], [2], ...

    Args:
        retrieved_chunks: List of dicts with keys:
            chunk_id, document_id, filename, page, section, content, score
        max_context_tokens: Maximum total tokens for context.
        max_chunks: Maximum number of chunks to include.

    Returns:
        List of ContextChunk with assigned citation_ids.
    """
    if not retrieved_chunks:
        return []

    # Step 1: Deduplicate by content hash
    seen_content: set[str] = set()
    unique_chunks: list[dict] = []
    for chunk in retrieved_chunks:
        content_key = chunk["content"].strip()[:200]  # First 200 chars as dedup key
        if content_key not in seen_content:
            seen_content.add(content_key)
            unique_chunks.append(chunk)

    # Step 2: Sort by score descending
    unique_chunks.sort(key=lambda c: c.get("score", 0), reverse=True)

    # Step 3 + 4: Take top-K and enforce token limit
    selected: list[ContextChunk] = []
    total_chars = 0
    max_chars = max_context_tokens * CHARS_PER_TOKEN

    for i, chunk in enumerate(unique_chunks[:max_chunks]):
        content = chunk["content"].strip()
        if total_chars + len(content) > max_chars:
            # Truncate last chunk to fit
            remaining = max_chars - total_chars
            if remaining > 100:  # Only include if meaningful amount remains
                content = content[:remaining] + "..."
            else:
                break

        total_chars += len(content)
        selected.append(ContextChunk(
            citation_id=i + 1,
            chunk_id=chunk["chunk_id"],
            document_id=chunk["document_id"],
            filename=chunk.get("filename", "Unknown"),
            page=chunk.get("page"),
            section=chunk.get("section"),
            content=content,
            score=chunk.get("score", 0),
        ))

    logger.info(
        f"Context built: {len(selected)} chunks, ~{total_chars // CHARS_PER_TOKEN} tokens"
    )
    return selected


def context_chunks_to_prompt_blocks(chunks: list[ContextChunk]) -> list[dict]:
    """Convert ContextChunks to the format expected by build_rag_prompt()."""
    return [
        {
            "citation_id": c.citation_id,
            "filename": c.filename,
            "page": c.page,
            "section": c.section,
            "content": c.content,
        }
        for c in chunks
    ]


def context_chunks_to_citations(chunks: list[ContextChunk]) -> list[dict]:
    """Convert ContextChunks to Citation dicts for the API response."""
    return [
        {
            "citation_id": c.citation_id,
            "document_id": c.document_id,
            "filename": c.filename,
            "page": c.page,
            "section": c.section,
            "chunk_id": c.chunk_id,
            "snippet": c.content[:200] + "..." if len(c.content) > 200 else c.content,
        }
        for c in chunks
    ]
