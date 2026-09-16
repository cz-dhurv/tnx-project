"""
Abstract base classes for LLM and Embedding providers.
The rest of the application depends on these interfaces, not concrete SDKs.
"""

from abc import ABC, abstractmethod
from typing import AsyncIterator


class LLMProvider(ABC):
    """Interface for text generation providers."""

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system: str = "",
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        """Generate a complete text response."""
        ...

    @abstractmethod
    async def stream(
        self,
        prompt: str,
        system: str = "",
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        """Stream text response token by token."""
        ...


class EmbeddingProvider(ABC):
    """Interface for embedding providers."""

    @abstractmethod
    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a list of document texts."""
        ...

    @abstractmethod
    async def embed_query(self, text: str) -> list[float]:
        """Generate embedding for a single query."""
        ...
