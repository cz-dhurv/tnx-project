"""
FastAPI application entry point.
Initializes all dependencies, mounts routers, configures CORS and lifespan.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from models.database import Database
from providers.gemini import GeminiProvider
from repositories.vector_repo import VectorRepository
from repositories.db_repo import DBRepository
from services.document_service import DocumentService
from services.chat_service import ChatService
from api import health, documents, chat
from observability.logger import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Initializes all dependencies on startup, cleans up on shutdown.
    """
    settings = get_settings()

    # ── Initialize Database ──
    db = Database(settings.db_path)
    await db.connect()
    app.state.db = db

    # ── Initialize Gemini Provider ──
    gemini = GeminiProvider(
        api_key=settings.gemini_api_key,
        model=settings.gemini_model,
        embedding_model=settings.gemini_embedding_model,
    )
    app.state.gemini = gemini

    # ── Initialize Vector Repository ──
    vector_repo = VectorRepository(
        url=settings.qdrant_url,
        collection_name=settings.qdrant_collection,
    )
    try:
        await vector_repo.connect()
    except Exception as e:
        logger.error(f"Qdrant connection failed (will retry on use): {e}")
    app.state.vector_repo = vector_repo

    # ── Initialize DB Repository ──
    db_repo = DBRepository(db)
    app.state.db_repo = db_repo

    # ── Initialize Services ──
    app.state.document_service = DocumentService(
        embedding_provider=gemini,
        vector_repo=vector_repo,
        db_repo=db_repo,
        storage_dir=settings.storage_dir,
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        max_file_size_bytes=settings.max_file_size_bytes,
    )

    app.state.chat_service = ChatService(
        llm=gemini,
        embedder=gemini,
        vector_repo=vector_repo,
        db_repo=db_repo,
        retrieval_top_k=settings.retrieval_top_k,
        rerank_top_k=settings.rerank_top_k,
        final_context_chunks=settings.final_context_chunks,
        model_name=settings.gemini_model,
    )

    logger.info("🚀 CampusAI Backend started successfully")

    yield  # App runs here

    # ── Cleanup ──
    await db.disconnect()
    logger.info("CampusAI Backend shut down")


# ── Create FastAPI App ──
app = FastAPI(
    title="CampusAI Backend",
    description="RAG-powered AI Tutor backend for CampusAI",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ──
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount Routers ──
app.include_router(health.router)
app.include_router(documents.router)
app.include_router(chat.router)
