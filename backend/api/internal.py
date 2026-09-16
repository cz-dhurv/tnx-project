"""Internal RAG search API — used by the voice agent to search study materials.

This endpoint is NOT exposed to the browser. It's called by the voice agent
running on the same machine to search the user's uploaded documents.
"""

from fastapi import APIRouter, Request
from pydantic import BaseModel

from observability.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


class RAGSearchRequest(BaseModel):
    query: str
    top_k: int = 5


@router.post("/api/internal/rag-search")
async def rag_search(body: RAGSearchRequest, request: Request):
    """Search the vector store for chunks relevant to a query.

    Returns chunks with text, source filename, section, and relevance score.
    Used by the voice agent's search_study_materials tool.
    """
    try:
        embedder = request.app.state.embedder
        vector_repo = request.app.state.vector_repo

        # Embed the query
        query_embedding = await embedder.embed_query(body.query)

        # Convert numpy array to list if needed
        import numpy as np
        if isinstance(query_embedding, np.ndarray):
            query_embedding = query_embedding.tolist()

        # Search the vector store
        results = await vector_repo.search(query_embedding, top_k=body.top_k)

        chunks = []
        for r in results:
            chunks.append({
                "text": r.get("text", ""),
                "source": r.get("filename", "uploaded document"),
                "section": r.get("section", ""),
                "score": float(r.get("score", 0.0)),
            })

        logger.info(
            "RAG search for voice: query='%s' chunks_found=%d",
            body.query[:50],
            len(chunks),
        )

        return {"chunks": chunks, "sources": [c["source"] for c in chunks]}

    except Exception as e:
        logger.error("RAG search failed: %s", e)
        return {"chunks": [], "sources": [], "error": str(e)}
