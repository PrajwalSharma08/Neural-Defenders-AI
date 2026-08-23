# -*- coding: utf-8 -*-
"""
SentinelShield AI — Comprehensive Full-Dataset Audio Verification Script.
"""
import os
import sys
import time
from pathlib import Path
from collections import defaultdict
import numpy as np
import pandas as pd
import scipy.io.wavfile as wavfile

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from backend.services.voice_dsp import analyze_audio_chunk, _load_ml_model

DATASET_DIR = Path(r"C:\Users\FRONTMAN\OneDrive\Desktop\voice-data-main\voice data")


def evaluate_full_dataset():
    if not DATASET_DIR.exists():
        print(f"Dataset path not found: {DATASET_DIR}")
        return

    # Load model
    _load_ml_model()

    ai_files = sorted(list((DATASET_DIR / "ai").glob("*.wav")))
    human_files = sorted(list((DATASET_DIR / "human").glob("*.wav")))

    total_files = len(ai_files) + len(human_files)
    print("================================================================")
    print(f" SentinelShield AI - Full Dataset Verification ({total_files} Files Total)")
    print(f"   - AI Synthetic Files:    {len(ai_files)}")
    print(f"   - Human Voice Files:     {len(human_files)}")
    print("================================================================\n")

    results = []
    lang_stats = defaultdict(lambda: {"total": 0, "correct": 0, "ai_correct": 0, "human_correct": 0, "ai_total": 0, "human_total": 0})

    # Evaluate AI files
    print("Evaluating AI Synthetic Audio Files...")
    ai_correct = 0
    t0 = time.perf_counter()
    for idx, f in enumerate(ai_files):
        try:
            sr, data = wavfile.read(str(f))
            if data.ndim > 1:
                data = data.mean(axis=1)
            pcm_bytes = data.astype('int16').tobytes()
            res = analyze_audio_chunk(pcm_bytes, session_id="eval_full", chunk_index=idx, sample_rate=sr)

            is_correct = res.verdict in ("AI_DETECTED", "AI_SUSPECTED")
            if is_correct:
                ai_correct += 1

            lang = f.stem.split("_")[1] if len(f.stem.split("_")) > 1 else "unknown"
            lang_stats[lang]["total"] += 1
            lang_stats[lang]["ai_total"] += 1
            if is_correct:
                lang_stats[lang]["correct"] += 1
                lang_stats[lang]["ai_correct"] += 1

            results.append({
                "filename": f.name,
                "true_label": "AI",
                "predicted": res.verdict,
                "risk_score": res.risk_score,
                "is_correct": is_correct,
                "language": lang,
            })
            if (idx + 1) % 100 == 0 or idx == len(ai_files) - 1:
                print(f"  [AI] Processed {idx + 1}/{len(ai_files)} files (Current accuracy: {(ai_correct/(idx+1))*100:.1f}%)")
        except Exception as exc:
            print(f"  Error on {f.name}: {exc}")

    # Evaluate Human files
    print("\nEvaluating Human Voice Audio Files...")
    human_correct = 0
    for idx, f in enumerate(human_files):
        try:
            sr, data = wavfile.read(str(f))
            if data.ndim > 1:
                data = data.mean(axis=1)
            pcm_bytes = data.astype('int16').tobytes()
            res = analyze_audio_chunk(pcm_bytes, session_id="eval_full", chunk_index=idx, sample_rate=sr)

            is_correct = (res.verdict == "HUMAN")
            if is_correct:
                human_correct += 1

            lang = f.stem.split("_")[1] if len(f.stem.split("_")) > 1 else "unknown"
            lang_stats[lang]["total"] += 1
            lang_stats[lang]["human_total"] += 1
            if is_correct:
                lang_stats[lang]["correct"] += 1
                lang_stats[lang]["human_correct"] += 1

            results.append({
                "filename": f.name,
                "true_label": "HUMAN",
                "predicted": res.verdict,
                "risk_score": res.risk_score,
                "is_correct": is_correct,
                "language": lang,
            })
            if (idx + 1) % 100 == 0 or idx == len(human_files) - 1:
                print(f"  [HUMAN] Processed {idx + 1}/{len(human_files)} files (Current accuracy: {(human_correct/(idx+1))*100:.1f}%)")
        except Exception as exc:
            print(f"  Error on {f.name}: {exc}")

    total_time = time.perf_counter() - t0
    total_samples = len(results)
    overall_correct = ai_correct + human_correct
    overall_acc = (overall_correct / total_samples) * 100 if total_samples > 0 else 0

    df_res = pd.DataFrame(results)

    print("\n================================================================")
    print("                 FULL DATASET BENCHMARK RESULTS                 ")
    print("================================================================")
    print(f"Total Files Tested:        {total_samples}")
    print(f"Overall Accuracy:          {overall_acc:.2f}% ({overall_correct}/{total_samples})")
    print(f"AI Detection Accuracy:     {(ai_correct / len(ai_files))*100:.2f}% ({ai_correct}/{len(ai_files)})")
    print(f"Human Voice Accuracy:      {(human_correct / len(human_files))*100:.2f}% ({human_correct}/{len(human_files)})")
    print(f"Average Inference Speed:   {(total_time / total_samples)*1000:.2f} ms per audio file")
    print("----------------------------------------------------------------")

    print("\nPer-Language Accuracy Breakdown:")
    for lang, st in sorted(lang_stats.items()):
        acc = (st["correct"] / st["total"]) * 100 if st["total"] > 0 else 0
        ai_acc = (st["ai_correct"] / st["ai_total"]) * 100 if st["ai_total"] > 0 else 0
        hu_acc = (st["human_correct"] / st["human_total"]) * 100 if st["human_total"] > 0 else 0
        print(f"  Language [{lang:5s}]: Overall {acc:6.2f}% | AI: {ai_acc:6.2f}% ({st['ai_correct']}/{st['ai_total']}) | Human: {hu_acc:6.2f}% ({st['human_correct']}/{st['human_total']})")

    # Confusion Matrix
    tp = sum(1 for r in results if r["true_label"] == "AI" and r["is_correct"])
    fn = sum(1 for r in results if r["true_label"] == "AI" and not r["is_correct"])
    tn = sum(1 for r in results if r["true_label"] == "HUMAN" and r["is_correct"])
    fp = sum(1 for r in results if r["true_label"] == "HUMAN" and not r["is_correct"])

    print("\nConfusion Matrix:")
    print(f"  [Predicted AI]     TP = {tp:4d}  |  FP = {fp:4d}")
    print(f"  [Predicted Human]  FN = {fn:4d}  |  TN = {tn:4d}")

    # Export results CSV
    out_csv = Path(__file__).resolve().parent / "full_dataset_evaluation.csv"
    df_res.to_csv(out_csv, index=False)
    print(f"\nDetailed file-by-file log saved to: {out_csv}")
    print("================================================================\n")


if __name__ == "__main__":
    evaluate_full_dataset()
