"""
SentinelShield AI — Enterprise n8n Incident Response Dispatcher.

Fires asynchronous HMAC-authenticated webhook POST requests to n8n
when risk scores exceed configured thresholds.

Actions triggered on Red Alert (R_final > 0.85):
  1. Banking freeze initiation
  2. Step-up MFA challenge
  3. Security alert to admin channel

Security:
  - HMAC-SHA256 request signing (X-Sentinel-Signature header)
  - Async / non-blocking (httpx AsyncClient)
  - Exponential backoff retry (3 attempts)
  - Zero secrets in code — all from Settings
"""
from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import logging
import time
from typing import Any, Dict, Optional

import httpx

from backend.core.config import get_settings

logger = logging.getLogger("sentinelshield.n8n_dispatcher")

MAX_RETRIES = 3
BACKOFF_BASE = 1.5  # seconds


def _sign_payload(payload_bytes: bytes, secret: str) -> str:
    """Generate HMAC-SHA256 signature for the webhook payload."""
    return hmac.new(
        secret.encode("utf-8"),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()


async def _post_webhook(
    client: httpx.AsyncClient,
    url: str,
    payload: Dict[str, Any],
    secret: str,
) -> bool:
    """POST a signed JSON payload with exponential backoff retry."""
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    signature = _sign_payload(payload_bytes, secret)
    headers = {
        "Content-Type": "application/json",
        "X-Sentinel-Signature": f"sha256={signature}",
        "X-Sentinel-Timestamp": str(int(time.time())),
    }

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = await client.post(
                url, content=payload_bytes, headers=headers, timeout=10.0
            )
            if response.status_code < 300:
                logger.info("n8n webhook OK [%s] attempt=%d", url, attempt)
                return True
            logger.warning(
                "n8n webhook returned %d [%s] attempt=%d",
                response.status_code, url, attempt,
            )
        except httpx.RequestError as exc:
            logger.error("n8n webhook request error [%s] attempt=%d: %s", url, attempt, exc)

        if attempt < MAX_RETRIES:
            wait = BACKOFF_BASE ** attempt
            logger.info("Retrying n8n webhook in %.1fs", wait)
            await asyncio.sleep(wait)

    logger.error("n8n webhook FAILED after %d attempts [%s]", MAX_RETRIES, url)
    return False


async def dispatch_red_alert(
    session_id: str,
    risk_score: float,
    attestation_hash: str,
    verdict: str,
    extra_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, bool]:
    """
    Fire all three n8n incident response webhooks concurrently.

    Returns a dict mapping action -> success bool.
    """
    settings = get_settings()
    if not settings.n8n_webhook_base_url or not settings.n8n_webhook_secret:
        logger.info("n8n webhooks not configured — skipping dispatch (dry run mode)")
        return {"banking_freeze": False, "mfa_challenge": False, "security_alert": False}

    base_payload: Dict[str, Any] = {
        "session_id": session_id,
        "risk_score": risk_score,
        "verdict": verdict,
        "attestation_hash": attestation_hash,
        "triggered_at": int(time.time()),
        "system": "SentinelShield AI",
        "sih_ref": "SIH26104_AICTE",
    }
    if extra_context:
        base_payload["context"] = extra_context

    banking_url = settings.n8n_webhook_base_url + settings.n8n_banking_freeze_path
    mfa_url = settings.n8n_webhook_base_url + settings.n8n_mfa_challenge_path
    alert_url = settings.n8n_webhook_base_url + settings.n8n_security_alert_path

    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(
            _post_webhook(client, banking_url, {**base_payload, "action": "banking_freeze"}, settings.n8n_webhook_secret),
            _post_webhook(client, mfa_url, {**base_payload, "action": "mfa_challenge"}, settings.n8n_webhook_secret),
            _post_webhook(client, alert_url, {**base_payload, "action": "security_alert"}, settings.n8n_webhook_secret),
            return_exceptions=False,
        )

    outcome = {
        "banking_freeze": bool(results[0]),
        "mfa_challenge": bool(results[1]),
        "security_alert": bool(results[2]),
    }
    logger.info("n8n dispatch complete for session %s: %s", session_id, outcome)
    return outcome
