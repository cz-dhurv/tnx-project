"""
Application configuration loaded from environment variables.
Validates all required vars at startup — crashes immediately if missing.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from pathlib import Path


class Settings(BaseSettings):
    """All configuration via env vars. No hard-coded secrets."""

    # --- Gemini ---
    gemini_api_key: str = Field(..., description="Gemini API key")
    gemini_model: str = Field("gemini-3.6-flash", description="Gemini generation model")
    gemini_embedding_model: str = Field("gemini-embedding-001", description="Gemini embedding model")

    # --- Vector Database ---
    qdrant_url: str = Field("http://localhost:6333", description="Qdrant server URL")
    qdrant_collection: str = Field("campus_ai_docs", description="Qdrant collection name")

    # --- RAG Tuning ---
    chunk_size: int = Field(1000, description="Max characters per chunk")
    chunk_overlap: int = Field(200, description="Overlap between chunks")
    retrieval_top_k: int = Field(20, description="Candidates from vector search")
    rerank_top_k: int = Field(8, description="Candidates after reranking")
    final_context_chunks: int = Field(5, description="Chunks sent to LLM")

    # --- Upload ---
    max_file_size_mb: int = Field(25, description="Max upload file size in MB")

    # --- Server ---
    backend_port: int = Field(8000, description="Backend server port")
    cors_origins: str = Field("http://localhost:3000", description="Comma-separated CORS origins")

    # --- Paths ---
    storage_dir: Path = Field(default=Path(__file__).parent / "storage", description="Upload storage directory")
    db_path: Path = Field(default=Path(__file__).parent / "data" / "campus_ai.db", description="SQLite database path")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024


def get_settings() -> Settings:
    """Factory that loads and validates settings. Crashes on missing required vars."""
    return Settings()
