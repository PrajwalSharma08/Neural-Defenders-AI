import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, UploadCloud, Volume2, Waves, FileAudio, CheckCircle, Info, Sparkles } from 'lucide-react';
import { useAudioStreamer } from '../hooks/useAudioStreamer.js';

// ---------------------------------------------------------------------------
// Advanced Radial Cyber Dial Gauge with VAD & Listening States
// ---------------------------------------------------------------------------
function RiskGauge({ riskScore, verdict, speechSeconds }) {
  const score = Math.max(0, Math.min(1, riskScore || 0));
  const percent = Math.round(score * 100);
  const angle = -135 + score * 270;

  const isSilence = verdict === 'SILENCE';
  const isListening = verdict === 'LISTENING';

  let color = '#10B981';
  let label = 'GENUINE HUMAN VOICE';

  if (isSilence) {
    color = '#06B6D4';
    label = 'LISTENING FOR SPEECH (SILENCE)';
  } else if (isListening) {
    color = '#A855F7';
    label = `CALIBRATING VOICE (${speechSeconds?.toFixed(1) || 0}s / 2.5s)`;
  } else if (score >= 0.60) {
    color = '#EF4444';
    label = 'AI SYNTHETIC VOICE DETECTED';
  } else if (score >= 0.35) {
    color = '#F59E0B';
    label = 'SYNTHETIC VOICE SUSPECTED';
  } else {
    color = '#10B981';
    label = 'GENUINE HUMAN VOICE';
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-52 h-52">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Background Outer Ring */}
          <circle cx="100" cy="100" r="82" fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth="12" />
          
          {/* Dial Ticks */}
          {[...Array(21)].map((_, i) => {
            const tickAngle = -135 + (i / 20) * 270;
            const rad = (tickAngle * Math.PI) / 180;
            const x1 = 100 + 72 * Math.cos(rad);
            const y1 = 100 + 72 * Math.sin(rad);
            const x2 = 100 + 64 * Math.cos(rad);
            const y2 = 100 + 64 * Math.sin(rad);
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={i / 20 <= score && !isSilence && !isListening ? color : "rgba(128,128,128,0.25)"}
                strokeWidth={i % 5 === 0 ? "2.5" : "1.2"}
              />
            );
          })}

          {/* Active Risk Arc */}
          <circle
            cx="100" cy="100" r="82"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(isSilence || isListening ? 0.05 : score) * 386} 515`}
            strokeDashoffset="0"
            transform="rotate(-225 100 100)"
            style={{ 
              filter: `drop-shadow(0 0 12px ${color})`, 
              transition: 'stroke-dasharray 0.3s ease, stroke 0.3s ease' 
            }}
          />

          {/* Center Digital Display */}
          <text x="100" y="92" textAnchor="middle" fill={color} fontSize="34" fontWeight="bold" fontFamily="monospace">
            {isSilence ? '0' : isListening ? '...' : percent}
          </text>
          <text x="100" y="112" textAnchor="middle" fill={color} fontSize="12" fontFamily="monospace" fontWeight="semibold">
            {isListening ? 'ANALYZING' : '%'}
          </text>
          <text x="100" y="132" textAnchor="middle" fill="currentColor" opacity="0.6" fontSize="9" fontFamily="monospace" letterSpacing="2">
            {isSilence ? 'VAD SILENCE GATE' : isListening ? 'GATHERING TELEMETRY' : 'AI SYNTHETIC RISK'}
          </text>
        </svg>

        {/* Needle with Glowing Anchor */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          animate={{ rotate: isSilence || isListening ? -135 : angle }}
          transition={{ type: 'spring', stiffness: 140, damping: 16 }}
          style={{ originX: '50%', originY: '50%' }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: '50%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 3,
              height: 56,
              background: `linear-gradient(to top, ${color}, transparent)`,
              borderRadius: 3,
              boxShadow: `0 0 12px ${color}`,
              transformOrigin: 'bottom center',
            }}
          />
          <div 
            className="w-3.5 h-3.5 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
          />
        </motion.div>
      </div>

      <motion.div
        key={label}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="px-4 py-1.5 rounded-xl text-xs font-bold font-mono tracking-wider shadow-sm flex items-center gap-2"
        style={{ color, border: `1px solid ${color}40`, background: `${color}15` }}
      >
        <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: color }} />
        <span>{label}</span>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// High-Tech Animated Acoustic Visualizer & Frequency Oscilloscope
// ---------------------------------------------------------------------------
function AudioSpectrogram({ isStreaming, result }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const timeRef = useRef(0);
  const barsRef = useRef(Array.from({ length: 42 }, () => Math.random() * 0.2 + 0.05));
  const peakBarsRef = useRef(Array.from({ length: 42 }, () => 0.2));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      timeRef.current += 0.035;
      const t = timeRef.current;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#060B18';
      ctx.fillRect(0, 0, w, h);

      // Oscilloscope Grid Lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Frequency Spectrum Bars
      const numBars = 42;
      const barWidth = (w - (numBars - 1) * 3) / numBars;
      const isSpeaking = result?.is_speaking || false;
      const energyMultiplier = isStreaming ? (isSpeaking ? 1.9 : 0.35) : 0.25;
      const phaseVal = result?.phase_variance ?? 0.3;
      const jitterVal = result?.pitch_jitter ?? 0.3;

      for (let i = 0; i < numBars; i++) {
        const freqRatio = i / numBars;
        let targetHeight = 
          (Math.sin(t * 2.5 + i * 0.35) * 0.25 +
           Math.cos(t * 1.8 - i * 0.2) * 0.2 +
           Math.sin(t * 4.0 + i * 0.6) * 0.15 + 0.35) * energyMultiplier;

        if (isStreaming && isSpeaking) {
          targetHeight += (Math.random() * 0.35 + (i > 25 ? phaseVal * 0.4 : jitterVal * 0.4));
        }

        targetHeight = Math.max(0.04, Math.min(0.92, targetHeight));
        barsRef.current[i] += (targetHeight - barsRef.current[i]) * 0.15;
        const currentH = barsRef.current[i] * (h - 32);

        if (barsRef.current[i] > peakBarsRef.current[i]) {
          peakBarsRef.current[i] = barsRef.current[i];
        } else {
          peakBarsRef.current[i] = Math.max(0.04, peakBarsRef.current[i] - 0.006);
        }

        const x = i * (barWidth + 3);
        const y = h - 22 - currentH;

        const gradient = ctx.createLinearGradient(0, y, 0, h - 22);
        if (freqRatio > 0.65) {
          gradient.addColorStop(0, '#EF4444');
          gradient.addColorStop(0.5, '#D946EF');
          gradient.addColorStop(1, '#06B6D4');
        } else if (freqRatio > 0.35) {
          gradient.addColorStop(0, '#A855F7');
          gradient.addColorStop(1, '#06B6D4');
        } else {
          gradient.addColorStop(0, '#00F0FF');
          gradient.addColorStop(1, '#10B981');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, currentH);

        const peakY = h - 22 - peakBarsRef.current[i] * (h - 32);
        ctx.fillStyle = freqRatio > 0.65 ? '#FF4488' : '#00F0FF';
        ctx.fillRect(x, peakY, barWidth, 2);
      }

      // Continuous Oscilloscope Sine Wave Beam
      ctx.beginPath();
      ctx.strokeStyle = isSpeaking ? '#00F0FF' : '#06B6D4';
      ctx.lineWidth = isSpeaking ? 2.5 : 1.5;
      ctx.shadowColor = '#00F0FF';
      ctx.shadowBlur = isSpeaking ? 12 : 4;
      for (let x = 0; x < w; x += 4) {
        const amp = isSpeaking ? 24 : 6;
        const sineY = (h / 2) - 10 + 
          Math.sin((x * 0.02) + t * 3) * amp + 
          Math.sin((x * 0.05) - t * 2) * (amp * 0.5);
        if (x === 0) ctx.moveTo(x, sineY);
        else ctx.lineTo(x, sineY);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Baseline and Frequency Labels
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = '10px monospace';
      ctx.fillText('100Hz', 10, h - 6);
      ctx.fillText('1kHz', w * 0.28, h - 6);
      ctx.fillText('4kHz', w * 0.52, h - 6);
      ctx.fillText('8kHz (Vocoder Phase Band)', w * 0.68, h - 6);

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(w * 0.65, 8, w * 0.34, h - 32);
      ctx.setLineDash([]);
      ctx.fillStyle = '#EF4444';
      ctx.fillText('8-16kHz VOCODER ANOMALY ZONE', w * 0.66, 22);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isStreaming, result]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-cyan-DEFAULT/30 shadow-inner" style={{ background: 'var(--canvas-bg)' }}>
      <div className="absolute top-2.5 left-3 text-[10px] font-mono text-cyan-DEFAULT z-10 flex items-center gap-2 font-bold tracking-wider">
        <Waves className="w-3.5 h-3.5 text-cyan-DEFAULT animate-pulse" />
        <span>16kHz ACOUSTIC STFT SPECTRUM & OSCILLOSCOPE</span>
        {isStreaming ? (
          result?.is_speaking ? (
            <span className="px-2 py-0.5 rounded bg-emerald-DEFAULT/20 border border-emerald-DEFAULT text-emerald-DEFAULT text-[9px] animate-pulse">
              VOICE ACTIVE ({(result.speech_seconds || 0).toFixed(1)}s)
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-cyan-DEFAULT/20 border border-cyan-DEFAULT text-cyan-DEFAULT text-[9px]">
              VAD SILENCE GATE
            </span>
          )
        ) : (
          <span className="px-2 py-0.5 rounded bg-cyan-DEFAULT/20 border border-cyan-DEFAULT text-cyan-DEFAULT text-[9px]">
            STANDBY
          </span>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={720}
        height={170}
        className="w-full h-44 block"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Voice Shield Tab Module
// ---------------------------------------------------------------------------
export default function VoiceShieldTab({ onLatencyUpdate, onSessionData, onSessionId }) {
  const [sessionSummary, setSessionSummary] = useState(null);
  const [chunkHistory, setChunkHistory] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const handleResult = useCallback((result) => {
    setChunkHistory(prev => [...prev.slice(-40), result]);
  }, []);

  const handleSessionSummary = useCallback((summary) => {
    setSessionSummary(summary);
    if (onSessionData) onSessionData(summary);
    if (onSessionId && summary.session_id) onSessionId(summary.session_id);
  }, [onSessionData, onSessionId]);

  const { isStreaming, startStreaming, stopStreaming, latestResult, latencyMs, error } =
    useAudioStreamer({
      onResult: handleResult,
      onLatency: onLatencyUpdate,
      onSessionSummary: handleSessionSummary,
    });

  // Handle direct file upload (WAV / MP3)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/analyze-audio', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      setUploadResult({
        filename: file.name,
        ...data,
      });
      handleResult(data);
    } catch (err) {
      setUploadError(err.message || 'Failed to analyze uploaded audio file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const activeResult = uploadResult || latestResult;
  const currentRisk = activeResult?.risk_score ?? 0;
  const currentVerdict = activeResult?.verdict ?? 'SILENCE';
  const speechSecs = activeResult?.speech_seconds ?? 0;
  const processingMs = activeResult?.processing_ms ?? null;
  const snrDb = activeResult?.snr_db ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Gauge & Live Control */}
      <div className="glass-panel p-6 flex flex-col items-center gap-5 relative">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-cyan-DEFAULT" />
            <h2 className="text-xs font-mono text-cyan-DEFAULT uppercase font-bold tracking-widest">
              Acoustic Forensics
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-DEFAULT animate-pulse' : 'bg-slate-500'}`} />
            <span>{isStreaming ? 'LIVE MIC ON' : 'STANDBY'}</span>
          </div>
        </div>

        <RiskGauge riskScore={currentRisk} verdict={currentVerdict} speechSeconds={speechSecs} />

        {/* Live Microphone Stream Activation Button & File Upload */}
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={isStreaming ? stopStreaming : startStreaming}
            className={`relative w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              isStreaming
                ? 'bg-crimson-DEFAULT/20 border-2 border-crimson-DEFAULT shadow-crimson-neon'
                : 'bg-cyan-DEFAULT/20 border-2 border-cyan-DEFAULT shadow-cyan-neon'
            }`}
          >
            {isStreaming && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-crimson-DEFAULT"
                animate={{ scale: [1, 1.45, 1], opacity: [0.8, 0, 0.8] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
            )}
            {isStreaming ? (
              <MicOff className="w-8 h-8 text-crimson-DEFAULT" />
            ) : (
              <Mic className="w-8 h-8 text-cyan-DEFAULT" />
            )}
          </motion.button>

          {/* Upload File Button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/wav,audio/mp3,audio/mpeg,audio/flac,audio/ogg"
              className="hidden"
            />
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(6,182,212,0.4)' }}
              whileTap={{ scale: 0.96 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex flex-col items-center justify-center p-3 rounded-2xl hud-card hover:border-cyan-DEFAULT transition-all cursor-pointer"
            >
              <UploadCloud className="w-5 h-5 text-cyan-DEFAULT mb-1" />
              <span className="text-[10px] font-mono text-cyan-DEFAULT font-bold">
                {isUploading ? 'ANALYZING...' : 'UPLOAD AUDIO'}
              </span>
              <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>WAV / MP3</span>
            </motion.button>
          </div>
        </div>

        {/* Guidance / Progressive Ingestion Info Box */}
        <div className="w-full p-3 rounded-xl hud-card text-xs font-mono">
          {isStreaming ? (
            currentVerdict === 'SILENCE' ? (
              <div className="flex items-center gap-2 text-cyan-DEFAULT">
                <Info className="w-4 h-4 shrink-0 animate-pulse" />
                <span>Mic is listening. Speak for 3–5 seconds to analyze vocal harmonics.</span>
              </div>
            ) : currentVerdict === 'LISTENING' ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-purple-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    Gathering Speech Telemetry:
                  </span>
                  <span>{speechSecs.toFixed(1)}s / 2.5s</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-purple-950/60 border border-purple-500/30">
                  <motion.div
                    className="h-full bg-purple-500"
                    animate={{ width: `${Math.min(100, (speechSecs / 2.5) * 100)}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Vocal tract harmonics calibrated. Real-time verdict active.</span>
              </div>
            )
          ) : (
            <span style={{ color: 'var(--text-sub)' }}>
              Click Mic and speak 3-5 seconds, or Upload any WAV/MP3 to test detection.
            </span>
          )}
        </div>

        {uploadResult && (
          <div className="w-full p-3 rounded-xl bg-cyan-DEFAULT/10 border border-cyan-DEFAULT/30 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <FileAudio className="w-4 h-4 text-cyan-DEFAULT" />
              <span className="truncate max-w-[140px]" style={{ color: 'var(--text-main)' }}>{uploadResult.filename}</span>
            </div>
            <span className={uploadResult.verdict === 'HUMAN' ? 'text-emerald-DEFAULT font-bold' : 'text-crimson-DEFAULT font-bold'}>
              {uploadResult.verdict} ({(uploadResult.risk_score * 100).toFixed(1)}%)
            </span>
          </div>
        )}

        {(error || uploadError) && (
          <div className="w-full px-3.5 py-2.5 rounded-xl bg-crimson-DEFAULT/15 border border-crimson-DEFAULT/30 text-xs text-crimson-DEFAULT font-mono">
            ⚠ {error || uploadError}
          </div>
        )}

        {/* Real-time Feature Metrics */}
        <div className="w-full space-y-3 pt-3 border-t border-cyan-DEFAULT/15">
          {[
            { label: 'Dataset Model Confidence', value: activeResult ? activeResult.risk_score : 0, color: '#00F0FF' },
            { label: 'Vocoder Phase Variance (8-16kHz)', value: activeResult?.phase_variance, color: '#8B5CF6' },
            { label: 'Pitch Micro-Jitter Perturbation', value: activeResult?.pitch_jitter, color: '#10B981' },
            { label: 'Spectral Centroid Stability', value: activeResult?.spectral_centroid_stability, color: '#06B6D4' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span style={{ color: 'var(--text-sub)' }}>{label}</span>
                <span style={{ color }} className="font-bold">
                  {value !== undefined && value !== null ? value.toFixed(3) : '—'}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-card)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                  animate={{ width: `${((value ?? 0) * 100).toFixed(1)}%` }}
                  transition={{ duration: 0.25 }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* DSP Telemetry Speed */}
        <div className="w-full flex items-center justify-between text-[11px] font-mono pt-2 border-t border-cyan-DEFAULT/15" style={{ color: 'var(--text-muted)' }}>
          <div>
            <span>DSP SPEED: <strong className="text-cyan-DEFAULT">{processingMs !== null ? `${processingMs.toFixed(1)}ms` : '—'}</strong></span>
          </div>
          <div>
            <span>SNR: <strong style={{ color: 'var(--text-main)' }}>{snrDb !== null ? `${snrDb.toFixed(1)}dB` : '—'}</strong></span>
          </div>
        </div>
      </div>

      {/* Right Column: Spectrogram + Chunk History + Session Summary */}
      <div className="lg:col-span-2 space-y-4">
        {/* Real-time Spectrogram Canvas */}
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-xs font-mono text-cyan-DEFAULT uppercase font-bold tracking-wider">
              Acoustic Spectrum Stream
            </h3>
            <div className="flex items-center gap-3.5">
              {[['Centroid', '#06B6D4'], ['Phase (Vocoder)', '#EF4444'], ['Jitter', '#10B981'], ['Risk', '#D946EF']].map(([l, c]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c }} />
                  <span className="text-[11px] font-mono" style={{ color: 'var(--text-sub)' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <AudioSpectrogram isStreaming={isStreaming} result={activeResult} />
        </div>

        {/* Volatile Chunk Telemetry Stream Log */}
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono text-cyan-DEFAULT uppercase font-bold tracking-wider">
              RAM-Only Volatile Chunk Log ({chunkHistory.length} events recorded)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-DEFAULT/10 border border-emerald-DEFAULT/30 text-emerald-DEFAULT font-bold">
              ZERO-DISK TEE
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 font-mono text-xs">
            {chunkHistory.length === 0 ? (
              <p className="text-xs py-3 text-center" style={{ color: 'var(--text-muted)' }}>
                No telemetry recorded yet. Toggle the microphone or upload an audio file.
              </p>
            ) : (
              [...chunkHistory].reverse().slice(0, 18).map((chunk, i) => (
                <div 
                  key={i} 
                  className="hud-card flex items-center justify-between py-1.5 px-3 rounded-lg"
                >
                  <span style={{ color: 'var(--text-muted)' }}>#{String(chunk.chunk_index).padStart(3, '0')}</span>
                  <span className={
                    chunk.red_alert
                      ? 'text-crimson-DEFAULT font-bold'
                      : chunk.verdict === 'AI_SUSPECTED'
                      ? 'text-amber-DEFAULT font-bold'
                      : chunk.verdict === 'SILENCE'
                      ? 'text-cyan-DEFAULT'
                      : chunk.verdict === 'LISTENING'
                      ? 'text-purple-400 font-bold'
                      : 'text-emerald-DEFAULT font-bold'
                  }>
                    {chunk.verdict}
                  </span>
                  <span>R={chunk.risk_score?.toFixed(3)}</span>
                  <span>Speech={chunk.speech_seconds?.toFixed(1) || '0.0'}s</span>
                  <span className="text-cyan-DEFAULT font-bold">{chunk.processing_ms?.toFixed(1)}ms</span>
                  {chunk.red_alert && (
                    <span className="text-crimson-DEFAULT animate-pulse font-bold flex items-center gap-1">
                      🚨 RED ALERT
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Forensic Session Summary Dossier Card */}
        <AnimatePresence>
          {sessionSummary && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-panel p-5 border border-cyan-DEFAULT/40 shadow-cyan-neon/20"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono text-cyan-DEFAULT uppercase font-bold tracking-wider">
                  Forensic Voice Session Dossier
                </h3>
                <span className="text-xs font-mono" style={{ color: 'var(--text-sub)' }}>ID: {sessionSummary.session_id?.slice(0, 12)}…</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Session Verdict', value: sessionSummary.verdict },
                  { label: 'Total Chunks', value: sessionSummary.total_chunks },
                  { label: 'Speech Duration', value: `${sessionSummary.speech_duration_seconds?.toFixed(1) || 0}s` },
                  { label: 'Mean Risk Score', value: sessionSummary.mean_risk_score?.toFixed(3) },
                  { label: 'Peak Risk Score', value: sessionSummary.peak_risk_score?.toFixed(3) },
                  { label: 'Red Alerts Triggered', value: sessionSummary.red_alerts_fired },
                ].map(({ label, value }) => (
                  <div key={label} className="hud-card p-3">
                    <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    <p className="text-sm font-bold text-cyan-DEFAULT font-mono mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
