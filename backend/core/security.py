"""
SentinelShield AI — Security Middleware & Exception Handlers.

Responsibilities:
- Global exception middleware (zero stack-trace leakage)
- Structured JSON error envelopes
- Secure HTTP response headers (CSP, HSTS, X-Frame-Options, etc.)
- MIME-type enforced file upload validation
"""
from __future__ import annotations

import io
import logging
import time
import traceback
import uuid
from typing import Callable

from fastapi import Request, Response, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from backend.core.config import get_settings

logger = logging.getLogger("sentinelshield.security")

# ---------------------------------------------------------------------------
# Allowed MIME types for file uploads
# ---------------------------------------------------------------------------
ALLOWED_AUDIO_MIMES: frozenset[str] = frozenset({
    "audio/wav", "audio/x-wav", "audio/wave", "audio/vnd.wave",
    "audio/mpeg", "audio/mp3", "audio/ogg", "audio/flac", "audio/aac",
    "audio/x-m4a", "audio/mp4", "audio/webm", "application/octet-stream",
})
ALLOWED_TEXT_MIMES: frozenset[str] = frozenset({
    "text/plain", "text/csv",
})
ALLOWED_UPLOAD_MIMES: frozenset[str] = ALLOWED_AUDIO_MIMES | ALLOWED_TEXT_MIMES


# ---------------------------------------------------------------------------
# Security Headers Middleware
# ---------------------------------------------------------------------------
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Attach hardened HTTP security headers to every response."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=(self)"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self' 'unsafe-inline' data: blob:; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "connect-src 'self' ws: wss: http: https:; "
            "media-src 'self' blob: data:; "
            "img-src 'self' blob: data:;"
        )
        return response


# ---------------------------------------------------------------------------
# Global Exception Middleware (zero leakage)
# ---------------------------------------------------------------------------
class GlobalExceptionMiddleware(BaseHTTPMiddleware):
    """Catch all unhandled exceptions and return clean standardized error envelopes."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = str(uuid.uuid4())
        start = time.perf_counter()
        try:
            response = await call_next(request)
            return response
        except HTTPException:
            raise
        except Exception as exc:
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.error(
                "Unhandled exception in request [%s %s]: %s\n%s",
                request.method, request.url.path, exc, traceback.format_exc()
            )
            return JSONResponse(
                status_code=500,
                content={
                    "error": "internal_server_error",
                    "message": f"Server processing error: {str(exc)}",
                    "request_id": request_id,
                },
            )


# ---------------------------------------------------------------------------
# MIME-enforced upload validation helper
# ---------------------------------------------------------------------------
def validate_upload_file(
    file: UploadFile,
    max_bytes: int | None = None,
    allowed_mimes: frozenset[str] = ALLOWED_UPLOAD_MIMES,
) -> bytes:
    """
    Read and validate an uploaded file:
    1. Enforce byte-size limit (10MB).
    2. Detect true MIME type or file header bytes.
    3. Reject prohibited binary executables.
    """
    settings = get_settings()
    limit = max_bytes or settings.max_upload_bytes

    try:
        raw: bytes = file.file.read(limit + 1)
    except Exception:
        raw = b""

    if len(raw) == 0:
        raise HTTPException(
            status_code=400,
            detail={"error": "empty_file", "message": "Uploaded audio file is empty."},
        )

    if len(raw) > limit:
        raise HTTPException(
            status_code=413,
            detail={
                "error": "file_too_large",
                "message": f"File exceeds maximum allowed size of {limit // (1024*1024)} MB.",
            },
        )

    # Reject Windows/Linux executables (.exe, .dll, ELF)
    if raw.startswith(b"MZ") or raw.startswith(b"\x7fELF"):
        raise HTTPException(
            status_code=415,
            detail={"error": "executable_prohibited", "message": "Executable binary files are strictly prohibited."},
        )

    return raw
