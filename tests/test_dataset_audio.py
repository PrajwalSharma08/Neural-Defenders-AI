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

DATASET_DIR = Path(Path(__file__).resolve().parent.parent / "data" / "voice_data")


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
        if not ai_dir.exists() or not human_dir.exists():
            return

        # Select representative samples across diverse Indian languages
        langs = ["hi", "bn", "ta", "te", "mr", "gu", "pa", "kn", "ur"]
        ai_files = [ai_dir / f"ai_{l}_001.wav" for l in langs if (ai_dir / f"ai_{l}_001.wav").exists()]
        if not ai_files:
            ai_files = sorted(list(ai_dir.glob("*.wav")))[:10]

        human_files = sorted(list(human_dir.glob("*.wav")))[:10]

        ai_scores = []
        for af in ai_files:
            sr, data = wavfile.read(str(af))
            if data.ndim > 1:
                data = data.mean(axis=1)
            pcm_bytes = data.astype('int16').tobytes()
            res = analyze_audio_chunk(pcm_bytes, session_id="test_ai", chunk_index=0, sample_rate=sr)
            ai_scores.append(res.risk_score)

        human_scores = []
        for hf in human_files:
            sr, data = wavfile.read(str(hf))
            if data.ndim > 1:
                data = data.mean(axis=1)
            pcm_bytes = data.astype('int16').tobytes()
            res = analyze_audio_chunk(pcm_bytes, session_id="test_human", chunk_index=0, sample_rate=sr)
            human_scores.append(res.risk_score)

        if ai_scores:
            mean_ai = sum(ai_scores) / len(ai_scores)
            ai_flagged = sum(1 for s in ai_scores if s >= 0.35)
            self.assertGreaterEqual(ai_flagged / len(ai_scores), 0.75, "At least 75% of AI samples must trigger detection")
            self.assertGreater(mean_ai, 0.50, "Average AI risk score must exceed 0.50")


if __name__ == "__main__":
    unittest.main(verbosity=2)
