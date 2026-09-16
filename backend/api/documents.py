"""
Document upload and management API endpoints.
"""

from fastapi import APIRouter, UploadFile, File, Request, HTTPException
from fastapi.responses import JSONResponse

from models.schemas import DocumentUploadResponse, DocumentListResponse, DocumentResponse
from observability.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.post("/api/upload")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
):
    """
    Upload and ingest a document.
    Accepts PDF, TXT, MD, DOCX. Max 25MB.
    """
    try:
        doc_service = request.app.state.document_service

        # Read file data
        file_data = await file.read()

        # Run ingestion pipeline
        doc = await doc_service.ingest_document(
            filename=file.filename or "unknown",
            content_type=file.content_type,
            file_data=file_data,
        )

        return JSONResponse(
            status_code=201,
            content={
                "success": True,
                "data": doc,
            },
        )

    except ValueError as e:
        # Validation error
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
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "UPLOAD_FAILED",
                    "message": "Document processing failed. Please try again.",
                },
            },
        )


@router.get("/api/documents")
async def list_documents(request: Request):
    """List all uploaded documents."""
    try:
        db_repo = request.app.state.db_repo
        docs = await db_repo.list_documents()
        return {"success": True, "data": docs}
    except Exception as e:
        logger.error(f"List documents failed: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {"code": "INTERNAL_ERROR", "message": "Failed to list documents."},
            },
        )


@router.get("/api/documents/{document_id}")
async def get_document(request: Request, document_id: str):
    """Get a single document by ID."""
    try:
        db_repo = request.app.state.db_repo
        doc = await db_repo.get_document(document_id)
        if not doc:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "error": {"code": "NOT_FOUND", "message": "Document not found."},
                },
            )
        return {"success": True, "data": doc}
    except Exception as e:
        logger.error(f"Get document failed: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {"code": "INTERNAL_ERROR", "message": "Failed to get document."},
            },
        )


@router.delete("/api/documents/{document_id}")
async def delete_document(request: Request, document_id: str):
    """Delete a document and its vectors."""
    try:
        doc_service = request.app.state.document_service
        deleted = await doc_service.delete_document(document_id)
        if not deleted:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "error": {"code": "NOT_FOUND", "message": "Document not found."},
                },
            )
        return {"success": True, "data": {"deleted": True}}
    except Exception as e:
        logger.error(f"Delete document failed: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {"code": "INTERNAL_ERROR", "message": "Failed to delete document."},
            },
        )
