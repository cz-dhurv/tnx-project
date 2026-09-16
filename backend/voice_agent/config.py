"""Voice agent configuration — env-driven, never committed."""

from __future__ import annotations

import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


@dataclass
class VoiceConfig:
    """All voice-related configuration from environment variables."""

    # LiveKit
    livekit_url: str = ""
    livekit_api_key: str = ""
    livekit_api_secret: str = ""

    # Deepgram STT
    deepgram_api_key: str = ""

    # Murf TTS
    murf_api_key: str = ""

    # Gemini LLM (reuses existing GEMINI_API_KEY)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.6-flash"

    # RAG backend URL (our own FastAPI server)
    rag_backend_url: str = "http://127.0.0.1:8000"

    # Outbound calling
    livekit_sip_outbound_trunk_id: str = ""

    # Rate limits
    max_call_duration_seconds: int = 600  # 10 min
    max_outbound_calls_per_hour: int = 10

    @classmethod
    def from_env(cls) -> "VoiceConfig":
        return cls(
            livekit_url=os.getenv("LIVEKIT_URL", ""),
            livekit_api_key=os.getenv("LIVEKIT_API_KEY", ""),
            livekit_api_secret=os.getenv("LIVEKIT_API_SECRET", ""),
            deepgram_api_key=os.getenv("DEEPGRAM_API_KEY", ""),
            murf_api_key=os.getenv("MURF_API_KEY", ""),
            gemini_api_key=os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", "")),
            gemini_model=os.getenv("GEMINI_MODEL", "gemini-3.6-flash"),
            rag_backend_url=os.getenv("RAG_BACKEND_URL", "http://127.0.0.1:8000"),
            livekit_sip_outbound_trunk_id=os.getenv("LIVEKIT_SIP_OUTBOUND_TRUNK_ID", ""),
            max_call_duration_seconds=int(os.getenv("MAX_CALL_DURATION_SECONDS", "600")),
            max_outbound_calls_per_hour=int(os.getenv("MAX_OUTBOUND_CALLS_PER_HOUR", "10")),
        )
