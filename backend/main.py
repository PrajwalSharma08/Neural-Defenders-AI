"""
SentinelShield AI — FastAPI Application Entry Point.

Architecture:
  - Global exception middleware (no stack trace leakage)
  - Security headers middleware
  - SlowAPI rate limiting (per-IP, configurable tiers from .env)
  - Strict Pydantic v2 schema validation on all endpoints
  - WebSocket endpoint for 200ms real-time audio streaming
  - REST endpoints for URL and SMS scanning
  - In-memory forensic PDF generation & streaming
"""
import asyncio
import io
import json
import logging
import os
import sys
import time
import uuid
import numpy as np
from pathlib import Path

# Ensure parent directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Dict, List, Optional, Any

from fastapi import (
    FastAPI, File, HTTPException, Request, Response,
    UploadFile, WebSocket, WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from backend.core.config import get_settings
from backend.core.security import (
    GlobalExceptionMiddleware,
    SecurityHeadersMiddleware,
    validate_upload_file,
    ALLOWED_AUDIO_MIMES,
)
from backend.schemas.audio import AudioChunkMeta, VoiceAnalysisResponse, VoiceSessionSummary
from backend.schemas.url import URLScanRequest, URLScanResponse
from backend.schemas.message import MessageScanRequest, MessageScanResponse
from backend.services.voice_dsp import analyze_audio_chunk, decode_audio_file_bytes
from backend.services.link_shield import EntropyScanner, TyposquattingDetector
from backend.services.sms_shield import get_sms_shield
from backend.services.n8n_dispatcher import dispatch_red_alert
from backend.services.forensic_pdf import generate_forensic_pdf

# ---------------------------------------------------------------------------
# Logging Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("sentinelshield.main")

settings = get_settings()

# ---------------------------------------------------------------------------
# Rate Limiter (SlowAPI)
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address, default_limits=[])


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("SentinelShield AI starting up in '%s' environment...", settings.app_env)
    # Warm up singleton services
    _ = get_sms_shield()
    logger.info("SMS Shield Aho-Corasick automaton initialized.")
    yield
    logger.info("SentinelShield AI shutting down.")


# ---------------------------------------------------------------------------
# FastAPI App Initialization
# ---------------------------------------------------------------------------
app = FastAPI(
    title="SentinelShield AI",
    description=(
        "Enterprise Sub-Second Voice Integrity, Phishing & Digital Arrest Defense Platform. "
        "SIH26104 — AICTE Smart India Hackathon 2026."
    ),
    version="1.0.0",
    docs_url="/api/docs" if settings.app_env != "production" else None,
    redoc_url="/api/redoc" if settings.app_env != "production" else None,
    openapi_url="/api/openapi.json" if settings.app_env != "production" else None,
    lifespan=lifespan,
)

# SlowAPI exception handling & state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Middleware stack
app.add_middleware(GlobalExceptionMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Singleton Service Instances
# ---------------------------------------------------------------------------
_entropy_scanner = EntropyScanner()
_typosquatting_detector = TyposquattingDetector()


# ---------------------------------------------------------------------------
# Health Check Endpoint
# ---------------------------------------------------------------------------
@app.get("/api/v1/health", tags=["meta"])
@limiter.limit(f"{settings.rate_limit_public}/minute")
async def health_check(request: Request) -> JSONResponse:
    """System liveness and security status probe."""
    return JSONResponse({
        "status": "operational",
        "service": "SentinelShield AI",
        "version": "1.0.0",
        "sih_ref": "SIH26104_AICTE",
        "env": settings.app_env,
        "tee_guard": "active",
        "timestamp": int(time.time()),
    })


# ---------------------------------------------------------------------------
# Phishing URL Scanning Endpoint
# ---------------------------------------------------------------------------
@app.post("/api/v1/scan-url", response_model=URLScanResponse, tags=["link-shield"])
@limiter.limit(f"{settings.rate_limit_public}/minute")
async def scan_url(request: Request, body: URLScanRequest) -> URLScanResponse:
    """
    Scan a URL for phishing indicators, typosquatting, entropy anomalies, and deceptive patterns.
    Ingests heuristics from LinkGuard-main.
    """
    scan_result = _entropy_scanner.scan(body)
    enriched = _typosquatting_detector.enrich_scan_response(scan_result, scan_result.domain)
    return enriched


# ---------------------------------------------------------------------------
# SMS / Message Scanning Endpoint
# ---------------------------------------------------------------------------
@app.post("/api/v1/scan-message", response_model=MessageScanResponse, tags=["sms-shield"])
@limiter.limit(f"{settings.rate_limit_public}/minute")
async def scan_message(request: Request, body: MessageScanRequest) -> MessageScanResponse:
    """
    Scan message text for digital arrest, extortion, urgency triggers, and impersonation.
    """
    shield = get_sms_shield()
    return shield.scan(body)


# ---------------------------------------------------------------------------
# Audio File Upload Analysis (REST Endpoint)
# ---------------------------------------------------------------------------
@app.post("/api/v1/analyze-audio", response_model=VoiceAnalysisResponse, tags=["voice-shield"])
@limiter.limit(f"{settings.rate_limit_public}/minute")
async def analyze_audio_upload(request: Request, file: UploadFile = File(...)) -> VoiceAnalysisResponse:
    """
    Analyze uploaded audio file in volatile memory (zero disk retention).
    """
    raw = validate_upload_file(file, allowed_mimes=ALLOWED_AUDIO_MIMES)
    session_id = str(uuid.uuid4())

    loop = asyncio.get_running_loop()
    pcm_bytes = decode_audio_file_bytes(raw, target_sr=settings.dsp_sample_rate)
    result = await loop.run_in_executor(
        None,
        analyze_audio_chunk,
        pcm_bytes,
        session_id,
        0,
        settings.dsp_sample_rate,
    )

    if result.red_alert:
        asyncio.create_task(
            dispatch_red_alert(
                session_id=result.session_id,
                risk_score=result.risk_score,
                attestation_hash=result.attestation_hash,
                verdict=result.verdict,
            )
        )

    return result


# ---------------------------------------------------------------------------
# In-Memory Forensic Evidence PDF Endpoint
# ---------------------------------------------------------------------------
@app.post("/api/v1/forensic-report", tags=["forensics"])
@limiter.limit(f"{settings.rate_limit_public}/minute")
async def generate_report(request: Request, body: Dict[str, Any]) -> StreamingResponse:
    """
    Generate an in-memory PDF forensic report without touching the disk.
    """
    voice_data = body.get("voice_data")
    url_data = body.get("url_data")
    sms_data = body.get("sms_data")
    session_id = str(body.get("session_id", str(uuid.uuid4())))

    if not any([voice_data, url_data, sms_data]):
        raise HTTPException(
            status_code=400,
            detail={"error": "empty_report", "message": "At least one scan telemetry record must be provided."},
        )

    loop = asyncio.get_running_loop()
    pdf_buffer: io.BytesIO = await loop.run_in_executor(
        None,
        generate_forensic_pdf,
        voice_data,
        url_data,
        sms_data,
        session_id,
    )

    filename = f"sentinelshield_forensic_{session_id[:8]}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_buffer.read()),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------------------------------------------------------------------------
# WebSocket Endpoint — 200ms Volatile Audio Stream
# ---------------------------------------------------------------------------
@app.websocket("/ws/voice-stream")
async def voice_stream_ws(websocket: WebSocket) -> None:
    """
    High-throughput, low-overhead WebSocket stream for real-time 200ms PCM chunks.
    """
    await websocket.accept()
    session_id: str = str(uuid.uuid4())
    chunk_index: int = 0
    session_start: float = time.perf_counter()
    session_results: List[VoiceAnalysisResponse] = []
    sample_rate: int = settings.dsp_sample_rate
    speech_buffer = bytearray()
    accumulated_speech_seconds: float = 0.0

    logger.info("WS connection established: session=%s", session_id)

    try:
        while True:
            message = await asyncio.wait_for(websocket.receive(), timeout=60.0)

            # JSON Control Messages
            if "text" in message:
                try:
                    ctrl = json.loads(message["text"])
                except json.JSONDecodeError:
                    await websocket.send_json({"error": "invalid_json"})
                    continue

                action = ctrl.get("action", "")

                if action == "ping":
                    await websocket.send_json({"action": "pong", "timestamp": time.time()})

                elif action == "start":
                    session_id = str(ctrl.get("session_id", session_id))[:64]
                    sample_rate = int(ctrl.get("sample_rate", settings.dsp_sample_rate))
                    session_start = time.perf_counter()
                    chunk_index = 0
                    session_results.clear()
                    speech_buffer.clear()
                    accumulated_speech_seconds = 0.0
                    logger.info("WS session initialized: %s @ %dHz", session_id, sample_rate)
                    await websocket.send_json({"action": "session_started", "session_id": session_id})

                elif action == "end_session":
                    duration = time.perf_counter() - session_start
                    voiced_results = [r for r in session_results if r.verdict not in ("SILENCE", "LISTENING")]
                    if voiced_results:
                        mean_risk = sum(r.risk_score for r in voiced_results) / len(voiced_results)
                        peak_risk = max(r.risk_score for r in voiced_results)
                        red_alerts = sum(1 for r in voiced_results if r.red_alert)

                        if peak_risk >= 0.60:
                            summary_verdict = "AI_DETECTED"
                        elif mean_risk >= 0.35:
                            summary_verdict = "AI_SUSPECTED"
                        else:
                            summary_verdict = "HUMAN"

                        summary = VoiceSessionSummary(
                            session_id=session_id,
                            total_chunks=len(session_results),
                            duration_seconds=round(duration, 2),
                            speech_duration_seconds=round(accumulated_speech_seconds, 2),
                            mean_risk_score=round(mean_risk, 4),
                            peak_risk_score=round(peak_risk, 4),
                            verdict=summary_verdict,
                            red_alerts_fired=red_alerts,
                            attestation_chain=[r.attestation_hash for r in voiced_results[-10:]],
                        )
                        await websocket.send_json({"action": "session_summary", **summary.model_dump()})

                        if red_alerts > 0:
                            asyncio.create_task(
                                dispatch_red_alert(
                                    session_id=session_id,
                                    risk_score=peak_risk,
                                    attestation_hash=voiced_results[-1].attestation_hash,
                                    verdict=summary_verdict,
                                )
                            )
                    else:
                        await websocket.send_json({"action": "session_summary", "error": "no_speech_detected"})
                    break

            # Binary Audio Chunk (200ms PCM)
            elif "bytes" in message:
                raw_pcm: bytes = message["bytes"]
                if not raw_pcm:
                    continue

                # Quick energy check for silence
                pcm_arr = np.frombuffer(raw_pcm, dtype=np.int16).astype(np.float32) / 32768.0
                chunk_rms = float(np.sqrt(np.mean(pcm_arr ** 2))) if len(pcm_arr) > 0 else 0.0
                is_chunk_voiced = chunk_rms >= 0.012

                if is_chunk_voiced:
                    speech_buffer.extend(raw_pcm)
                    # Keep rolling window of max 4.0 seconds (4 * 16000 * 2 = 128,000 bytes)
                    max_speech_bytes = int(sample_rate * 2 * 4.0)
                    if len(speech_buffer) > max_speech_bytes:
                        speech_buffer = speech_buffer[-max_speech_bytes:]
                    accumulated_speech_seconds += (len(raw_pcm) / (sample_rate * 2))

                # Analyze accumulated speech buffer if voiced, otherwise analyze single chunk
                eval_payload = bytes(speech_buffer) if (is_chunk_voiced and len(speech_buffer) >= 64) else raw_pcm

                loop = asyncio.get_running_loop()
                result = await loop.run_in_executor(
                    None,
                    analyze_audio_chunk,
                    eval_payload,
                    session_id,
                    chunk_index,
                    sample_rate,
                    accumulated_speech_seconds,
                )
                session_results.append(result)
                chunk_index += 1

                await websocket.send_json(result.model_dump())

                if result.red_alert:
                    asyncio.create_task(
                        dispatch_red_alert(
                            session_id=session_id,
                            risk_score=result.risk_score,
                            attestation_hash=result.attestation_hash,
                            verdict=result.verdict,
                        )
                    )

    except asyncio.TimeoutError:
        logger.info("WS session timeout: %s", session_id)
        await websocket.close(code=1001, reason="Idle timeout")
    except WebSocketDisconnect:
        logger.info("WS disconnected: session=%s (processed %d chunks)", session_id, chunk_index)
    except Exception as exc:
        logger.error("WS error on session %s: %s", session_id, exc)
        try:
            await websocket.close(code=1011)
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Mount Modular Glassmorphic Frontend (Zero-Build Vanilla HTML/CSS/JS)
# ---------------------------------------------------------------------------
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
frontend_dir = Path(__file__).resolve().parent.parent / "frontend"

@app.exception_handler(404)
async def custom_404_handler(request: Request, exc: Any) -> Response:
    """Interactive custom 404 handler with Back button."""
    if request.url.path.startswith("/api/"):
        return JSONResponse(
            status_code=404,
            content={
                "error": "page_not_found",
                "message": f"The requested API route '{request.url.path}' does not exist.",
            },
        )
    not_found_page = frontend_dir / "404.html"
    if not_found_page.exists():
        return FileResponse(str(not_found_page), status_code=404)
    return JSONResponse(
        status_code=404,
        content={"error": "page_not_found", "message": "Page Not Found"},
    )

if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.app_host,
        port=settings.app_port,
        log_level=settings.app_log_level.lower(),
        reload=settings.app_env == "development",
    )
