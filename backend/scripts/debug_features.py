import os
import sys
from pathlib import Path
import pandas as pd
import numpy as np
import joblib

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from backend.services.voice_dsp import _extract_dataset_feature_vector, _load_ml_model
from backend.scripts.calibrate_dsp import load_audio_file

DATASET_DIR = Path(r"C:\Users\FRONTMAN\OneDrive\Desktop\voice-data-main\voice data")
FEATURES_CSV = Path(r"C:\Users\FRONTMAN\OneDrive\Desktop\voice-data-main\features.csv")

df_feats = pd.read_csv(FEATURES_CSV)
payload = _load_ml_model()
scaler = payload["scaler"]
clf = payload["model"]
feature_names = payload["feature_names"]

print(f"Loaded model with {len(feature_names)} features.")

for sample_file in ["ai/ai_as_001.wav", "ai/ai_hi_001.wav", "ai/ai_en_001.wav", "human/human_as_001.wav", "human/human_hi_001.wav"]:
    fp = DATASET_DIR / sample_file
    if not fp.exists():
        continue
    y, sr = load_audio_file(fp)
    vec = _extract_dataset_feature_vector(y, sr)
    
    # Compare with features.csv row
    fname = fp.name
    row = df_feats[df_feats['filename'] == fname]
    if not row.empty:
        csv_vec = row[feature_names].values[0]
        scaled_csv = scaler.transform([csv_vec])
        csv_prob = clf.predict_proba(scaled_csv)[0]
        print(f"\n--- File: {fname} ---")
        print(f"  Exact CSV features -> AI Prob: {csv_prob[1]:.4f}")
        
        scaled_live = scaler.transform([vec])
        live_prob = clf.predict_proba(scaled_live)[0]
        print(f"  Live extracted feats -> AI Prob: {live_prob[1]:.4f}")
