import os
import sys
from pathlib import Path
import pandas as pd
import numpy as np
import joblib

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from backend.scripts.calibrate_dsp import load_audio_file

DATASET_DIR = Path(r"C:\Users\FRONTMAN\OneDrive\Desktop\voice-data-main\voice data")
MODEL_PATH = Path(r"C:\Users\FRONTMAN\.gemini\antigravity\scratch\sentinelshield-ai\backend\models\voice_classifier.joblib")

payload = joblib.load(MODEL_PATH)
scaler = payload["scaler"]
clf = payload["model"]
feature_names = payload["feature_names"]

def hz_to_mel(hz):
    return 2595.0 * np.log10(1.0 + hz / 700.0)

def mel_to_hz(mel):
    return 700.0 * (10.0 ** (mel / 2595.0) - 1.0)

def get_mel_filterbank(sr=16000, n_fft=2048, n_mels=128, fmin=0.0, fmax=8000.0):
    min_mel = hz_to_mel(fmin)
    max_mel = hz_to_mel(fmax)
    mels = np.linspace(min_mel, max_mel, n_mels + 2)
    hz = mel_to_hz(mels)
    bins = np.floor((n_fft + 1) * hz / sr).astype(int)
    
    n_freqs = n_fft // 2 + 1
    fbank = np.zeros((n_mels, n_freqs))
    for i in range(1, n_mels + 1):
        left, center, right = bins[i-1], bins[i], bins[i+1]
        if center > left:
            for j in range(left, center):
                if j < n_freqs:
                    fbank[i-1, j] = (j - left) / (center - left)
        if right > center:
            for j in range(center, right):
                if j < n_freqs:
                    fbank[i-1, j] = (right - j) / (right - center)
        enorm = 2.0 / (hz[i+1] - hz[i-1]) if (hz[i+1] - hz[i-1]) > 0 else 1.0
        fbank[i-1, :] *= enorm
    return fbank

def dct_matrix(n_mfcc=13, n_mels=128):
    n = np.arange(n_mels)
    k = np.arange(n_mfcc)[:, np.newaxis]
    d = np.cos(np.pi * k * (2 * n + 1) / (2 * n_mels))
    d[0, :] *= 1.0 / np.sqrt(2.0)
    d *= np.sqrt(2.0 / n_mels)
    return d

_FBANK_2048 = get_mel_filterbank(sr=16000, n_fft=2048, n_mels=128)
_DCT_MAT_13 = dct_matrix(n_mfcc=13, n_mels=128)

def extract_features_exact(y, sr=16000):
    n_fft = 2048
    hop_length = 512
    if len(y) < n_fft:
        pad_width = n_fft - len(y)
        y = np.pad(y, (0, pad_width), mode='constant')

    num_frames = (len(y) - n_fft) // hop_length + 1
    window = np.hanning(n_fft)
    stft_matrix = []
    for i in range(num_frames):
        frame = y[i * hop_length : i * hop_length + n_fft] * window
        stft_matrix.append(np.fft.rfft(frame, n=n_fft))
    stft = np.array(stft_matrix).T
    mags = np.abs(stft)
    power_spec = (mags ** 2)

    # 1. MFCC
    mel_power = np.dot(_FBANK_2048, power_spec)
    # power to db
    ref = np.max(mel_power)
    amin = 1e-10
    top_db = 80.0
    log_mel = 10.0 * np.log10(np.maximum(amin, mel_power))
    log_mel -= 10.0 * np.log10(np.maximum(amin, ref))
    log_mel = np.maximum(log_mel, log_mel.max() - top_db)
    mfcc = np.dot(_DCT_MAT_13, log_mel)

    # 2. Spectral Centroid
    freqs = np.fft.rfftfreq(n_fft, d=1.0 / sr)[:, np.newaxis]
    sum_mag = np.sum(mags, axis=0) + 1e-10
    centroid = np.sum(freqs * mags, axis=0) / sum_mag

    # 3. Spectral Bandwidth
    bandwidth = np.sqrt(np.sum(((freqs - centroid) ** 2) * mags, axis=0) / sum_mag)

    # 4. Spectral Rolloff
    cum_energy = np.cumsum(power_spec, axis=0)
    thresh = 0.85 * cum_energy[-1, :]
    roll_idx = np.argmax(cum_energy >= thresh, axis=0)
    rfftfreqs = np.fft.rfftfreq(n_fft, d=1.0 / sr)
    rolloff = rfftfreqs[roll_idx]

    # 5. Zero Crossing Rate
    zcr_frames = []
    for i in range(num_frames):
        frame = y[i * hop_length : i * hop_length + n_fft]
        zcr_frames.append(np.mean(np.abs(np.diff(np.sign(frame)))) / 2.0)
    zcr = np.array(zcr_frames)

    # 6. RMS Energy
    rms_frames = []
    for i in range(num_frames):
        frame = y[i * hop_length : i * hop_length + n_fft]
        rms_frames.append(np.sqrt(np.mean(frame ** 2)))
    rms = np.array(rms_frames)

    # 7. Spectral Flatness (Fast Pitch Proxy)
    geom_mean = np.exp(np.mean(np.log(power_spec + 1e-10), axis=0))
    arith_mean = np.mean(power_spec, axis=0) + 1e-10
    flatness = geom_mean / arith_mean

    feat_dict = {}
    for i in range(13):
        feat_dict[f"mfcc_{i+1}_mean"] = float(np.mean(mfcc[i]))
        feat_dict[f"mfcc_{i+1}_std"] = float(np.std(mfcc[i]))

    feat_dict["spec_cent_mean"] = float(np.mean(centroid))
    feat_dict["spec_cent_std"] = float(np.std(centroid))
    feat_dict["spec_bw_mean"] = float(np.mean(bandwidth))
    feat_dict["spec_bw_std"] = float(np.std(bandwidth))
    feat_dict["spec_roll_mean"] = float(np.mean(rolloff))
    feat_dict["spec_roll_std"] = float(np.std(rolloff))
    feat_dict["zcr_mean"] = float(np.mean(zcr))
    feat_dict["zcr_std"] = float(np.std(zcr))
    feat_dict["rms_mean"] = float(np.mean(rms))
    feat_dict["rms_std"] = float(np.std(rms))
    feat_dict["pitch_mean"] = float(np.mean(flatness))
    feat_dict["pitch_std"] = float(np.std(flatness))

    vec = np.array([feat_dict[k] for k in feature_names])
    return vec

print("\n=== Testing Exact Pure-NumPy Feature Extraction on Real Audio Files ===")
test_files = [
    ("AI (Assamese)", DATASET_DIR / "ai" / "ai_as_001.wav"),
    ("AI (Hindi)", DATASET_DIR / "ai" / "ai_hi_001.wav"),
    ("AI (English)", DATASET_DIR / "ai" / "ai_en_001.wav"),
    ("AI (Bengali)", DATASET_DIR / "ai" / "ai_bn_001.wav"),
    ("Human (Assamese)", DATASET_DIR / "human" / "human_as_001.wav"),
    ("Human (Hindi)", DATASET_DIR / "human" / "human_hi_001.wav"),
    ("Human (English)", DATASET_DIR / "human" / "human_en_001.wav"),
    ("Human (Bengali)", DATASET_DIR / "human" / "human_bn_001.wav"),
]

for label, fp in test_files:
    if not fp.exists():
        continue
    y, sr = load_audio_file(fp)
    vec = extract_features_exact(y, sr)
    X_scaled = scaler.transform([vec])
    prob = clf.predict_proba(X_scaled)[0]
    verdict = "AI_DETECTED" if prob[1] >= 0.50 else "HUMAN"
    print(f"{label:18s} [{fp.name:16s}] -> AI Prob: {prob[1]*100:6.2f}% | Verdict: {verdict}")
