import io
import scipy.io.wavfile as wavfile
import numpy as np

def decode_audio_bytes(raw_bytes: bytes, target_sr: int = 16000) -> bytes:
    try:
        # Check if WAV container
        if raw_bytes.startswith(b"RIFF"):
            bio = io.BytesIO(raw_bytes)
            sr, data = wavfile.read(bio)
            if data.ndim > 1:
                data = data.mean(axis=1)
            # Convert float/int to int16
            if data.dtype == np.float32 or data.dtype == np.float64:
                data = (np.clip(data, -1.0, 1.0) * 32767.0).astype(np.int16)
            elif data.dtype != np.int16:
                data = data.astype(np.int16)
            
            # Resample if needed (simple linear interp or decimation if different sr)
            if sr != target_sr:
                num_target_samples = int(len(data) * (target_sr / sr))
                data = np.interp(
                    np.linspace(0, len(data), num_target_samples, endpoint=False),
                    np.arange(len(data)),
                    data
                ).astype(np.int16)
            return data.tobytes()
    except Exception as exc:
        print("WAV read failed:", exc)
    
    # Try soundfile
    try:
        import soundfile as sf
        bio = io.BytesIO(raw_bytes)
        data, sr = sf.read(bio)
        if data.ndim > 1:
            data = data.mean(axis=1)
        if sr != target_sr:
            num_target_samples = int(len(data) * (target_sr / sr))
            data = np.interp(
                np.linspace(0, len(data), num_target_samples, endpoint=False),
                np.arange(len(data)),
                data
            )
        data_int16 = (np.clip(data, -1.0, 1.0) * 32767.0).astype(np.int16)
        return data_int16.tobytes()
    except Exception as exc:
        print("Soundfile read failed:", exc)
    
    # Fallback: treat as raw PCM if multiple of 2
    if len(raw_bytes) % 2 != 0:
        raw_bytes = raw_bytes[:-1]
    return raw_bytes

# Test on real dataset file
wav_path = r"C:\Users\FRONTMAN\OneDrive\Desktop\voice-data-main\voice data\ai\ai_hi_001.wav"
with open(wav_path, "rb") as f:
    raw = f.read()

pcm = decode_audio_bytes(raw)
print(f"Decoded {len(raw)} WAV bytes -> {len(pcm)} PCM int16 bytes ({len(pcm)//32000:.2f} seconds)")
