"""
SentinelShield AI — Master Automated Verification Test Suite.
Tests all 10 core subsystems:
  1. Frontend Static Glassmorphism Delivery (GET /)
  2. Health & TEE Integrity Endpoint (GET /api/v1/health)
  3. AI Synthetic Audio File Upload (POST /api/v1/analyze-audio)
  4. Genuine Human Audio File Upload (POST /api/v1/analyze-audio)
  5. Phishing / DGA URL Scanner (POST /api/v1/scan-url)
  6. Genuine Banking URL Scanner (POST /api/v1/scan-url)
  7. Digital Arrest Extortion Scanner (POST /api/v1/scan-message)
  8. Safe SMS Message Scanner (POST /api/v1/scan-message)
  9. Section 65B In-Memory Forensic PDF Generator (POST /api/v1/forensic-report)
  10. Live WebSocket Audio Streaming & Ping (/ws/voice-stream)
"""
import asyncio
import json
import os
import sys
import httpx
import websockets

BASE_URL = "http://127.0.0.1:8888"
WS_URL = "ws://127.0.0.1:8888/ws/voice-stream"
AI_AUDIO_SAMPLE = r"C:\Users\FRONTMAN\OneDrive\Desktop\voice-data-main\voice data\ai\ai_hi_001.wav"
HUMAN_AUDIO_SAMPLE = r"C:\Users\FRONTMAN\OneDrive\Desktop\voice-data-main\voice data\human\human_hi_001.wav"

passed_tests = 0
total_tests = 10


def report(test_name, passed, detail=""):
    global passed_tests
    if passed:
        passed_tests += 1
        print(f"  [PASS] {test_name}: {detail}")
    else:
        print(f"  [FAIL] {test_name}: {detail}")


def run_http_tests():
    global passed_tests
    print("\n=======================================================")
    print("  SENTINELSHIELD AI — FULL SYSTEM VERIFICATION SUITE   ")
    print("=======================================================")

    with httpx.Client(base_url=BASE_URL, timeout=15.0) as client:
        # 1. Frontend Delivery
        try:
            r = client.get("/")
            has_html = r.status_code == 200 and "SENTINEL" in r.text
            report("1. Glassmorphism Frontend (HTML/CSS/JS)", has_html, f"Status {r.status_code}, Bytes {len(r.text)}")
        except Exception as e:
            report("1. Glassmorphism Frontend (HTML/CSS/JS)", False, str(e))

        # 2. Health & TEE Integrity
        try:
            r = client.get("/api/v1/health")
            data = r.json()
            ok = r.status_code == 200 and data.get("status") == "operational" and data.get("tee_guard") == "active"
            report("2. API & TEE RAM-Guard Health", ok, f"Status: {data.get('status')}, TEE: {data.get('tee_guard')}")
        except Exception as e:
            report("2. API & TEE RAM-Guard Health", False, str(e))

        # 3. AI Audio Upload Test
        try:
            with open(AI_AUDIO_SAMPLE, "rb") as f:
                r = client.post("/api/v1/analyze-audio", files={"file": ("ai_hi_001.wav", f.read(), "audio/wav")})
            data = r.json()
            ok = r.status_code == 200 and data.get("verdict") == "AI_DETECTED" and data.get("risk_score") >= 0.60
            report("3. AI Synthetic Audio Detection", ok, f"Verdict: {data.get('verdict')}, Risk: {data.get('risk_score')*100}%")
        except Exception as e:
            report("3. AI Synthetic Audio Detection", False, str(e))

        # 4. Human Audio Upload Test
        try:
            with open(HUMAN_AUDIO_SAMPLE, "rb") as f:
                r = client.post("/api/v1/analyze-audio", files={"file": ("human_hi_001.wav", f.read(), "audio/wav")})
            data = r.json()
            ok = r.status_code == 200 and data.get("verdict") == "HUMAN" and data.get("risk_score") < 0.35
            report("4. Genuine Human Voice Verification", ok, f"Verdict: {data.get('verdict')}, Risk: {data.get('risk_score')*100}%")
        except Exception as e:
            report("4. Genuine Human Voice Verification", False, str(e))

        # 5. Phishing DGA Link Scanner
        try:
            r = client.post("/api/v1/scan-url", json={"url": "http://onlinesbi-kyc-verification.xyz/login"})
            data = r.json()
            ok = r.status_code == 200 and data.get("verdict") == "PHISHING"
            report("5. Phishing Link & DGA Scanner", ok, f"Verdict: {data.get('verdict')}, Phishing Score: {data.get('phishing_score')*100}%")
        except Exception as e:
            report("5. Phishing Link & DGA Scanner", False, str(e))

        # 6. Genuine Banking Link Scanner
        try:
            r = client.post("/api/v1/scan-url", json={"url": "https://onlinesbi.sbi"})
            data = r.json()
            ok = r.status_code == 200 and data.get("verdict") == "SAFE"
            report("6. Genuine Banking URL Verification", ok, f"Verdict: {data.get('verdict')}, Phishing Score: {data.get('phishing_score')*100}%")
        except Exception as e:
            report("6. Genuine Banking URL Verification", False, str(e))

        # 7. Digital Arrest Extortion Scanner
        try:
            text = "CBI arrest warrant issued against you for illegal narcotics package seized by customs. Transfer fine to RBI safe account within 2 hours or police will arrive."
            r = client.post("/api/v1/scan-message", json={"text": text, "source_channel": "sms"})
            data = r.json()
            ok = r.status_code == 200 and data.get("verdict") in ("DIGITAL_ARREST_DETECTED", "SCAM_DETECTED")
            report("7. Digital Arrest & Extortion Shield", ok, f"Verdict: {data.get('verdict')}, Patterns Matched: {data.get('total_patterns_matched')}")
        except Exception as e:
            report("7. Digital Arrest & Extortion Shield", False, str(e))

        # 8. Safe SMS Scanner
        try:
            r = client.post("/api/v1/scan-message", json={"text": "Hello, let us meet for coffee tomorrow afternoon at 4pm.", "source_channel": "sms"})
            data = r.json()
            ok = r.status_code == 200 and data.get("verdict") == "SAFE"
            report("8. Benign Message Verification", ok, f"Verdict: {data.get('verdict')}, Threat Score: {data.get('threat_score')*100}%")
        except Exception as e:
            report("8. Benign Message Verification", False, str(e))

        # 9. Section 65B In-Memory PDF Generator
        try:
            payload = {
                "session_id": "test_verification_session",
                "voice_data": {"verdict": "AI_DETECTED", "risk_score": 0.90, "snr_db": 24.5, "processing_ms": 250, "attestation_hash": "a"*64},
                "url_data": {"url": "http://sbi-fake.xyz", "domain": "sbi-fake.xyz", "verdict": "PHISHING", "phishing_score": 0.85, "scan_ms": 1.2},
                "sms_data": {"verdict": "DIGITAL_ARREST_DETECTED", "threat_score": 0.95, "total_patterns_matched": 3, "scan_ms": 0.8, "text_hash": "b"*64},
            }
            r = client.post("/api/v1/forensic-report", json=payload)
            is_pdf = r.status_code == 200 and r.content.startswith(b"%PDF-")
            report("9. Section 65B Forensic PDF Generation", is_pdf, f"Status: {r.status_code}, PDF Size: {len(r.content)} bytes")
        except Exception as e:
            report("9. Section 65B Forensic PDF Generation", False, str(e))


async def run_websocket_test():
    try:
        async with websockets.connect(WS_URL) as ws:
            # 1. Start session
            await ws.send(json.dumps({"action": "start", "session_id": "ws_test_session", "sample_rate": 16000}))
            init_resp = await ws.recv()
            init_data = json.loads(init_resp)
            started_ok = init_data.get("action") == "session_started"

            # 2. Send ping
            await ws.send(json.dumps({"action": "ping"}))
            ping_resp = await ws.recv()
            ping_data = json.loads(ping_resp)
            pong_ok = ping_data.get("action") == "pong"

            # 3. Send 200ms of PCM silence (3200 bytes of zeros)
            await ws.send(bytes(3200))
            audio_resp = await ws.recv()
            audio_data = json.loads(audio_resp)
            vad_ok = audio_data.get("verdict") in ("SILENCE", "HUMAN")

            report("10. WebSocket 200ms Telemetry Stream", started_ok and pong_ok and vad_ok, f"Session Started: {started_ok}, Ping-Pong: {pong_ok}, VAD Gate: {audio_data.get('verdict')}")
    except Exception as e:
        report("10. WebSocket 200ms Telemetry Stream", False, str(e))


if __name__ == "__main__":
    run_http_tests()
    asyncio.run(run_websocket_test())

    print("\n-------------------------------------------------------")
    print(f"  SCORECARD: {passed_tests} / {total_tests} TESTS PASSED ({int((passed_tests/total_tests)*100)}% OPERATIONAL)")
    print("-------------------------------------------------------\n")
