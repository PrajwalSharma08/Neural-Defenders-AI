"""
SentinelShield AI — SMS / Message Shield Schemas (Pydantic v2).
"""
from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


class MessageScanRequest(BaseModel):
    """Input schema for /api/v1/scan-message."""

    text: str = Field(
        ...,
        min_length=1,
        max_length=10_000,
        description="The SMS, WhatsApp, or email body text to analyse.",
    )
    source_channel: Literal["sms", "whatsapp", "email", "call_transcript", "other"] = Field(
        default="sms"
    )
    language_hint: Optional[str] = Field(
        default=None,
        max_length=8,
        pattern=r"^[a-z]{2}(-[A-Z]{2})?$",
    )

    @field_validator("text")
    @classmethod
    def reject_null_bytes(cls, v: str) -> str:
        if "\x00" in v:
            raise ValueError("Null bytes are not permitted in message text.")
        return v


class ThreatPattern(BaseModel):
    """A matched digital-arrest / extortion pattern."""

    pattern_id: str
    pattern_name: str
    matched_fragment: str = Field(..., max_length=256)
    category: Literal[
        "digital_arrest",
        "financial_extortion",
        "urgency_pressure",
        "authority_impersonation",
        "personal_threat",
    ]
    weight: float = Field(..., ge=0.0, le=1.0)


class MessageScanResponse(BaseModel):
    """Structured result returned by SMS / Message Shield."""

    text_hash: str = Field(..., description="SHA-256 of input text — no plaintext stored.")
    source_channel: str
    matched_patterns: List[ThreatPattern] = Field(default_factory=list)
    total_patterns_matched: int = Field(default=0, ge=0)
    threat_score: float = Field(..., ge=0.0, le=1.0)
    verdict: Literal["SAFE", "SUSPICIOUS", "SCAM_DETECTED", "DIGITAL_ARREST_DETECTED"]
    recommended_action: str
    scan_ms: float = Field(..., ge=0.0)
