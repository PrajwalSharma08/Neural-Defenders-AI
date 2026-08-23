import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Search, ShieldAlert, ShieldCheck, AlertTriangle, Globe, Lock, Shield } from 'lucide-react';
import { useApiScanner } from '../hooks/useApiScanner.js';

function EntropyBar({ score }) {
  const color = score > 0.75 ? '#EF4444' : score > 0.5 ? '#F59E0B' : '#10B981';
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs font-mono mb-1.5">
        <span style={{ color: 'var(--text-sub)' }}>Shannon Entropy & DGA Distribution</span>
        <span style={{ color }} className="font-bold">{(score * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden p-0.5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
          initial={{ width: 0 }}
          animate={{ width: `${score * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function VerdictBadge({ verdict }) {
  const config = {
    SAFE: { color: '#10B981', icon: ShieldCheck, bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.4)', glow: '0 0 20px rgba(16,185,129,0.3)' },
    SUSPICIOUS: { color: '#F59E0B', icon: AlertTriangle, bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', glow: '0 0 20px rgba(245,158,11,0.3)' },
    PHISHING: { color: '#EF4444', icon: ShieldAlert, bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.4)', glow: '0 0 20px rgba(239,68,68,0.3)' },
  }[verdict] || { color: '#64748B', icon: Link, bg: 'transparent', border: 'rgba(100,116,139,0.3)', glow: 'none' };

  const Icon = config.icon;
  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all"
      style={{ backgroundColor: config.bg, border: `1px solid ${config.border}`, boxShadow: config.glow }}
    >
      <Icon className="w-7 h-7" style={{ color: config.color }} />
      <div>
        <p className="text-[10px] font-mono tracking-wider" style={{ color: 'var(--text-muted)' }}>THREAT VERDICT</p>
        <p className="text-xl font-bold font-mono" style={{ color: config.color }}>{verdict}</p>
      </div>
    </div>
  );
}

export default function LinkShieldTab({ onScanResult }) {
  const [urlInput, setUrlInput] = useState('');
  const [result, setResult] = useState(null);
  const { scanUrl, isLoading, error } = useApiScanner();

  const handleScan = useCallback(async () => {
    if (!urlInput.trim()) return;
    const data = await scanUrl(urlInput.trim());
    if (data) {
      setResult(data);
      if (onScanResult) onScanResult(data);
    }
  }, [urlInput, scanUrl, onScanResult]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleScan();
  };

  const sampleUrls = [
    { label: 'SBI Phishing', url: 'https://sbi-verification.xyz/netbanking/login.php' },
    { label: 'Paytm Scam', url: 'https://paytm-kyc-update.tk/login.php?user=verify' },
    { label: 'Shortener', url: 'https://bit.ly/3xX9kQ1' },
    { label: 'Legitimate Google', url: 'https://www.google.com/search?q=cybersecurity' },
  ];

  return (
    <div className="space-y-6">
      {/* Search Input Box */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-cyan-DEFAULT" />
          <h2 className="text-xs font-mono text-cyan-DEFAULT uppercase font-bold tracking-widest">
            Link Shield Phishing & Entropy Scanner
          </h2>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste suspicious URL (e.g. https://sbi-secure-update.xyz/login)..."
              className="hud-input w-full pl-11 pr-4 py-3.5 text-xs font-mono placeholder-slate-400 focus:outline-none transition-all"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(6,182,212,0.5)' }}
            whileTap={{ scale: 0.97 }}
            onClick={handleScan}
            disabled={isLoading || !urlInput.trim()}
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-void font-bold text-xs font-mono disabled:opacity-50 disabled:cursor-not-allowed shadow-cyan-neon transition-all"
            style={{ background: 'var(--accent-gradient)' }}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-void border-t-transparent rounded-full"
              />
            ) : (
              <Search className="w-4 h-4 text-void" />
            )}
            <span>SCAN URL</span>
          </motion.button>
        </div>

        {/* Preset Sample Badges */}
        <div className="mt-3.5 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>Demo Presets:</span>
          {sampleUrls.map(item => (
            <button
              key={item.label}
              onClick={() => { setUrlInput(item.url); }}
              className="hud-card text-[11px] px-2.5 py-1 text-cyan-DEFAULT hover:border-cyan-DEFAULT font-mono transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-3 text-xs text-crimson-DEFAULT font-mono">⚠ {error}</p>
        )}
      </div>

      {/* Analysis Results View */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Header Score & Verdict */}
            <div className="glass-panel p-6">
              <div className="flex flex-wrap gap-4 items-start justify-between">
                <VerdictBadge verdict={result.verdict} />
                <div className="flex gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-mono uppercase" style={{ color: 'var(--text-muted)' }}>Phishing Probability</p>
                    <p className="text-2xl sm:text-3xl font-bold font-mono text-crimson-DEFAULT">
                      {(result.phishing_score * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono uppercase" style={{ color: 'var(--text-muted)' }}>Inspection Time</p>
                    <p className="text-2xl sm:text-3xl font-bold font-mono text-cyan-DEFAULT">
                      {result.scan_ms?.toFixed(2)} ms
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <EntropyBar score={result.entropy_score} />
              </div>

              {/* Heuristic Characteristic Badges */}
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  { label: 'HTTPS TLS', active: result.is_https, good: true },
                  { label: 'SHORTENER', active: result.is_shortened, good: false },
                  { label: 'RAW IP HOST', active: result.has_ip_address, good: false },
                  { label: 'HIGH-ABUSE TLD', active: result.suspicious_tld, good: false },
                  { label: 'TYPOSQUATTING', active: result.typosquatting_detected, good: false },
                ].map(({ label, active, good }) => (
                  <span
                    key={label}
                    className="px-3 py-1 rounded-xl text-[10px] font-mono font-bold border transition-all"
                    style={{
                      color: active ? (good ? '#10B981' : '#EF4444') : '#64748B',
                      borderColor: active ? (good ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)') : 'rgba(100,116,139,0.25)',
                      background: active ? (good ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)') : 'transparent',
                    }}
                  >
                    {active ? (good ? '✓' : '⚠') : '–'} {label}
                  </span>
                ))}
              </div>

              {result.typosquatting_target && (
                <div className="mt-4 px-4 py-2.5 rounded-xl bg-crimson-DEFAULT/10 border border-crimson-DEFAULT/40 text-xs font-mono text-crimson-DEFAULT flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-crimson-DEFAULT flex-shrink-0" />
                  <span>
                    🚨 Brand Typosquatting Match: <strong>{result.typosquatting_target.toUpperCase()}</strong> (Homoglyph / Edit Distance Anomaly Detected)
                  </span>
                </div>
              )}
            </div>

            {/* Threat Indicators Breakdown */}
            {result.threat_indicators?.length > 0 && (
              <div className="glass-panel p-6">
                <h3 className="text-xs font-mono text-cyan-DEFAULT uppercase font-bold tracking-widest mb-3.5">
                  Detected Threat Vectors ({result.threat_indicators.length})
                </h3>
                <div className="space-y-2.5">
                  {result.threat_indicators.map((ind, i) => (
                    <div key={i} className="hud-card flex items-start gap-3.5 p-3.5 rounded-xl">
                      <AlertTriangle className="w-4 h-4 text-amber-DEFAULT flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono font-bold text-amber-DEFAULT">{ind.indicator_type}</span>
                          <span className="text-xs font-mono text-crimson-DEFAULT font-bold">{(ind.severity * 100).toFixed(0)}% severity</span>
                        </div>
                        <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-sub)' }}>{ind.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
