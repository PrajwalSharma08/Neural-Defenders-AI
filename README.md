# 🛡️ SentinelShield AI — Neural Defenders AI
**Real-Time Sub-Second Voice Deepfake, Phishing & Digital Arrest Defense Platform**  
**AICTE Smart India Hackathon (SIH 2026) — Problem Statement: SIH26104**  

---

## 🚀 Key Features

1. **🎤 Voice Integrity Shield:** Sub-second (<300ms) acoustic forensic pipeline utilizing 128-Mel Filterbanks, 13-MFCCs, 8–16kHz STFT Phase Variance, and Pitch Micro-Jitter biometrics. Trained on 6,900 multi-lingual audio files (3,450 Real Human + 3,450 AI Synthetic across 13 Indian languages) with **98.99% 5-fold CV accuracy, 99.49% test accuracy, and 0.9994 ROC-AUC**.
2. **🔗 Link & Phishing Shield:** Real-time URL threat intelligence featuring Shannon Domain Entropy calculation ($>3.5\text{ bits/char}$ for DGA detection), Levenshtein distance typosquatting matrix (60+ Indian banking & government brands), and shortener unmasking.
3. **📱 Digital Arrest & SMS Shield:** Aho-Corasick multi-pattern automaton ($O(n+m)$ single-pass search) detecting 82 extortion, CBI/Customs impersonation, and panic-inducing threats.
4. **🔒 Zero-Disk TEE Privacy:** In-memory RAM page-locking (`VirtualLock`/`mlock`) with immediate cryptographic memory zeroization (`ctypes.memset`) on exit.
5. **📄 Section 65B Forensic PDF Dossier:** In-memory generation of court-admissible forensic evidence certificates with SHA-256 telemetry chains.
6. **🎨 Modular Glassmorphism UI:** Zero-build Vanilla HTML5, CSS3 Glass Design System, and ES6 JavaScript (Dark Glass, Light Crystal Glass, and Neon Glass modes).

---

## 🛠️ Tech Stack

- **Backend:** Python 3.11, FastAPI, WebSockets, NumPy, SciPy, Scikit-Learn, Joblib, ReportLab
- **Frontend:** Pure HTML5, Modern CSS3 Glassmorphism System, Native ES6 JavaScript
- **Security:** TEE Volatile Buffers, SlowAPI Rate Limiting, OWASP Hardened Security Headers

---

## ⚡ Quick Start

### 1. Clone & Setup Backend
```bash
# Clone the repository
git clone https://github.com/prajwalsharma08/Neural-defenders-ai.git
cd Neural-defenders-ai

# Install dependencies
pip install -r backend/requirements.txt

# Run the server
python backend/main.py
```

### 2. Access the Application
Open your browser and visit:
👉 **`http://localhost:8888`**

---

## 👥 Team Neural Defenders (SIH26104)

- **Prajwal Sharma (Team Leader):** System Architect & Backend/ML Lead
- **Ritesh Mishra:** Primary Pitcher & Presentation Lead
- **Piyoosh Patel:** Frontend Lead (UI/UX Developer)
- **Shakti Maurya:** Cyber Security & Threat Intelligence Lead
- **Shivansh Mishra:** Integration & Full-Stack Specialist
- **Raj:** Web Security & Database Specialist (HTML/CSS & PHP/MySQL Lead)
