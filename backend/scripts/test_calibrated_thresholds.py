import os
import sys
from pathlib import Path
import pandas as pd
import numpy as np
import joblib

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from backend.scripts.debug_verify_dataset_exact import extract_features_exact, load_audio_file

DATASET_DIR = Path(r"C:\Users\FRONTMAN\OneDrive\Desktop\voice-data-main\voice data")
MODEL_PATH = Path(r"C:\Users\FRONTMAN\.gemini\antigravity\scratch\sentinelshield-ai\backend\models\voice_classifier.joblib")

payload = joblib.load(MODEL_PATH)
scaler = payload["scaler"]
clf = payload["model"]

ai_files = sorted(list((DATASET_DIR / "ai").glob("*.wav")))[:20]
human_files = sorted(list((DATASET_DIR / "human").glob("*.wav")))[:20]

print("\n--- Evaluating 20 AI Audio Files ---")
ai_probs = []
for f in ai_files:
    y, sr = load_audio_file(f)
    vec = extract_features_exact(y, sr)
    prob = clf.predict_proba(scaler.transform([vec]))[0][1]
    ai_probs.append(prob)
    verdict = "AI_DETECTED" if prob >= 0.35 else "HUMAN"
    print(f"  AI:    {f.name:18s} -> {prob*100:6.2f}% | Verdict: {verdict}")

print("\n--- Evaluating 20 Human Audio Files ---")
human_probs = []
for f in human_files:
    y, sr = load_audio_file(f)
    vec = extract_features_exact(y, sr)
    prob = clf.predict_proba(scaler.transform([vec]))[0][1]
    human_probs.append(prob)
    verdict = "AI_DETECTED" if prob >= 0.35 else "HUMAN"
    print(f"  Human: {f.name:18s} -> {prob*100:6.2f}% | Verdict: {verdict}")

print(f"\nAverage AI Probability:    {np.mean(ai_probs)*100:.2f}% (Min: {np.min(ai_probs)*100:.2f}%, Max: {np.max(ai_probs)*100:.2f}%)")
print(f"Average Human Probability: {np.mean(human_probs)*100:.2f}% (Min: {np.min(human_probs)*100:.2f}%, Max: {np.max(human_probs)*100:.2f}%)")
