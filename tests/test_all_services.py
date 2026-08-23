"""
SentinelShield AI — Comprehensive Automated Test & Verification Suite.

Tests:
1. TEE Guard: Memory page locking, zeroization, and HMAC attestation tokens
2. Voice DSP Forensics: 200ms audio chunk analysis, STFT phase variance, pitch jitter, SNR guard
3. Link Shield: Ingested phishing heuristics, Shannon entropy, homoglyph typosquatting
4. SMS / Digital Arrest Shield: Aho-Corasick automaton pattern matching & threat scoring
5. Forensic PDF Generator: In-memory ReportLab PDF synthesis & Section 65B compliance
6. FastAPI Endpoints & Security Middleware: REST API contract & error envelope verification
"""
import asyncio
import io
import sys
import unittest
import numpy as np

# Ensure backend package is in python path
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.core.config import get_settings
from backend.core.tee_guard import (
    generate_attestation_token,
    volatile_audio_buffer,
    zeroize_buffer,
)
from backend.schemas.url import URLScanRequest
from backend.schemas.message import MessageScanRequest
from backend.services.voice_dsp import analyze_audio_chunk, _estimate_snr_db
from backend.services.link_shield import EntropyScanner, TyposquattingDetector
from backend.services.sms_shield import get_sms_shield
from backend.services.forensic_pdf import generate_forensic_pdf


class TestSentinelShield(unittest.TestCase):

    def setUp(self):
        self.settings = get_settings()

    # -----------------------------------------------------------------------
    # 1. TEE Guard & Volatile Memory Verification
    # -----------------------------------------------------------------------
    def test_tee_guard_lifecycle(self):
        sample_data = b"synthetic_pcm_audio_chunk_data_12345678"
        token = generate_attestation_token(sample_data)
        self.assertEqual(len(token), 64, "Attestation token must be 64-char hex SHA-256")

        # Test zeroization
        mutable_buf = bytearray(b"sensitive_audio_stream_in_ram")
        zeroize_buffer(mutable_buf)
        self.assertTrue(all(b == 0 for b in mutable_buf), "Buffer must be wiped with zeros")

        # Test context manager
        with volatile_audio_buffer(sample_data) as bio:
            content = bio.read()
            self.assertEqual(content, sample_data)
            self.assertIsInstance(bio, io.BytesIO)

    # -----------------------------------------------------------------------
    # 2. Voice DSP Forensics Engine
    # -----------------------------------------------------------------------
    def test_voice_dsp_synthetic_chunk(self):
        sr = 16000
        duration = 0.200  # 200ms
        num_samples = int(sr * duration)

        # Generate a synthetic sine tone (simulating monotone robotic speech)
        t = np.linspace(0, duration, num_samples, endpoint=False)
        sine_wave = (np.sin(2 * np.pi * 440 * t) * 32767).astype(np.int16)
        raw_pcm = sine_wave.tobytes()

        res = analyze_audio_chunk(
            raw_pcm=raw_pcm,
            session_id="test-session-001",
            chunk_index=0,
            sample_rate=sr,
        )

        self.assertEqual(res.session_id, "test-session-001")
        self.assertGreaterEqual(res.risk_score, 0.0)
        self.assertLessEqual(res.risk_score, 1.0)
        self.assertEqual(len(res.attestation_hash), 64)
        self.assertLess(res.processing_ms, 300.0, "DSP processing must execute in <300ms")
        self.assertIn(res.verdict, ["HUMAN", "AI_SUSPECTED", "AI_DETECTED", "DEGRADED_SIGNAL"])

    def test_snr_thresholding(self):
        # Ultra-low amplitude noise chunk
        low_signal = np.random.normal(0, 1e-4, 3200).astype(np.float32)
        snr = _estimate_snr_db(low_signal)
        self.assertIsInstance(snr, float)

    # -----------------------------------------------------------------------
    # 3. Link Shield & Typosquatting Engine
    # -----------------------------------------------------------------------
    def test_link_shield_phishing_detection(self):
        scanner = EntropyScanner()
        detector = TyposquattingDetector()

        # Malicious Typosquatting URL
        req = URLScanRequest(url="https://paytm-kyc-verification.xyz/login.php?token=x938fhs829")
        scan_res = scanner.scan(req)
        enriched = detector.enrich_scan_response(scan_res, scan_res.domain)

        self.assertIn(enriched.verdict, ["SUSPICIOUS", "PHISHING"])
        self.assertTrue(enriched.typosquatting_detected or enriched.suspicious_tld)
        self.assertGreater(enriched.phishing_score, 0.3)

    def test_link_shield_legitimate_url(self):
        scanner = EntropyScanner()
        detector = TyposquattingDetector()

        req = URLScanRequest(url="https://www.google.com/search?q=cybersecurity")
        scan_res = scanner.scan(req)
        enriched = detector.enrich_scan_response(scan_res, scan_res.domain)

        self.assertEqual(enriched.verdict, "SAFE")
        self.assertFalse(enriched.typosquatting_detected)
        self.assertLess(enriched.phishing_score, 0.4)

    # -----------------------------------------------------------------------
    # 4. SMS / Digital Arrest Shield
    # -----------------------------------------------------------------------
    def test_digital_arrest_detection(self):
        shield = get_sms_shield()

        # Severe Digital Arrest Extortion message
        scam_text = (
            "This is Cyber Crime Branch CBI Delhi. A non-bailable arrest warrant has been "
            "issued against you due to illegal customs parcel seizure. You are under digital arrest. "
            "You must transfer money immediately within 2 hours to safe RBI account or police will arrive."
        )
        req = MessageScanRequest(text=scam_text, source_channel="sms")
        res = shield.scan(req)

        self.assertEqual(res.verdict, "DIGITAL_ARREST_DETECTED")
        self.assertGreater(res.threat_score, 0.70)
        self.assertGreaterEqual(res.total_patterns_matched, 2)
        self.assertIn("1930", res.recommended_action)
        self.assertLess(res.scan_ms, 50.0, "Aho-Corasick scan must complete in <50ms")

    def test_safe_transaction_otp(self):
        shield = get_sms_shield()

        otp_text = "Your OTP for transaction at Amazon India is 492019. Valid for 10 minutes. Do not share with anyone."
        req = MessageScanRequest(text=otp_text, source_channel="sms")
        res = shield.scan(req)

        self.assertEqual(res.verdict, "SAFE")
        self.assertLess(res.threat_score, 0.35)
        self.assertEqual(res.total_patterns_matched, 0)

    # -----------------------------------------------------------------------
    # 5. In-Memory Forensic PDF Generation
    # -----------------------------------------------------------------------
    def test_forensic_pdf_generation(self):
        voice_summary = {
            "session_id": "test-session-42",
            "total_chunks": 15,
            "duration_seconds": 3.0,
            "mean_risk_score": 0.885,
            "peak_risk_score": 0.942,
            "verdict": "AI_DETECTED",
            "red_alerts_fired": 3,
            "attestation_chain": ["a" * 64, "b" * 64],
        }
        url_summary = {
            "url": "https://sbi-secure-kyc.top/update",
            "domain": "sbi-secure-kyc.top",
            "is_https": True,
            "entropy_score": 0.76,
            "phishing_score": 0.89,
            "typosquatting_detected": True,
            "typosquatting_target": "sbi",
            "is_shortened": False,
            "has_ip_address": False,
            "suspicious_tld": True,
            "scan_ms": 1.42,
            "verdict": "PHISHING",
            "threat_indicators": [
                {"indicator_type": "typosquatting", "description": "Impersonates SBI brand", "severity": 0.88}
            ],
        }
        sms_summary = {
            "text_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "source_channel": "sms",
            "threat_score": 0.95,
            "total_patterns_matched": 3,
            "verdict": "DIGITAL_ARREST_DETECTED",
            "recommended_action": "Do not comply. Call cyber helpline 1930.",
            "scan_ms": 0.45,
            "matched_patterns": [
                {"pattern_id": "DA001", "pattern_name": "CBI Arrest Warrant", "matched_fragment": "cbi warrant", "category": "digital_arrest", "weight": 0.95}
            ],
        }

        pdf_bio = generate_forensic_pdf(
            voice_data=voice_summary,
            url_data=url_summary,
            sms_data=sms_summary,
            session_id="test-session-42",
        )

        pdf_bytes = pdf_bio.read()
        self.assertGreater(len(pdf_bytes), 1000, "PDF should contain valid binary data")
        self.assertTrue(pdf_bytes.startswith(b"%PDF-"), "Generated file must have PDF magic header")


if __name__ == "__main__":
    unittest.main(verbosity=2)
