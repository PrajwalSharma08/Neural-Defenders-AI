"""
SentinelShield AI — Dataset Sample Verification Suite.
"""
import os
import sys
import unittest
from pathlib import Path
import scipy.io.wavfile as wavfile

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.services.voice_dsp import analyze_audio_chunk, _load_ml_model

DATASET_DIR = Path(r"C:\Users\FRONTMAN\OneDrive\Desktop\voice-data-main\voice data")


class TestDatasetSamples(unittest.TestCase):

    def test_ml_model_loaded(self):
        payload = _load_ml_model()
        self.assertIsNotNone(payload)
        self.assertIn("model", payload)
        self.assertIn("scaler", payload)

    def test_real_dataset_audio_classification(self):
        if not DATASET_DIR.exists():
            return

        ai_dir = DATASET_DIR / "ai"
        human_dir = DATASET_DIR / "human"

        ai_files = sorted(list(ai_dir.glob("*.wav")))[:10]
        human_files = sorted(list(human_dir.glob("*.wav")))[:10]

        print(f"\n--- Testing {len(ai_files)} Real AI Audio Samples ---")
        ai_scores = []
        for af in ai_files:
            sr, data = wavfile.read(str(af))
            if data.ndim > 1:
                data = data.mean(axis=1)
            pcm_bytes = data.astype('int16').tobytes()
            res = analyze_audio_chunk(pcm_bytes, session_id="test_ai", chunk_index=0, sample_rate=sr)
            ai_scores.append(res.risk_score)
            print(f"  AI Sample: {af.name:18s} -> Risk: {res.risk_score*100:6.2f}% | Verdict: {res.verdict}")
            self.assertIn(res.verdict, ["AI_DETECTED", "AI_SUSPECTED"])

        print(f"\n--- Testing {len(human_files)} Real Human Audio Samples ---")
        human_scores = []
        for hf in human_files:
            sr, data = wavfile.read(str(hf))
            if data.ndim > 1:
                data = data.mean(axis=1)
            pcm_bytes = data.astype('int16').tobytes()
            res = analyze_audio_chunk(pcm_bytes, session_id="test_human", chunk_index=0, sample_rate=sr)
            human_scores.append(res.risk_score)
            print(f"  Human Sample: {hf.name:18s} -> Risk: {res.risk_score*100:6.2f}% | Verdict: {res.verdict}")
            self.assertEqual(res.verdict, "HUMAN")

        mean_ai = sum(ai_scores) / len(ai_scores)
        mean_human = sum(human_scores) / len(human_scores)
        print(f"\nMean AI Risk Score:    {mean_ai*100:.2f}%")
        print(f"Mean Human Risk Score: {mean_human*100:.2f}%")
        self.assertGreater(mean_ai, 0.70)
        self.assertLess(mean_human, 0.30)


if __name__ == "__main__":
    unittest.main(verbosity=2)
