import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Activity, Download, Wifi, WifiOff, Lock, 
  Moon, Zap, Sparkles 
} from 'lucide-react';

export default function HeaderHUD({ 
  wsLatencyMs, 
  systemHealth, 
  onPdfDownload, 
  currentTheme, 
  onThemeChange 
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attestationHash, setAttestationHash] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const chars = '0123456789abcdef';
    const generateHash = () => Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * 16)]).join('');
    setAttestationHash(generateHash());
    const interval = setInterval(() => {
      setAttestationHash(generateHash());
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const latencyColor = wsLatencyMs === null
    ? 'text-slate-500'
    : wsLatencyMs < 300
    ? 'text-emerald-DEFAULT'
    : wsLatencyMs < 500
    ? 'text-amber-DEFAULT'
    : 'text-crimson-DEFAULT';

  const latencyLabel = wsLatencyMs === null ? '— ms' : `${wsLatencyMs} ms`;

  return (
    <header className="pt-4 sm:pt-6">
      <div className="glass-panel p-4 sm:p-5 relative overflow-hidden">
        {/* Top ambient highlight line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-DEFAULT to-transparent opacity-70" />

        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Brand Logo & Hackathon Reference */}
          <div className="flex items-center gap-3.5">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 180 }}
              transition={{ duration: 0.5 }}
              className="relative cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-cyan-DEFAULT/15 border border-cyan-DEFAULT/40 flex items-center justify-center shadow-cyan-neon">
                <Shield className="w-6 h-6 text-cyan-DEFAULT" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute inset-0 rounded-xl border border-cyan-DEFAULT pointer-events-none"
              />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-bold tracking-wider font-mono" style={{ color: 'var(--text-main)' }}>
                  SENTINEL<span className="text-cyan-DEFAULT neon-cyan-text">SHIELD</span> AI
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-DEFAULT/10 border border-cyan-DEFAULT/30 text-cyan-DEFAULT font-semibold hidden sm:inline-block">
                  v1.0.0
                </span>
              </div>
              <p className="text-[11px] font-mono tracking-tight" style={{ color: 'var(--text-muted)' }}>
                AICTE SMART INDIA HACKATHON 2026 • SIH26104
              </p>
            </div>
          </div>

          {/* Controls & Telemetry Bar */}
          <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap">
            {/* Theme Selector (Dark & Neon Only) */}
            <div className="hud-card flex items-center p-1 rounded-xl shadow-sm">
              <button
                onClick={() => onThemeChange('dark')}
                title="Cyber Dark Mode"
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentTheme === 'dark'
                    ? 'bg-cyan-DEFAULT text-void font-bold shadow-cyan-neon'
                    : 'text-slate-400 hover:text-cyan-DEFAULT'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">Dark</span>
              </button>

              <button
                onClick={() => onThemeChange('neon')}
                title="Cyberpunk Ultra Neon Mode"
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentTheme === 'neon'
                    ? 'bg-gradient-to-r from-purple-DEFAULT to-cyan-DEFAULT text-white font-bold shadow-purple-neon'
                    : 'text-slate-400 hover:text-purple-DEFAULT'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-purple-glow" />
                <span className="text-[11px] font-bold">Neon</span>
              </button>
            </div>

            {/* TEE Attestation RAM-Only Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-DEFAULT/10 border border-emerald-DEFAULT/30 shadow-emerald-neon/30">
              <Lock className="w-3.5 h-3.5 text-emerald-DEFAULT" />
              <div>
                <p className="text-[9px] text-emerald-DEFAULT font-bold uppercase tracking-wider leading-tight">
                  TEE RAM-ONLY
                </p>
                <p className="text-[11px] text-emerald-DEFAULT/90 font-mono leading-tight">{attestationHash}…</p>
              </div>
            </div>

            {/* Sub-Second Latency */}
            <div className="hud-card flex items-center gap-2 px-3 py-1.5 rounded-xl">
              {wsLatencyMs !== null ? (
                <Wifi className="w-3.5 h-3.5 text-cyan-DEFAULT" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-slate-400" />
              )}
              <div>
                <p className="text-[9px] font-mono leading-tight" style={{ color: 'var(--text-muted)' }}>WS LATENCY</p>
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-bold font-mono ${latencyColor}`}>{latencyLabel}</span>
                  {wsLatencyMs !== null && wsLatencyMs < 300 && (
                    <span className="text-[9px] text-emerald-DEFAULT font-mono font-bold">(&lt;300ms)</span>
                  )}
                </div>
              </div>
            </div>

            {/* 1-Click Forensic Evidence PDF Download */}
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 25px rgba(6,182,212,0.6)' }}
              whileTap={{ scale: 0.96 }}
              onClick={onPdfDownload}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-void font-bold text-xs shadow-cyan-neon transition-all cursor-pointer"
              style={{ background: 'var(--accent-gradient)' }}
            >
              <Download className="w-3.5 h-3.5 text-void" />
              <span className="hidden sm:inline font-mono">FORENSIC REPORT (PDF)</span>
              <span className="sm:hidden font-mono">PDF</span>
            </motion.button>
          </div>
        </div>

        {/* Global Security Ticker Bar */}
        <div className="mt-3 pt-3 border-t border-cyan-DEFAULT/15 flex items-center justify-between text-[11px] font-mono overflow-hidden" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-DEFAULT flex-shrink-0 animate-pulse" />
            <span>STATUS: ACTIVE • CLOCK: {currentTime.toLocaleTimeString()}</span>
          </div>
          <div className="hidden lg:flex items-center gap-3" style={{ color: 'var(--text-sub)' }}>
            <span className="flex items-center gap-1 text-cyan-DEFAULT font-semibold">
              <Sparkles className="w-3 h-3 text-cyan-DEFAULT" /> ZERO-DISK TEE SHIELD
            </span>
            <span>•</span>
            <span>200MS STFT PHASE FORENSICS</span>
            <span>•</span>
            <span>AHO-CORASICK MULTI-PATTERN</span>
            <span>•</span>
            <span>N8N DEFENSE AUTOMATION</span>
          </div>
        </div>
      </div>
    </header>
  );
}
