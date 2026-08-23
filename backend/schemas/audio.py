"""
SentinelShield AI — Audio / Voice Telemetry Schemas (Pydantic v2).
"""
from __future__ import annotations

from typing import Literal, Optional, List

from pydantic import BaseModel, Field, field_validator


class AudioChunkMeta(BaseModel):
    """Metadata attached to each 200ms WebSocket audio chunk."""

    session_id: str = Field(
        ...,
        min_length=8,
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Unique session identifier for this voice analysis session.",
    )
    chunk_index: int = Field(..., ge=0, le=100_000)
    sample_rate: int = Field(default=16000, ge=8000, le=48000)
    encoding: Literal["pcm_s16le", "pcm_f32le"] = Field(default="pcm_s16le")
    language_hint: Optional[str] = Field(
        default=None,
        max_length=8,
        pattern=r"^[a-z]{2}(-[A-Z]{2})?$",
        description="BCP-47 language code hint (e.g. 'en', 'hi-IN').",
    )

    @field_validator("session_id")
    @classmethod
    def no_path_traversal(cls, v: str) -> str:
        if ".." in v or "/" in v or "\\" in v:
            raise ValueError("session_id must not contain path separators")
        return v


class VoiceAnalysisResponse(BaseModel):
    """Structured response for voice analysis with VAD & temporal accumulator."""

    session_id: str
    chunk_index: int
    risk_score: float = Field(..., ge=0.0, le=1.0, description="Final AI voice risk score R_final in [0, 1].")
    snr_db: float = Field(..., description="Estimated SNR in dB for this chunk.")
    phase_variance: float = Field(..., ge=0.0)
    pitch_jitter: float = Field(..., ge=0.0)
    spectral_centroid_stability: float = Field(..., ge=0.0)
    verdict: str = Field(..., description="HUMAN | AI_SUSPECTED | AI_DETECTED | DEGRADED_SIGNAL | SILENCE | LISTENING")
    attestation_hash: str = Field(..., min_length=64, max_length=64, description="HMAC-SHA256 TEE attestation token.")
    processing_ms: float = Field(..., ge=0.0, description="End-to-end DSP processing time in milliseconds.")
    red_alert: bool = Field(default=False, description="True if risk_score > RED_ALERT_THRESHOLD.")
    is_speaking: bool = Field(default=False, description="True if voice activity is detected.")
    speech_seconds: float = Field(default=0.0, ge=0.0, description="Total active speech duration accumulated in current window.")


class VoiceSessionSummary(BaseModel):
    """Aggregated forensic summary across all chunks in a session."""

    session_id: str
    total_chunks: int = Field(..., ge=1)
    duration_seconds: float = Field(..., gt=0)
    speech_duration_seconds: float = Field(default=0.0, ge=0.0)
    mean_risk_score: float = Field(..., ge=0.0, le=1.0)
    peak_risk_score: float = Field(..., ge=0.0, le=1.0)
    verdict: str
    red_alerts_fired: int = Field(default=0, ge=0)
    attestation_chain: list[str] = Field(default_factory=list)
