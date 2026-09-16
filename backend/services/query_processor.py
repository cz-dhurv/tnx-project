"""
Query processing service.
Normalizes queries, detects follow-ups, rewrites for better retrieval.
"""

import re

from providers.base import LLMProvider
from prompts.system import build_query_rewrite_prompt
from observability.logger import get_logger

logger = get_logger(__name__)

# Patterns that suggest a follow-up question
FOLLOW_UP_PATTERNS = [
    r"^(what|how|why|when|where|who)\s+(about|regarding|of)\s+(that|this|it|them)\b",
    r"^(and|also|plus|additionally)\s+",
    r"^(tell me more|elaborate|explain further|go deeper|expand on)",
    r"^(the (second|third|first|last|next|other) one)",
    r"^(what about|how about)\b",
    r"^(can you|could you)\s+(also|further|additionally)",
    r"\b(it|that|this|they|them|those|these)\b",  # Pronouns referencing prior context
]

FOLLOW_UP_RE = [re.compile(p, re.IGNORECASE) for p in FOLLOW_UP_PATTERNS]


def normalize_query(query: str) -> str:
    """
    Basic query normalization.
    - Strip whitespace
    - Collapse multiple spaces
    - Remove control characters
    """
    query = query.strip()
    query = re.sub(r"\s+", " ", query)
    query = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", query)
    return query


def is_follow_up(query: str, conversation_history: list[dict]) -> bool:
    """
    Heuristic check: does this query depend on prior conversation context?
    Only considers it a follow-up if there IS prior conversation.
    """
    if not conversation_history or len(conversation_history) < 2:
        return False

    query_lower = query.lower().strip()

    # Very short queries are likely follow-ups
    if len(query_lower.split()) <= 3:
        return True

    # Check against follow-up patterns
    for pattern in FOLLOW_UP_RE:
        if pattern.search(query_lower):
            return True

    return False


async def rewrite_query(
    query: str,
    conversation_history: list[dict],
    llm: LLMProvider,
) -> str:
    """
    Use the LLM to rewrite a follow-up query into a standalone query.
    Only called when is_follow_up() returns True.
    """
    try:
        prompt = build_query_rewrite_prompt(query, conversation_history)
        rewritten = await llm.generate(
            prompt=prompt,
            system="You are a query rewriting assistant. Return only the rewritten query.",
            temperature=0.1,
            max_tokens=200,
        )
        rewritten = rewritten.strip().strip('"').strip("'")

        if rewritten and len(rewritten) > 3:
            logger.info(f"Query rewritten: '{query}' → '{rewritten}'")
            return rewritten

        return query  # Fall back to original
    except Exception as e:
        logger.error(f"Query rewrite failed: {e}")
        return query  # Fall back to original on error
