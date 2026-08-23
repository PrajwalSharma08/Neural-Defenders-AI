import numpy as np

def hz_to_mel(hz):
    return 2595.0 * np.log10(1.0 + hz / 700.0)

def mel_to_hz(mel):
    return 700.0 * (10.0 ** (mel / 2595.0) - 1.0)

def get_mel_filterbank(sr=16000, n_fft=512, n_mels=13, fmin=0.0, fmax=8000.0):
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
        # Area normalization like librosa
        enorm = 2.0 / (hz[i+1] - hz[i-1]) if (hz[i+1] - hz[i-1]) > 0 else 1.0
        fbank[i-1, :] *= enorm
    return fbank

def dct_matrix(n_mfcc=13, n_mels=13):
    # Ortho-normalized DCT-II matrix identical to librosa/scipy
    n = np.arange(n_mels)
    k = np.arange(n_mfcc)[:, np.newaxis]
    d = np.cos(np.pi * k * (2 * n + 1) / (2 * n_mels))
    d[0, :] *= 1.0 / np.sqrt(2.0)
    d *= np.sqrt(2.0 / n_mels)
    return d

def compute_exact_mfcc(y, sr=16000, n_fft=512, hop_length=128, n_mfcc=13):
    num_frames = (len(y) - n_fft) // hop_length + 1
    window = np.hanning(n_fft)
    stft_matrix = []
    for i in range(num_frames):
        frame = y[i * hop_length : i * hop_length + n_fft] * window
        stft_matrix.append(np.fft.rfft(frame, n=n_fft))
    stft = np.array(stft_matrix).T
    power_spec = (np.abs(stft) ** 2) / n_fft
    
    # Mel Filterbank
    fb = get_mel_filterbank(sr=sr, n_fft=n_fft, n_mels=n_mfcc, fmin=0.0, fmax=sr/2.0)
    mel_power = np.dot(fb, power_spec) + 1e-10
    log_mel = 10.0 * np.log10(mel_power)
    
    # DCT
    dct_mat = dct_matrix(n_mfcc=n_mfcc, n_mels=n_mfcc)
    mfcc = np.dot(dct_mat, log_mel)
    return mfcc
