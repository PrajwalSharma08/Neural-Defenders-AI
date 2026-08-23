import os
import sys
import traceback
from pathlib import Path
import scipy.io.wavfile as wavfile
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from backend.services.voice_dsp import analyze_audio_chunk, decode_audio_file_bytes

wav_path = r"C:\Users\FRONTMAN\OneDrive\Desktop\voice-data-main\voice data\ai\ai_hi_001.wav"
with open(wav_path, "rb") as f:
    raw_wav = f.read()

print(f"Read {len(raw_wav)} raw bytes.")
pcm = decode_audio_file_bytes(raw_wav, 16000)
print(f"Decoded to {len(pcm)} PCM bytes.")

try:
    res = analyze_audio_chunk(pcm, "test_session", 0, 16000)
    print("Success!", res.model_dump())
except Exception as e:
    traceback.print_exc()
