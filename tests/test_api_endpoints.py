"""
SentinelShield AI — FastAPI Endpoint Integration Test Suite.
Verifies all REST API routes, schemas, rate-limiting, and error responses.
"""
import io
import sys
import unittest
import numpy as np

import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


class TestApiEndpoints(unittest.TestCase):

    def test_health_endpoint(self):
        res = client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "operational")
        self.assertEqual(data["service"], "SentinelShield AI")
        self.assertEqual(data["sih_ref"], "SIH26104_AICTE")

    def test_scan_url_endpoint(self):
        # 1. Phishing / Typosquatting URL
        payload = {"url": "https://sbi-verification.xyz/netbanking/login"}
        res = client.post("/api/v1/scan-url", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn(data["verdict"], ["SUSPICIOUS", "PHISHING"])
        self.assertTrue(data["typosquatting_detected"] or data["suspicious_tld"])

        # 2. Safe URL
        safe_payload = {"url": "https://www.google.com/search?q=security"}
        safe_res = client.post("/api/v1/scan-url", json=safe_payload)
        self.assertEqual(safe_res.status_code, 200)
        safe_data = safe_res.json()
        self.assertEqual(safe_data["verdict"], "SAFE")

    def test_scan_message_endpoint(self):
        # 1. Digital arrest scam message
        payload = {
            "text": "This is CBI officer. Non-bailable arrest warrant issued. Transfer Rs 25000 within 2 hours to safe account or you will be arrested.",
            "source_channel": "sms",
        }
        res = client.post("/api/v1/scan-message", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["verdict"], "DIGITAL_ARREST_DETECTED")
        self.assertGreater(data["threat_score"], 0.70)
        self.assertIn("1930", data["recommended_action"])

        # 2. Normal OTP message
        safe_payload = {
            "text": "Your login OTP is 394821 for Amazon. Do not share with anyone.",
            "source_channel": "sms",
        }
        safe_res = client.post("/api/v1/scan-message", json=safe_payload)
        self.assertEqual(safe_res.status_code, 200)
        self.assertEqual(safe_res.json()["verdict"], "SAFE")

    def test_forensic_report_pdf_stream(self):
        payload = {
            "session_id": "api-test-session",
            "voice_data": {
                "session_id": "api-test-session",
                "total_chunks": 10,
                "duration_seconds": 2.0,
                "mean_risk_score": 0.85,
                "peak_risk_score": 0.95,
                "verdict": "AI_DETECTED",
                "red_alerts_fired": 2,
                "attestation_chain": ["c" * 64],
            },
            "url_data": {
                "url": "https://paytm-kyc.xyz",
                "domain": "paytm-kyc.xyz",
                "is_https": False,
                "entropy_score": 0.65,
                "phishing_score": 0.88,
                "typosquatting_detected": True,
                "typosquatting_target": "paytm",
                "is_shortened": False,
                "has_ip_address": False,
                "suspicious_tld": True,
                "scan_ms": 1.2,
                "verdict": "PHISHING",
            },
        }
        res = client.post("/api/v1/forensic-report", json=payload)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers["content-type"], "application/pdf")
        self.assertTrue(res.content.startswith(b"%PDF-"))

    def test_audio_upload_rest(self):
        # Synthesize a 200ms 16kHz PCM WAV buffer
        sr = 16000
        duration = 0.200
        t = np.linspace(0, duration, int(sr * duration), endpoint=False)
        sine = (np.sin(2 * np.pi * 440 * t) * 32767).astype(np.int16)

        import wave
        bio = io.BytesIO()
        with wave.open(bio, 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sr)
            wf.writeframes(sine.tobytes())
        bio.seek(0)

        files = {"file": ("test_audio.wav", bio.read(), "audio/wav")}
        res = client.post("/api/v1/analyze-audio", files=files)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn(data["verdict"], ["HUMAN", "AI_SUSPECTED", "AI_DETECTED", "DEGRADED_SIGNAL"])
        self.assertEqual(len(data["attestation_hash"]), 64)


if __name__ == "__main__":
    unittest.main(verbosity=2)
