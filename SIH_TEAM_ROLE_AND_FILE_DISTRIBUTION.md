# 🏆 SIH 2026 (Problem Statement: SIH26104) — Team Role & File Distribution Matrix

**Project Name:** SentinelShield AI  
**Problem Statement Reference:** SIH26104 (AICTE Smart India Hackathon 2026)  
**Core Domain:** AI Voice Cloning, Digital Arrest Extortion & Phishing Defense Platform  

---

## 👥 1. Executive Team Distribution Summary

```
                               ┌────────────────────────────────────────────────┐
                               │           PRAJWAL SHARMA (Team Leader)         │
                               │        System Architect & Backend/ML Lead      │
                               └───────────────────────┬────────────────────────┘
                                                       │
         ┌────────────────────────┬────────────────────┴───────────────┬────────────────────────┐
         │                        │                                    │                        │
         ▼                        ▼                                    ▼                        ▼
┌──────────────────┐    ┌───────────────────┐               ┌─────────────────────┐   ┌────────────────────┐
│  RITESH MISHRA   │    │   PIYOOSH PATEL   │               │   SHIVANSH MISHRA   │   │   SHAKTI MAURYA    │
│  Primary Pitcher │    │   Frontend Lead   │               │  Integration & Full-│   │  Cyber Security &  │
│ & Presentation   │    │  (UI/UX Developer)│               │  Stack Specialist   │   │ Threat Intel Lead  │
└──────────────────┘    └───────────────────┘               └─────────────────────┘   └────────────────────┘
                                                                       │
                                                            ┌──────────┴──────────┐
                                                            ▼                     ▼
                                                    ┌───────────────────────────────┐
                                                    │        RACHIT JAISWAL         │
                                                    │  DSA & Optimization Engineer  │
                                                    └───────────────────────────────┘
```

---

## 📋 2. Member-Wise Detailed File & Responsibility Breakdown

---

### 👑 1. Prajwal Sharma *(Team Leader)*
- **Hackathon Role:** System Architect & Backend/ML Lead
- **Assigned Project Files / Codebase Modules:**
  - `backend/main.py` (FastAPI router, WebSocket `/ws/voice-stream` handler, REST endpoints)
  - `backend/services/voice_dsp.py` (128-Mel Filterbank, 13-MFCC extraction, STFT 8-16kHz Phase Variance, pYIN pitch jitter, VAD gate)
  - `backend/core/tee_guard.py` (RAM page-locking `VirtualLock`/`mlock`, `ctypes.memset` zeroization, HMAC-SHA256 tokens)
  - `backend/scripts/train_dataset_model.py` (Random Forest training on 960 audio files, StandardScaler)
  - `backend/models/voice_classifier.joblib` (Trained ML model artifact)
- **Key Responsibilities & Deliverables:**
  - FastAPI server aur WebSockets live streaming engine maintain karna.
  - Sub-second DSP feature extraction & ML model inference ($<300\text{ms}$) optimize karna.
  - Zero-Disk TEE memory security guarantee demonstrate karna.
- **Judge Presentation Focus (Prajwal Kya Bolega):**
  > *"Maine entire backend architecture, WebSockets voice streaming pipeline, zero-disk RAM memory pinning, aur 960-file multi-lingual machine learning classifier (97.29% accuracy) design aur implement kiya hai."*

---

### 🎤 2. Ritesh Mishra
- **Hackathon Role:** Primary Pitcher & Presentation Lead
- **Assigned Project Files / Deliverables:**
  - `SentinelShield_AI_Complete_Proposal_Synopsis_Implementation_Plan.docx` (Master 8-Section Proposal)
  - `PROJECT_PROPOSAL_SYNOPSIS_IMPLEMENTATION_PLAN.md` (Markdown Documentation)
  - `SIH26104_Pitch_Deck.pptx` (8-Slide Hackathon Pitch Deck)
  - `frontend/src/components/HeaderHUD.jsx` (Top telemetry text, SIH26104 banner, branding stats)
- **Key Responsibilities & Deliverables:**
  - **3-Minute Pitch:** Problem statement, live demo hook, and impact numbers deliver karna.
  - **Q&A Defense:** Judges ke technical aur mathematical cross-questions ke answers prepare karna (Jitter $1.5\%-4.5\%$, Shannon Entropy $>3.5$, Section 65B Indian Evidence Act).
  - Frontend ke marketing stats aur UI banners ko align karna.
- **Judge Presentation Focus (Ritesh Kya Bolega):**
  > *"Humne AICTE SIH26104 ke liye end-to-end multi-modal cyber defense platform build kiya hai jo Deepfake Voice, Digital Arrest aur Phishing scams ko real time me neutralize karta hai. Main iska real-world impact, I4C compliance aur business viability present kar raha hu."*

---

### 🎨 3. Piyoosh Patel
- **Hackathon Role:** Frontend Lead (UI/UX Developer)
- **Assigned Project Files / Codebase Modules:**
  - `frontend/src/App.jsx` (State management, tab switching, Dark & Neon dynamic theme engine)
  - `frontend/src/components/VoiceShieldTab.jsx` (Risk Gauge 0-100%, 42-band HTML5 Canvas Audio Spectrogram, Oscilloscope beam)
  - `frontend/src/components/LinkShieldTab.jsx` (Entropy meter, DGA flags, Brand threat visualizer)
  - `frontend/src/components/SmsShieldTab.jsx` (Channel selector, Digital arrest categorization cards)
  - `frontend/src/index.css` (Tailwind styles, Neon glow filters, Cyber void glassmorphism)
- **Key Responsibilities & Deliverables:**
  - High-Tech Cyber Operations HUD interface develop karna.
  - 60 FPS HTML5 Canvas visualizer aur Framer Motion radial gauge meter ready rakhna.
  - Dark aur Cyberpunk Ultra Neon theme switching seamlessly handle karna.
- **Judge Presentation Focus (Piyoosh Kya Bolega):**
  > *"Maine React 18, TailwindCSS aur Framer Motion se zero-latency Cyber HUD banaya hai jisme 60 FPS HTML5 Canvas par real-time frequency spectrum aur sub-second dynamic risk gauge render hota hai."*

---

### 🛡️ 4. Shakti Maurya
- **Hackathon Role:** Cyber Security & Threat Intelligence Lead
- **Assigned Project Files / Codebase Modules:**
  - `backend/services/link_shield/entropy_scanner.py` (Shannon Entropy formula, DGA heuristics, URL shortener detection)
  - `backend/services/link_shield/typosquatting.py` (60+ Indian banks, telecom, and govt portal brand dictionaries)
  - `backend/core/security.py` (CSP, HSTS, X-Frame-Options headers, MIME-type binary validation)
  - `backend/schemas/url.py` & `backend/schemas/message.py` (Threat indicators and severity models)
- **Key Responsibilities & Deliverables:**
  - Phishing link heuristics, domain entropy threshold ($>3.5\text{ bits}$), aur brand spoof regex library curate karna.
  - Digital Arrest aur extortion keywords dataset prepare karna (CBI, Customs, NCB, Supreme Court, TRAI).
  - API rate-limiting rules aur security headers verify karna.
- **Judge Presentation Focus (Shakti Kya Bolega):**
  > *"Maine Threat Intelligence pipeline design ki hai: Shannon Entropy se DGA links pakadna, 60+ Indian banking brand typosquatting detect karna, aur API ko OWASP-compliant security headers se harden karna."*

---

### ⚙️ 5. Shivansh Mishra
- **Hackathon Role:** Integration & Full-Stack Specialist (All-Rounder)
- **Assigned Project Files / Codebase Modules:**
  - `frontend/src/hooks/useAudioStreamer.js` (WebAudio API, 200ms PCM chunking, WebSocket client)
  - `frontend/src/components/ForensicPdfModal.jsx` (Report download trigger and preview)
  - `backend/services/forensic_pdf.py` (In-memory ReportLab Section 65B Indian Evidence Act PDF engine)
  - `backend/services/n8n_dispatcher.py` (HMAC-signed asynchronous incident response dispatcher)
  - `demo_backup_video.mp4` (2-Minute Fail-Safe Screen Recording Demo)
- **Key Responsibilities & Deliverables:**
  - Frontend WebAudio stream aur backend WebSocket endpoints ko bind karna.
  - Section 65B court-admissible forensic PDF generation engine implement karna.
  - Live demo network failure se bachne ke liye 2-minute backup screen recording ready rakhna.
- **Judge Presentation Focus (Shivansh Kya Bolega):**
  > *"Maine frontend WebAudio pipeline ko backend se seamlessly integrate kiya hai, Section 65B Indian Evidence Act forensic PDF engine banaya hai, aur live demo fail-safe redundancy maintain ki hai."*

---

### ⚡ 6. Rachit Jaiswal
- **Hackathon Role:** DSA & Optimization Engineer
- **Assigned Project Files / Codebase Modules:**
  - `backend/services/sms_shield.py` (Aho-Corasick Multi-Pattern Trie Automaton, $O(n+m)$ string lookup)
  - `backend/scripts/evaluate_full_dataset.py` (Dataset benchmarking script across 960 files)
  - `frontend/src/components/VoiceShieldTab.jsx` (Audio buffer memory cleanup, garbage collection optimization)
  - `backend/core/config.py` (Dynamic rate limiting algorithms and leaky bucket settings)
- **Key Responsibilities & Deliverables:**
  - Text aur URL scanning ke liye $O(n+m)$ time complexity Aho-Corasick automaton implement karna.
  - Real-time telemetry buffer structures optimize karna taaki long streaming calls me memory leak na ho.
  - Frontend form validations aur edge-case error boundaries manage karna.
- **Judge Presentation Focus (Rachit Kya Bolega):**
  > *"Maine string matching complexity ko $O(n \times m)$ se reduce karke Aho-Corasick Trie se $O(n+m)$ sub-millisecond lookup kiya hai, aur live audio buffer streaming data structures ko zero-memory-leak ke liye optimize kiya hai."*

---

## 🎯 3. Judge Presentation Sequence (Chronological Order)

| Step | Member Speaking | Topic Covered | Live Action on Screen |
| :---: | :--- | :--- | :--- |
| **1 (0:00 - 0:45)** | **Ritesh Mishra** | Problem Statement (SIH26104), Threat Matrix (Deepfake voice, Digital arrest), Solution Overview | Shows Presentation Deck / Intro Banner |
| **2 (0:45 - 1:30)** | **Piyoosh Patel & Shivansh Mishra** | Live UI Demo: Voice Shield, Live Mic Stream, Uploading AI vs Human audio file | Operates Live Dashboard at `http://localhost:9999` |
| **3 (1:30 - 2:05)** | **Prajwal Sharma** | Backend Architecture, 128-Mel DSP, 960-file ML model, Zero-Disk TEE memory locking | Shows Terminal / WebSocket Telemetry / Model Metrics |
| **4 (2:05 - 2:30)** | **Shakti Maurya & Rachit Jaiswal** | Link Shield (Shannon Entropy), SMS Shield (Aho-Corasick $O(n+m)$), Digital Arrest weights | Scans malicious URL and Extortion SMS |
| **5 (2:30 - 3:00)** | **Ritesh & Prajwal** | Section 65B Forensic PDF Download, n8n automated banking freeze, Closing Pitch | Downloads Forensic PDF & Concludes |
