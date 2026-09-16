"""
Chat service — the RAG orchestrator.
Coordinates: query processing → retrieval → reranking → context → generation → citations.
"""

import uuid
import json
from typing import AsyncIterator

from providers.base import LLMProvider, EmbeddingProvider
from repositories.vector_repo import VectorRepository
from repositories.db_repo import DBRepository
from services.query_processor import normalize_query, is_follow_up, rewrite_query
from services.context_builder import (
    build_context,
    context_chunks_to_prompt_blocks,
    context_chunks_to_citations,
    ContextChunk,
)
from prompts.system import SYSTEM_PROMPT, build_rag_prompt
from observability.logger import get_logger

logger = get_logger(__name__)


class ChatService:
    """
    RAG orchestrator. Handles the full pipeline:
    query → embed → retrieve → rerank → context → generate → cite → stream
    """

    def __init__(
        self,
        llm: LLMProvider,
        embedder: EmbeddingProvider,
        vector_repo: VectorRepository,
        db_repo: DBRepository,
        retrieval_top_k: int = 20,
        rerank_top_k: int = 8,
        final_context_chunks: int = 5,
        model_name: str = "gemini-2.0-flash",
    ):
        self.llm = llm
        self.embedder = embedder
        self.vector_repo = vector_repo
        self.db_repo = db_repo
        self.retrieval_top_k = retrieval_top_k
        self.rerank_top_k = rerank_top_k
        self.final_context_chunks = final_context_chunks
        self.model_name = model_name

    async def chat_stream(
        self,
        conversation_id: str | None,
        message: str,
        document_ids: list[str] | None = None,
        mode: str = "rag",
    ) -> AsyncIterator[dict]:
        """
        Full RAG chat pipeline with streaming response.

        Yields SSE event dicts:
            {"event": "message_start", "data": {...}}
            {"event": "token", "data": {"content": "..."}}
            {"event": "citations", "data": {"sources": [...]}}
            {"event": "message_end", "data": {"usage": {...}}}
            {"event": "error", "data": {"message": "..."}}
        """
        message_id = str(uuid.uuid4())

        try:
            # Create or get conversation
            if not conversation_id:
                conversation_id = str(uuid.uuid4())
                await self.db_repo.create_conversation(
                    conversation_id=conversation_id,
                    title=message[:50],
                )

            # Emit message_start
            yield {
                "event": "message_start",
                "data": {
                    "conversation_id": conversation_id,
                    "message_id": message_id,
                },
            }

            # Save user message
            user_msg_id = str(uuid.uuid4())
            await self.db_repo.add_message(
                message_id=user_msg_id,
                conversation_id=conversation_id,
                sender="user",
                text=message,
            )

            # Get conversation history
            history = await self.db_repo.get_conversation_messages(
                conversation_id, limit=10
            )

            # Normalize query
            query = normalize_query(message)

            context_chunks: list[ContextChunk] = []
            retrieval_query = query

            if mode == "rag":
                # Check if follow-up and potentially rewrite
                if is_follow_up(query, history):
                    retrieval_query = await rewrite_query(query, history, self.llm)

                # Embed query
                query_vector = await self.embedder.embed_query(retrieval_query)

                # Vector search
                raw_results = await self.vector_repo.search_similar(
                    query_vector=query_vector,
                    top_k=self.retrieval_top_k,
                    document_ids=document_ids if document_ids else None,
                )

                if raw_results:
                    # Rerank using LLM scoring
                    reranked = await self._rerank(query, raw_results)

                    # Build context
                    context_chunks = build_context(
                        retrieved_chunks=reranked,
                        max_context_tokens=4000,
                        max_chunks=self.final_context_chunks,
                    )

            # Build prompt
            if mode == "rag" and context_chunks:
                prompt_blocks = context_chunks_to_prompt_blocks(context_chunks)
                prompt = build_rag_prompt(
                    user_query=query,
                    context_blocks=prompt_blocks,
                    conversation_history=history[-6:] if history else None,
                )
            else:
                # General chat or no context found
                prompt = build_rag_prompt(
                    user_query=query,
                    context_blocks=[],
                    conversation_history=history[-6:] if history else None,
                )

            # Stream LLM response
            full_response = ""
            async for token in self.llm.stream(
                prompt=prompt,
                system=SYSTEM_PROMPT,
                temperature=0.7,
                max_tokens=2048,
            ):
                full_response += token
                yield {"event": "token", "data": {"content": token}}

            # Emit citations
            citations = []
            if context_chunks:
                citations = context_chunks_to_citations(context_chunks)
                yield {"event": "citations", "data": {"sources": citations}}

            # Save AI message
            await self.db_repo.add_message(
                message_id=message_id,
                conversation_id=conversation_id,
                sender="ai",
                text=full_response,
                citations=citations,
                model=self.model_name,
            )

            # Emit message_end
            yield {
                "event": "message_end",
                "data": {
                    "conversation_id": conversation_id,
                    "message_id": message_id,
                    "model": self.model_name,
                    "retrieval": {
                        "query_used": retrieval_query,
                        "chunks_retrieved": len(raw_results) if mode == "rag" else 0,
                        "chunks_used": len(context_chunks),
                    } if mode == "rag" else None,
                },
            }

        except Exception as e:
            logger.error(f"Chat error: {e}")
            yield {
                "event": "error",
                "data": {"message": f"An error occurred: {str(e)[:200]}"},
            }

    async def _rerank(
        self,
        query: str,
        candidates: list[dict],
    ) -> list[dict]:
        """
        Rerank candidates using LLM-based relevance scoring.
        Scores each candidate's relevance to the query on a 0-10 scale.
        """
        if len(candidates) <= self.final_context_chunks:
            return candidates  # Skip reranking if already few enough

        # Take top candidates for reranking (bounded)
        to_rerank = candidates[:self.rerank_top_k]

        try:
            # Build scoring prompt
            chunk_descriptions = "\n".join(
                f"[CHUNK {i+1}]: {c['content'][:300]}"
                for i, c in enumerate(to_rerank)
            )

            scoring_prompt = f"""Rate the relevance of each chunk to the query on a scale of 0-10.
Query: "{query}"

{chunk_descriptions}

Return ONLY a JSON array of scores, e.g. [8, 3, 9, 1, ...]. One score per chunk, in order."""

            response = await self.llm.generate(
                prompt=scoring_prompt,
                system="You are a relevance scoring assistant. Return only a JSON array of integer scores 0-10.",
                temperature=0.1,
                max_tokens=200,
            )

            # Parse scores
            scores = self._parse_scores(response, len(to_rerank))

            # Combine original score with rerank score
            for i, candidate in enumerate(to_rerank):
                if i < len(scores):
                    # Weighted: 40% vector similarity + 60% LLM relevance
                    original_score = candidate.get("score", 0)
                    rerank_score = scores[i] / 10.0
                    candidate["score"] = 0.4 * original_score + 0.6 * rerank_score

            # Sort by new combined score
            to_rerank.sort(key=lambda c: c.get("score", 0), reverse=True)
            logger.info(f"Reranked {len(to_rerank)} candidates")
            return to_rerank

        except Exception as e:
            logger.error(f"Reranking failed, using original order: {e}")
            return candidates  # Fall back to original ranking

    def _parse_scores(self, response: str, expected_count: int) -> list[float]:
        """Parse LLM scoring response into a list of floats."""
        try:
            # Try direct JSON parse
            import re
            # Find JSON array in response
            match = re.search(r"\[[\d\s,\.]+\]", response)
            if match:
                scores = json.loads(match.group())
                return [float(s) for s in scores[:expected_count]]
        except Exception:
            pass

        # Fallback: return neutral scores
        return [5.0] * expected_count
