"""
Gemini provider — handles both text generation (streaming) and embeddings.
Uses the official google-genai SDK.
"""

from typing import AsyncIterator
from google import genai
from google.genai import types

from providers.base import LLMProvider, EmbeddingProvider
from observability.logger import get_logger

logger = get_logger(__name__)


class GeminiProvider(LLMProvider, EmbeddingProvider):
    """
    Unified Gemini provider for generation + embeddings.
    Implements both LLMProvider and EmbeddingProvider interfaces.
    """

    def __init__(self, api_key: str, model: str, embedding_model: str):
        self.model = model
        self.embedding_model = embedding_model
        self.client = genai.Client(api_key=api_key)
        logger.info(f"GeminiProvider initialized: generation={model}, embeddings={embedding_model}")

    async def generate(
        self,
        prompt: str,
        system: str = "",
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        """Generate a complete text response using Gemini."""
        try:
            config = types.GenerateContentConfig(
                system_instruction=system if system else None,
                temperature=temperature,
                max_output_tokens=max_tokens,
            )
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=config,
            )
            return response.text or ""
        except Exception as e:
            logger.error(f"Gemini generate error: {e}")
            raise

    async def stream(
        self,
        prompt: str,
        system: str = "",
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        """Stream text response from Gemini token by token."""
        try:
            config = types.GenerateContentConfig(
                system_instruction=system if system else None,
                temperature=temperature,
                max_output_tokens=max_tokens,
            )
            response_stream = self.client.models.generate_content_stream(
                model=self.model,
                contents=prompt,
                config=config,
            )
            for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error(f"Gemini stream error: {e}")
            raise

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a batch of texts using Gemini."""
        try:
            embeddings = []
            # Process in batches of 100 (API limit)
            batch_size = 100
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                result = self.client.models.embed_content(
                    model=self.embedding_model,
                    contents=batch,
                )
                for embedding in result.embeddings:
                    embeddings.append(embedding.values)
            logger.info(f"Embedded {len(texts)} documents")
            return embeddings
        except Exception as e:
            logger.error(f"Gemini embed_documents error: {e}")
            raise

    async def embed_query(self, text: str) -> list[float]:
        """Generate embedding for a single query."""
        try:
            result = self.client.models.embed_content(
                model=self.embedding_model,
                contents=text,
            )
            return result.embeddings[0].values
        except Exception as e:
            logger.error(f"Gemini embed_query error: {e}")
            raise
