"""
Health and readiness API endpoints.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Request

from models.schemas import HealthResponse, ReadinessResponse

router = APIRouter()


@router.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Basic health check — always returns 200 if the server is up."""
    return HealthResponse(
        status="ok",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/api/ready", response_model=ReadinessResponse)
async def readiness_check(request: Request):
    """
    Readiness check — verifies all dependencies are available.
    Returns 503 if any critical dependency is down.
    """
    checks = {}

    # Check database
    try:
        db = request.app.state.db
        await db.conn.execute("SELECT 1")
        checks["database"] = True
    except Exception:
        checks["database"] = False

    # Check vector DB
    try:
        vector_repo = request.app.state.vector_repo
        checks["vector_db"] = vector_repo.is_connected()
    except Exception:
        checks["vector_db"] = False

    all_ready = all(checks.values())

    response = ReadinessResponse(ready=all_ready, checks=checks)

    if not all_ready:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=503,
            content=response.model_dump(),
        )

    return response
