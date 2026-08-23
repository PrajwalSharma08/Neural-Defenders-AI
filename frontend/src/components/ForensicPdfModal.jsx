import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download, FileText, Shield, Link, MessageSquare, Loader, CheckCircle, Lock } from 'lucide-react';
import { useApiScanner } from '../hooks/useApiScanner.js';

export default function ForensicPdfModal({ forensicData, onClose }) {
  const [downloaded, setDownloaded] = useState(false);
  const { downloadForensicReport, isLoading, error } = useApiScanner();

  const hasVoice = !!forensicData?.voice_data;
  const hasUrl = !!forensicData?.url_data;
  const hasSms = !!forensicData?.sms_data;
  const hasAnyData = hasVoice || hasUrl || hasSms;

  const handleDownload = async () => {
    const success = await downloadForensicReport(forensicData);
    if (success) setDownloaded(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 15 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="glass-panel w-full max-w-lg p-6 sm:p-7 relative shadow-2xl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="hud-card absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center hover:border-cyan-DEFAULT/50 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-xl bg-cyan-DEFAULT/15 border border-cyan-DEFAULT/40 flex items-center justify-center shadow-cyan-neon">
            <FileText className="w-6 h-6 text-cyan-DEFAULT" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-mono" style={{ color: 'var(--text-main)' }}>
              Official Forensic Evidence Dossier (PDF)
            </h2>
            <p className="text-[11px] font-mono flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
              <Lock className="w-3 h-3 text-emerald-DEFAULT" />
              <span>Section 65B Indian Evidence Act • SIH26104 AICTE</span>
            </p>
          </div>
        </div>

        {/* Dossier Item Ingestion Breakdown */}
        <div className="space-y-2.5 mb-5">
          <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
            Telemetry Dossier Ingestion State
          </p>
          {[
            { label: 'Voice Integrity STFT Spectrogram & Jitter Hashes', icon: Shield, active: hasVoice },
            { label: 'Phishing URL, Shannon Entropy & Typosquatting Analytics', icon: Link, active: hasUrl },
            { label: 'Digital Arrest / SMS Extortion Aho-Corasick Matches', icon: MessageSquare, active: hasSms },
          ].map(({ label, icon: Icon, active }) => (
            <div
              key={label}
              className="hud-card flex items-center gap-3 p-3 rounded-xl transition-all"
              style={{
                background: active ? 'rgba(6,182,212,0.12)' : 'var(--bg-card)',
                borderColor: active ? 'rgba(6,182,212,0.45)' : 'var(--border-card)',
              }}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-cyan-DEFAULT' : 'text-slate-400'}`} />
              <span className="text-xs font-mono font-medium" style={{ color: active ? 'var(--text-main)' : 'var(--text-muted)' }}>
                {label}
              </span>
              {active ? (
                <span className="ml-auto text-[10px] text-emerald-DEFAULT font-mono font-bold">✓ Ready</span>
              ) : (
                <span className="ml-auto text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>Pending Scan</span>
              )}
            </div>
          ))}
        </div>

        {!hasAnyData && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-amber-DEFAULT/10 border border-amber-DEFAULT/40">
            <p className="text-xs text-amber-DEFAULT font-mono">
              ⚠ No scan telemetry recorded in current session. Execute a Voice, Link, or SMS analysis first.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-crimson-DEFAULT/10 border border-crimson-DEFAULT/40">
            <p className="text-xs text-crimson-DEFAULT font-mono">⚠ {error}</p>
          </div>
        )}

        {downloaded && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-DEFAULT/10 border border-emerald-DEFAULT/40 flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-DEFAULT flex-shrink-0" />
            <p className="text-xs text-emerald-DEFAULT font-mono">
              Forensic dossier generated in RAM and streamed directly to downloads.
            </p>
          </div>
        )}

        {/* In-Memory Stream Action Button */}
        <motion.button
          whileHover={{ scale: hasAnyData && !isLoading ? 1.02 : 1, boxShadow: '0 0 25px rgba(6,182,212,0.5)' }}
          whileTap={{ scale: hasAnyData && !isLoading ? 0.98 : 1 }}
          onClick={handleDownload}
          disabled={isLoading || !hasAnyData}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-xs font-mono transition-all disabled:opacity-40 disabled:cursor-not-allowed text-void shadow-cyan-neon"
          style={{
            background: 'var(--accent-gradient)',
          }}
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              SYNTHESIZING REPORTLAB PDF IN VOLATILE RAM...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              STREAM OFFICIAL FORENSIC EVIDENCE PDF (ZERO-DISK)
            </>
          )}
        </motion.button>

        <p className="mt-3.5 text-center text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
          Volatile io.BytesIO buffer • Zero disk I/O • Cryptographically hashed
        </p>
      </motion.div>
    </motion.div>
  );
}
