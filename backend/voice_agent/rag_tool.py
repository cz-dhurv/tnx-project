"""RAG tool for the voice agent.

Calls the existing CampusAI backend's RAG pipeline to search uploaded study
materials. This keeps ONE source of truth — the same vector DB and chunking
logic serves both text chat and voice.
"""

import logging
from typing import Any

import httpx
import numpy as np

logger = logging.getLogger("voice_agent.rag_tool")

# We import directly from the backend's own modules so the voice agent
# can call the RAG pipeline in-process (no HTTP round-trip needed when
# both run on the same machine).

async def search_study_materials_via_http(
    query: str,
    backend_url: str = "http://127.0.0.1:8000",
) -> dict[str, Any]:
    """Call the backend's embedding + vector search directly via HTTP.

    Falls back gracefully if the backend is unreachable.
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Use the backend's internal search — we'll add this endpoint
            resp = await client.post(
                f"{backend_url}/api/internal/rag-search",
                json={"query": query, "top_k": 5},
            )
            if resp.status_code == 200:
                return resp.json()
            logger.warning("RAG search returned %d: %s", resp.status_code, resp.text[:200])
    except Exception as e:
        logger.warning("RAG search HTTP failed: %s", e)

    return {"chunks": [], "sources": []}


async def search_in_process(
    query: str,
    embedder: Any,
    vector_repo: Any,
) -> list[dict[str, str]]:
    """In-process RAG search using the backend's own services.

    This is the preferred path when the voice agent runs alongside the
    backend on the same machine.
    """
    try:
        # Embed the query
        query_embedding = await embedder.embed(query)
        if isinstance(query_embedding, np.ndarray):
            query_embedding = query_embedding.tolist()

        # Search the vector store
        results = await vector_repo.search(query_embedding, top_k=5)

        chunks = []
        for r in results:
            chunks.append({
                "text": r.get("text", ""),
                "source": r.get("filename", "uploaded document"),
                "section": r.get("section", ""),
                "score": r.get("score", 0.0),
            })
        return chunks
    except Exception as e:
        logger.warning("In-process RAG search failed: %s", e)
        return []


def format_rag_context(chunks: list[dict]) -> str:
    """Format retrieved chunks into a context string for the LLM.

    Optimized for voice: concise, no markdown, includes source attribution.
    """
    if not chunks:
        return ""

    parts = ["Here is relevant information from the student's uploaded study materials:\n"]
    for i, chunk in enumerate(chunks, 1):
        source = chunk.get("source", "document")
        section = chunk.get("section", "")
        text = chunk.get("text", "")
        source_label = f"{source}"
        if section:
            source_label += f" — {section}"
        parts.append(f"[Source {i}: {source_label}]\n{text}\n")

    parts.append(
        "\nUse the above sources to answer the student's question. "
        "Refer to sources naturally, like 'According to your notes on...' "
        "Do not read citation numbers or URLs aloud."
    )
    return "\n".join(parts)
