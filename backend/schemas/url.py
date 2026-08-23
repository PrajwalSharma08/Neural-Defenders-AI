"""
SentinelShield AI — URL / Link Shield Schemas (Pydantic v2).
"""
from __future__ import annotations

from typing import List, Optional
from urllib.parse import urlparse

from pydantic import BaseModel, Field, field_validator


class URLScanRequest(BaseModel):
    """Input schema for /api/v1/scan-url."""

    url: str = Field(
        ...,
        min_length=7,
        max_length=2048,
        description="The URL to inspect for phishing indicators.",
    )
    user_agent_hint: Optional[str] = Field(
        default=None,
        max_length=256,
        description="Optional UA string hint for context.",
    )

    @field_validator("url")
    @classmethod
    def validate_url_structure(cls, v: str) -> str:
        v = v.strip()
        try:
            parsed = urlparse(v)
            if parsed.scheme not in ("http", "https"):
                raise ValueError("Only http:// and https:// URLs are accepted.")
            if not parsed.netloc:
                raise ValueError("URL must have a valid network location (domain).")
            # Reject data: and javascript: URIs embedded in the path
            lowered = v.lower()
            for forbidden in ("javascript:", "data:", "vbscript:"):
                if forbidden in lowered:
                    raise ValueError(f"Forbidden URI scheme detected: {forbidden}")
        except ValueError:
            raise
        except Exception as exc:
            raise ValueError(f"Invalid URL: {exc}") from exc
        return v


class ThreatIndicator(BaseModel):
    """A single phishing threat indicator."""

    indicator_type: str = Field(..., max_length=64)
    description: str = Field(..., max_length=512)
    severity: float = Field(..., ge=0.0, le=1.0)


class URLScanResponse(BaseModel):
    """Structured scan result returned by Link Shield."""

    url: str
    domain: str
    is_https: bool
    entropy_score: float = Field(..., ge=0.0, le=1.0, description="Shannon entropy of the full URL (normalised 0-1).")
    typosquatting_detected: bool
    typosquatting_target: Optional[str] = Field(default=None, description="Brand that is being impersonated.")
    is_shortened: bool
    has_ip_address: bool
    suspicious_tld: bool
    redirect_depth: int = Field(default=0, ge=0)
    threat_indicators: List[ThreatIndicator] = Field(default_factory=list)
    phishing_score: float = Field(..., ge=0.0, le=1.0)
    verdict: str = Field(..., description="SAFE | SUSPICIOUS | PHISHING")
    scan_ms: float = Field(..., ge=0.0)
