import httpx

url = "http://127.0.0.1:8000/api/v1/analyze-audio"

# 1. AI file
ai_path = r"C:\Users\FRONTMAN\OneDrive\Desktop\voice-data-main\voice data\ai\ai_hi_001.wav"
with open(ai_path, "rb") as f:
    files = {"file": ("ai_hi_001.wav", f.read(), "audio/wav")}
    res = httpx.post(url, files=files, timeout=10.0)
    print("AI File Response:", res.json())

# 2. Human file
human_path = r"C:\Users\FRONTMAN\OneDrive\Desktop\voice-data-main\voice data\human\human_hi_001.wav"
with open(human_path, "rb") as f:
    files = {"file": ("human_hi_001.wav", f.read(), "audio/wav")}
    res = httpx.post(url, files=files, timeout=10.0)
    print("Human File Response:", res.json())
