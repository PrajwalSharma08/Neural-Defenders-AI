import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ShieldCheck, AlertTriangle, Zap, MessageSquare, PhoneCall } from 'lucide-react';
import { useApiScanner } from '../hooks/useApiScanner.js';

const CHANNEL_OPTIONS = ['sms', 'whatsapp', 'email', 'call_transcript', 'other'];

const CATEGORY_COLORS = {
  digital_arrest: '#EF4444',
  financial_extortion: '#F59E0B',
  urgency_pressure: '#8B5CF6',
  authority_impersonation: '#06B6D4',
  personal_threat: '#EC4899',
};

const CATEGORY_ICONS = {
  digital_arrest: '🚨',
  financial_extortion: '💸',
  urgency_pressure: '⏳',
  authority_impersonation: '🏛️',
  personal_threat: '⚠️',
};

function ThreatScoreBar({ score }) {
  const color = score > 0.65 ? '#EF4444' : score > 0.30 ? '#F59E0B' : '#10B981';
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs font-mono mb-1.5">
        <span style={{ color: 'var(--text-sub)' }}>Extortion Threat Probability Index</span>
        <span style={{ color }} className="font-bold">{(score * 100).toFixed(1)}%</span>
      </div>
      <div className="h-3 rounded-full overflow-hidden p-0.5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
        <motion.div
          className="h-full rounded-full relative overflow-hidden"
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
          initial={{ width: 0 }}
          animate={{ width: `${score * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="absolute inset-0 bg-white/15" />
        </motion.div>
      </div>
    </div>
  );
}

export default function SmsShieldTab({ onScanResult }) {
  const [text, setText] = useState('');
  const [channel, setChannel] = useState('sms');
  const [result, setResult] = useState(null);
  const { scanMessage, isLoading, error } = useApiScanner();

  const handleScan = useCallback(async () => {
    if (!text.trim()) return;
    const data = await scanMessage(text.trim(), channel);
    if (data) {
      setResult(data);
      if (onScanResult) onScanResult(data);
    }
  }, [text, channel, scanMessage, onScanResult]);

  const presetSamples = [
    {
      title: '🚨 Digital Arrest Scam',
      sample: 'This is Cyber Crime Branch CBI Delhi. A non-bailable arrest warrant has been issued against you due to illegal customs parcel seizure. You are under digital arrest. You must transfer Rs 50,000 within 2 hours to safe RBI account or police will arrive.',
    },
    {
      title: '⏳ SIM Block Urgency',
      sample: 'Dear customer, your mobile SIM card will be blocked within 30 minutes due to pending KYC update. Call customer support immediately to avoid service suspension.',
    },
    {
      title: '🛡️ Legitimate OTP',
      sample: 'Your one-time password for HDFC NetBanking login is 839201. Valid for 5 minutes. Do not share this OTP with anyone.',
    },
  ];

  const verdictConfig = result ? {
    SAFE: { color: '#10B981', Icon: ShieldCheck, label: 'Message appears benign. No extortion patterns detected.' },
    SUSPICIOUS: { color: '#F59E0B', Icon: AlertTriangle, label: 'Suspicious language detected. Verify through official channels.' },
    SCAM_DETECTED: { color: '#EF4444', Icon: ShieldAlert, label: 'High Scam Probability. Do not comply with demands.' },
    DIGITAL_ARREST_DETECTED: { color: '#EF4444', Icon: ShieldAlert, label: 'CRITICAL: DIGITAL ARREST EXTORTION DETECTED!' },
  }[result.verdict] : null;

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-DEFAULT" />
            <h2 className="text-xs font-mono text-cyan-DEFAULT uppercase font-bold tracking-widest">
              Digital Arrest & Extortion Analyzer
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono" style={{ color: 'var(--text-sub)' }}>Source Channel:</span>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="hud-input text-xs font-mono rounded-xl px-3 py-1.5 focus:outline-none"
            >
              {CHANNEL_OPTIONS.map(opt => (
                <option key={opt} value={opt} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                  {opt.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Paste incoming SMS, WhatsApp message, extortion email, or suspicious call transcript here..."
          className="hud-input w-full p-4 text-xs font-mono placeholder-slate-400 focus:outline-none resize-none transition-all leading-relaxed"
        />

        <div className="mt-3.5 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>Demo Presets:</span>
            {presetSamples.map(p => (
              <button
                key={p.title}
                onClick={() => setText(p.sample)}
                className="hud-card text-[11px] px-2.5 py-1 text-cyan-DEFAULT hover:border-cyan-DEFAULT font-mono transition-colors"
              >
                {p.title}
              </button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(6,182,212,0.5)' }}
            whileTap={{ scale: 0.97 }}
            onClick={handleScan}
            disabled={isLoading || !text.trim()}
            className="flex items-center gap-2 px-7 py-3 rounded-xl text-void font-bold text-xs font-mono disabled:opacity-50 shadow-cyan-neon transition-all"
            style={{ background: 'var(--accent-gradient)' }}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-void border-t-transparent rounded-full"
              />
            ) : (
              <Zap className="w-4 h-4 text-void" />
            )}
            <span>ANALYZE MESSAGE</span>
          </motion.button>
        </div>

        {error && <p className="mt-3 text-xs text-crimson-DEFAULT font-mono">⚠ {error}</p>}
      </div>

      {/* Analysis Result Details */}
      <AnimatePresence>
        {result && verdictConfig && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Verdict Card */}
            <div className="glass-panel p-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: `${verdictConfig.color}20`, border: `1px solid ${verdictConfig.color}50` }}
                >
                  <verdictConfig.Icon className="w-7 h-7" style={{ color: verdictConfig.color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-wide" style={{ color: verdictConfig.color }}>
                    {result.verdict.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-sub)' }}>{verdictConfig.label}</p>
                </div>
              </div>

              <div className="mt-5">
                <ThreatScoreBar score={result.threat_score} />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { label: 'Aho-Corasick Matches', value: result.total_patterns_matched },
                  { label: 'Source Ingestion', value: result.source_channel.toUpperCase() },
                  { label: 'Evaluation Latency', value: `${result.scan_ms?.toFixed(3)} ms` },
                ].map(({ label, value }) => (
                  <div key={label} className="hud-card p-3 text-center">
                    <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    <p className="text-xs font-bold text-cyan-DEFAULT font-mono mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {/* Recommended Action Plan */}
              <div className="hud-card mt-4 p-4 border border-amber-DEFAULT/40 flex items-start gap-3">
                <PhoneCall className="w-5 h-5 text-amber-DEFAULT flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-amber-DEFAULT font-mono font-bold uppercase tracking-wider mb-0.5">
                    RECOMMENDED CITIZEN DEFENSE ACTION
                  </p>
                  <p className="text-xs font-mono leading-relaxed" style={{ color: 'var(--text-main)' }}>{result.recommended_action}</p>
                </div>
              </div>
            </div>

            {/* Aho-Corasick Matched Pattern Breakdown */}
            {result.matched_patterns?.length > 0 && (
              <div className="glass-panel p-6">
                <h3 className="text-xs font-mono text-cyan-DEFAULT uppercase font-bold tracking-widest mb-4">
                  Aho-Corasick Automaton Matches ({result.total_patterns_matched})
                </h3>
                <div className="space-y-3">
                  {result.matched_patterns.map((pat, i) => {
                    const catColor = CATEGORY_COLORS[pat.category] || '#64748B';
                    const catIcon = CATEGORY_ICONS[pat.category] || '⚠️';
                    return (
                      <div
                        key={i}
                        className="hud-card p-4 transition-all"
                        style={{ borderColor: `${catColor}50` }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{catIcon}</span>
                            <span className="text-xs font-bold font-mono" style={{ color: catColor }}>
                              [{pat.pattern_id}] {pat.pattern_name}
                            </span>
                          </div>
                          <span
                            className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full"
                            style={{ color: catColor, background: `${catColor}20`, border: `1px solid ${catColor}40` }}
                          >
                            {(pat.weight * 100).toFixed(0)}% weight
                          </span>
                        </div>
                        <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>Category: {pat.category.replace(/_/g, ' ')}</p>
                        <div className="mt-2 px-3 py-1.5 rounded-lg border-l-2" style={{ background: 'var(--bg-panel)', borderColor: catColor }}>
                          <p className="text-xs font-mono italic" style={{ color: 'var(--text-main)' }}>&ldquo;{pat.matched_fragment}&rdquo;</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
