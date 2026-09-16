"""Voice API routes — token minting, voice sessions, outbound calls.

Token minting adapted from the local-voice-ai reference repository.
Outbound call dispatch adapted from the Murf Challenge reference.
"""

import json
import random
import re
import uuid
from datetime import timedelta

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from observability.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/voice", tags=["voice"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class VoiceTokenRequest(BaseModel):
    conversation_id: str | None = None


class VoiceTokenResponse(BaseModel):
    token: str
    url: str
    room_name: str
    identity: str


class OutboundCallRequest(BaseModel):
    phone_number: str = Field(..., description="E.164 or 10-digit Indian mobile")
    conversation_id: str | None = None
    topic: str | None = None


class CallStatusResponse(BaseModel):
    call_id: str
    room_name: str
    status: str
    phone_number_masked: str


# ---------------------------------------------------------------------------
# Token endpoint — mints a short-lived LiveKit access token
# ---------------------------------------------------------------------------

@router.post("/token", response_model=VoiceTokenResponse)
async def voice_token(body: VoiceTokenRequest, request: Request):
    """Mint a LiveKit access token for browser voice sessions.

    The browser uses this token to connect to a LiveKit room where the
    CampusAI voice agent will join automatically via agent dispatch.
    """
    try:
        from livekit import api as lk_api
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="LiveKit SDK not installed. Install livekit-api>=0.8",
        )

    cfg = request.app.state.config

    livekit_url = getattr(cfg, "livekit_url", "") or ""
    livekit_api_key = getattr(cfg, "livekit_api_key", "") or ""
    livekit_api_secret = getattr(cfg, "livekit_api_secret", "") or ""

    if not livekit_url or not livekit_api_key or not livekit_api_secret:
        raise HTTPException(
            status_code=503,
            detail="LiveKit credentials not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET.",
        )

    participant_identity = f"student_{uuid.uuid4().hex[:8]}"
    room_name = f"campusai-tutor-{uuid.uuid4().hex[:12]}"

    token = (
        lk_api.AccessToken(livekit_api_key, livekit_api_secret)
        .with_identity(participant_identity)
        .with_name("Student")
        .with_ttl(timedelta(minutes=30))
        .with_grants(
            lk_api.VideoGrants(
                room=room_name,
                room_join=True,
                can_publish=True,
                can_publish_data=True,
                can_subscribe=True,
            )
        )
        .with_room_config(
            lk_api.RoomConfiguration(
                agents=[lk_api.RoomAgentDispatch(agent_name="")]
            )
        )
    )

    logger.info("Minted voice token: room=%s identity=%s", room_name, participant_identity)

    return VoiceTokenResponse(
        token=token.to_jwt(),
        url=livekit_url,
        room_name=room_name,
        identity=participant_identity,
    )


# ---------------------------------------------------------------------------
# Outbound call endpoint
# ---------------------------------------------------------------------------

def _validate_phone(raw: str) -> str:
    """Validate and normalize to E.164 Indian mobile."""
    clean = re.sub(r"[^0-9+]", "", raw)
    if clean.startswith("+91"):
        digits = clean[3:]
    elif clean.startswith("91") and len(clean) >= 12:
        digits = clean[2:]
    else:
        digits = clean.lstrip("+")

    if len(digits) != 10 or digits[0] not in "6789":
        raise HTTPException(
            status_code=422,
            detail=f"Invalid Indian mobile number: {raw}",
        )
    return f"+91{digits}"


@router.post("/calls", response_model=CallStatusResponse)
async def create_outbound_call(body: OutboundCallRequest, request: Request):
    """Create an outbound AI tutoring phone call.

    Dispatches the CampusAI voice agent into a fresh LiveKit room, then
    creates a SIP participant that dials the student's phone via Twilio.
    """
    try:
        from livekit import api as lk_api
    except ImportError:
        raise HTTPException(status_code=503, detail="LiveKit SDK not installed.")

    cfg = request.app.state.config
    livekit_url = getattr(cfg, "livekit_url", "") or ""
    livekit_api_key = getattr(cfg, "livekit_api_key", "") or ""
    livekit_api_secret = getattr(cfg, "livekit_api_secret", "") or ""
    trunk_id = getattr(cfg, "livekit_sip_outbound_trunk_id", "") or ""

    if not livekit_url or not livekit_api_key or not livekit_api_secret:
        raise HTTPException(status_code=503, detail="LiveKit credentials not configured.")
    if not trunk_id:
        raise HTTPException(status_code=503, detail="SIP outbound trunk not configured.")

    phone_e164 = _validate_phone(body.phone_number)
    call_id = uuid.uuid4().hex[:16]
    room_name = f"campusai-call-{call_id}"

    # Build metadata for the agent
    meta = {
        "phone_number": phone_e164,
        "topic": body.topic or "",
        "conversation_id": body.conversation_id or "",
        "call_id": call_id,
    }

    lk = lk_api.LiveKitAPI(
        url=livekit_url,
        api_key=livekit_api_key,
        api_secret=livekit_api_secret,
    )
    try:
        # Dispatch the voice agent into the room
        await lk.agent_dispatch.create_dispatch(
            lk_api.CreateAgentDispatchRequest(
                agent_name="",
                room=room_name,
                metadata=json.dumps(meta, ensure_ascii=False),
            )
        )
    except Exception as e:
        logger.error("Failed to dispatch agent for outbound call: %s", e)
        raise HTTPException(status_code=502, detail="Failed to dispatch voice agent.")
    finally:
        await lk.aclose()

    # Mask phone for response
    masked = f"+91 XXXXX {phone_e164[-5:]}"

    logger.info("Outbound call created: call_id=%s room=%s phone=%s", call_id, room_name, masked)

    return CallStatusResponse(
        call_id=call_id,
        room_name=room_name,
        status="QUEUED",
        phone_number_masked=masked,
    )


# ---------------------------------------------------------------------------
# Voice config endpoint — public info only
# ---------------------------------------------------------------------------

@router.get("/config")
async def voice_config(request: Request):
    """Return public voice configuration (no secrets)."""
    cfg = request.app.state.config
    livekit_url = getattr(cfg, "livekit_url", "") or ""

    return {
        "voice_enabled": bool(livekit_url),
        "calling_enabled": bool(getattr(cfg, "livekit_sip_outbound_trunk_id", "")),
    }
