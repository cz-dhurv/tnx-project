"""
Pydantic schemas for API request/response models.
Strongly typed — no `any`. Follows the standard response envelope.
"""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


# ── Enums ──────────────────────────────────────────────

class DocumentStatus(str, Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class ChatMode(str, Enum):
    RAG = "rag"
    CHAT = "chat"


# ── Chat ───────────────────────────────────────────────

class ChatRequest(BaseModel):
    """Incoming chat message from the frontend."""
    conversation_id: Optional[str] = Field(None, description="Existing conversation ID, or null for new")
    message: str = Field(..., min_length=1, max_length=10000, description="User message text")
    document_ids: list[str] = Field(default_factory=list, description="Filter retrieval to these docs")
    mode: ChatMode = Field(default=ChatMode.RAG, description="rag or chat mode")


class Citation(BaseModel):
    """A single source citation attached to an AI response."""
    citation_id: int = Field(..., description="Citation number [1], [2], etc.")
    document_id: str
    filename: str
    page: Optional[int] = None
    section: Optional[str] = None
    chunk_id: str
    snippet: str = Field(..., description="Relevant text excerpt")


class RetrievalInfo(BaseModel):
    """Metadata about what the RAG pipeline retrieved."""
    query_used: str
    chunks_retrieved: int
    chunks_used: int


class ChatResponse(BaseModel):
    """Full chat response (non-streaming)."""
    conversation_id: str
    message_id: str
    answer: str
    citations: list[Citation] = Field(default_factory=list)
    retrieval: Optional[RetrievalInfo] = None
    model: str
    usage: Optional[dict] = None


# ── Documents ──────────────────────────────────────────

class DocumentResponse(BaseModel):
    """Document metadata returned to the frontend."""
    document_id: str
    filename: str
    mime_type: str
    size_bytes: int
    status: DocumentStatus
    chunk_count: int = 0
    topics: list[str] = Field(default_factory=list)
    error_message: Optional[str] = None
    created_at: str
    updated_at: str


class DocumentUploadResponse(BaseModel):
    """Response after uploading a document."""
    success: bool = True
    data: DocumentResponse


class DocumentListResponse(BaseModel):
    """List of all documents."""
    success: bool = True
    data: list[DocumentResponse]


# ── Conversations ──────────────────────────────────────

class MessageResponse(BaseModel):
    """A single message in a conversation."""
    message_id: str
    sender: str  # "user" or "ai"
    text: str
    citations: list[Citation] = Field(default_factory=list)
    time: str


class ConversationResponse(BaseModel):
    """A conversation with its messages."""
    conversation_id: str
    title: Optional[str] = None
    messages: list[MessageResponse] = Field(default_factory=list)
    created_at: str
    updated_at: str


class ConversationListResponse(BaseModel):
    """List of conversations."""
    success: bool = True
    data: list[ConversationResponse]


# ── Standard Envelope ──────────────────────────────────

class SuccessResponse(BaseModel):
    """Standard success envelope."""
    success: bool = True
    data: dict = Field(default_factory=dict)


class ErrorDetail(BaseModel):
    """Error detail inside the envelope."""
    code: str
    message: str
    fields: Optional[dict] = None


class ErrorResponse(BaseModel):
    """Standard error envelope."""
    success: bool = False
    error: ErrorDetail


# ── Health ─────────────────────────────────────────────

class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "ok"
    timestamp: str
    version: str = "0.1.0"


class ReadinessResponse(BaseModel):
    """Readiness check — reports each dependency."""
    ready: bool
    checks: dict[str, bool]
