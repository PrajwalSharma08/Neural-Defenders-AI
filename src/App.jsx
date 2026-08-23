import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HeaderHUD from './components/HeaderHUD.jsx';
import VoiceShieldTab from './components/VoiceShieldTab.jsx';
import LinkShieldTab from './components/LinkShieldTab.jsx';
import SmsShieldTab from './components/SmsShieldTab.jsx';
import ForensicPdfModal from './components/ForensicPdfModal.jsx';
import { Shield, Link as LinkIcon, MessageSquare } from 'lucide-react';

const TABS = [
  { id: 'voice', label: '🎤 Voice Integrity Shield', shortLabel: 'Voice', icon: Shield },
  { id: 'link', label: '🔗 Link & Phishing Shield', shortLabel: 'Link', icon: LinkIcon },
  { id: 'sms', label: '📱 Digital Arrest & SMS Shield', shortLabel: 'SMS', icon: MessageSquare },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('voice');
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [wsLatencyMs, setWsLatencyMs] = useState(null);
  const [systemHealth, setSystemHealth] = useState('operational');
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('sentinel_theme');
    return saved === 'neon' ? 'neon' : 'dark';
  });

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light', 'neon');
    root.classList.add(theme);
    localStorage.setItem('sentinel_theme', theme);
  }, [theme]);

  // Multi-modal forensic evidence state
  const [forensicData, setForensicData] = useState({
    voice_data: null,
    url_data: null,
    sms_data: null,
    session_id: null,
  });

  const updateForensicData = useCallback((key, value) => {
    setForensicData(prev => ({ ...prev, [key]: value }));
  }, []);

  const gridClass = theme === 'neon' ? 'cyber-grid-neon' : 'cyber-grid-dark';

  return (
    <div className={`min-h-screen ${gridClass} relative transition-colors duration-300`}>
      {/* Dynamic Background Cyber Ambient Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {theme === 'neon' ? (
          <>
            <div className="absolute top-0 left-1/4 w-[550px] h-[550px] bg-purple-DEFAULT/20 rounded-full blur-[140px]" />
            <div className="absolute bottom-1/3 right-1/4 w-[450px] h-[450px] bg-cyan-DEFAULT/20 rounded-full blur-[140px]" />
          </>
        ) : (
          <>
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-DEFAULT/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-emerald-DEFAULT/5 rounded-full blur-[120px]" />
          </>
        )}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Top Header HUD with 3-way Theme Switcher */}
        <HeaderHUD
          wsLatencyMs={wsLatencyMs}
          systemHealth={systemHealth}
          onPdfDownload={() => setShowPdfModal(true)}
          currentTheme={theme}
          onThemeChange={setTheme}
        />

        {/* HUD Navigation Switcher Tabs */}
        <div className="mt-6 flex gap-2 p-1.5 glass-panel rounded-2xl w-fit shadow-md">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 sm:px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? theme === 'neon'
                      ? 'text-white bg-gradient-to-r from-purple-DEFAULT to-cyan-DEFAULT shadow-purple-neon'
                      : 'text-void bg-cyan-DEFAULT shadow-cyan-neon font-bold'
                    : 'hover:text-cyan-DEFAULT'
                }`}
                style={{
                  color: !isActive ? 'var(--text-sub)' : undefined,
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Modules */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {activeTab === 'voice' && (
              <motion.div
                key="voice"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <VoiceShieldTab
                  onLatencyUpdate={setWsLatencyMs}
                  onSessionData={(data) => updateForensicData('voice_data', data)}
                  onSessionId={(id) => updateForensicData('session_id', id)}
                />
              </motion.div>
            )}
            {activeTab === 'link' && (
              <motion.div
                key="link"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <LinkShieldTab
                  onScanResult={(data) => updateForensicData('url_data', data)}
                />
              </motion.div>
            )}
            {activeTab === 'sms' && (
              <motion.div
                key="sms"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <SmsShieldTab
                  onScanResult={(data) => updateForensicData('sms_data', data)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Forensic Evidence Report Modal */}
      <AnimatePresence>
        {showPdfModal && (
          <ForensicPdfModal
            forensicData={forensicData}
            onClose={() => setShowPdfModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
