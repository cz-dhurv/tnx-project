"""
Chat API endpoint with SSE streaming.
"""

import json
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

from models.schemas import ChatRequest
from security.validation import sanitize_user_input
from observability.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.post("/api/chat")
async def chat(request: Request):
    """
    Chat with the AI tutor.
    Returns Server-Sent Events (SSE) for streaming responses.

    Events emitted:
    - message_start: {conversation_id, message_id}
    - token: {content}
    - citations: {sources: [...]}
    - message_end: {conversation_id, message_id, model, retrieval}
    - error: {message}
    """
    try:
        body = await request.json()

        # Validate request
        try:
            chat_request = ChatRequest(**body)
        except Exception as e:
            return JSONResponse(
                status_code=422,
                content={
                    "success": False,
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": str(e),
                    },
                },
            )

        # Sanitize input
        message = sanitize_user_input(chat_request.message)
        if not message:
            return JSONResponse(
                status_code=422,
                content={
                    "success": False,
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": "Message cannot be empty.",
                    },
                },
            )

        chat_service = request.app.state.chat_service

        async def event_generator():
            """Generate SSE events from the chat service."""
            try:
                async for event in chat_service.chat_stream(
                    conversation_id=chat_request.conversation_id,
                    message=message,
                    document_ids=chat_request.document_ids if chat_request.document_ids else None,
                    mode=chat_request.mode.value,
                ):
                    yield {
                        "event": event["event"],
                        "data": json.dumps(event["data"]),
                    }
            except Exception as e:
                logger.error(f"Stream error: {e}")
                yield {
                    "event": "error",
                    "data": json.dumps({"message": "Stream interrupted. Please try again."}),
                }

        return EventSourceResponse(event_generator())

    except json.JSONDecodeError:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": {
                    "code": "INVALID_JSON",
                    "message": "Request body must be valid JSON.",
                },
            },
        )
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An internal error occurred.",
                },
            },
        )


@router.get("/api/conversations")
async def list_conversations(request: Request):
    """List all conversations."""
    try:
        db_repo = request.app.state.db_repo
        conversations = await db_repo.list_conversations()
        return {"success": True, "data": conversations}
    except Exception as e:
        logger.error(f"List conversations failed: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {"code": "INTERNAL_ERROR", "message": "Failed to list conversations."},
            },
        )


@router.get("/api/conversations/{conversation_id}")
async def get_conversation(request: Request, conversation_id: str):
    """Get a conversation with all messages."""
    try:
        db_repo = request.app.state.db_repo
        conv = await db_repo.get_conversation(conversation_id)
        if not conv:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "error": {"code": "NOT_FOUND", "message": "Conversation not found."},
                },
            )
        return {"success": True, "data": conv}
    except Exception as e:
        logger.error(f"Get conversation failed: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {"code": "INTERNAL_ERROR", "message": "Failed to get conversation."},
            },
        )


@router.delete("/api/conversations/{conversation_id}")
async def delete_conversation(request: Request, conversation_id: str):
    """Delete a conversation."""
    try:
        db_repo = request.app.state.db_repo
        deleted = await db_repo.delete_conversation(conversation_id)
        if not deleted:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "error": {"code": "NOT_FOUND", "message": "Conversation not found."},
                },
            )
        return {"success": True, "data": {"deleted": True}}
    except Exception as e:
        logger.error(f"Delete conversation failed: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {"code": "INTERNAL_ERROR", "message": "Failed to delete conversation."},
            },
        )
