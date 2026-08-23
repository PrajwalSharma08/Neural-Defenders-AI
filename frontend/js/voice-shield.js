/**
 * SentinelShield AI — Voice Integrity & Deepfake Defense Module (Vanilla JS)
 */

window.VoiceShield = {
  isStreaming: false,
  ws: null,
  audioCtx: null,
  processor: null,
  stream: null,
  pingInterval: null,
  pingStartTime: null,
  chunkBuffer: [],
  sampleCount: 0,
  
  TARGET_SAMPLE_RATE: 16000,
  BUFFER_DURATION_MS: 200,
  SAMPLES_PER_CHUNK: 3200,

  // Visualizer properties
  canvas: null,
  ctx: null,
  animId: null,
  currentFreqData: new Uint8Array(42),
  activePhase: 0,

  init() {
    this.canvas = document.getElementById('visualizerCanvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.startVisualizerLoop();
    }

    // Bind Mic Toggle Button
    const micBtn = document.getElementById('btnToggleMic');
    if (micBtn) {
      micBtn.addEventListener('click', () => this.toggleStreaming());
    }

    // Bind Upload Input & Dropzone
    const dropzone = document.getElementById('voiceDropzone');
    const fileInput = document.getElementById('voiceFileInput');
    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.uploadAudioFile(e.target.files[0]);
        }
      });

      // Drag and drop events
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--accent-cyan)';
      });
      dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = 'var(--glass-border)';
      });
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--glass-border)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.uploadAudioFile(e.dataTransfer.files[0]);
        }
      });
    }
  },

  // --------------------------------------------------------------------------
  // WebAudio API & WebSocket Streaming
  // --------------------------------------------------------------------------
  async toggleStreaming() {
    if (this.isStreaming) {
      this.stopStreaming();
    } else {
      await this.startStreaming();
    }
  },

  async startStreaming() {
    try {
      const micBtn = document.getElementById('btnToggleMic');
      const micStatusText = document.getElementById('micStatusText');
      if (micBtn) micBtn.innerHTML = `<span>⏹ STOP LIVE SHIELD</span>`;
      if (micStatusText) micStatusText.textContent = "LISTENING (16kHz PCM WebAudio)...";

      // 1. Setup WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/voice-stream`;
      this.ws = new WebSocket(wsUrl);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        const sessionId = 'session_' + Math.random().toString(36).substring(2, 11);
        this.ws.send(JSON.stringify({
          action: 'start',
          session_id: sessionId,
          sample_rate: this.TARGET_SAMPLE_RATE,
        }));

        // Start ping loop
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.pingStartTime = performance.now();
            this.ws.send(JSON.stringify({ action: 'ping' }));
          }
        }, 3000);
      };

      this.ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          try {
            const msg = JSON.parse(event.data);
            if (msg.action === 'pong' && this.pingStartTime) {
              const rtt = Math.round((performance.now() - this.pingStartTime) / 2);
              window.SentinelApp.updateLatency(rtt);
              this.pingStartTime = null;
              return;
            }
            if (msg.risk_score !== undefined) {
              this.updateResults(msg);
            }
          } catch (e) {
            console.error("WS Parse error", e);
          }
        }
      };

      // 2. Setup WebAudio Microphone Stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: this.TARGET_SAMPLE_RATE,
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });

      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.TARGET_SAMPLE_RATE,
      });

      const source = this.audioCtx.createMediaStreamSource(this.stream);
      this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);

      this.chunkBuffer = [];
      this.sampleCount = 0;

      this.processor.onaudioprocess = (e) => {
        if (!this.isStreaming) return;
        const inputData = e.inputBuffer.getChannelData(0);

        // Feed visualizer
        for (let i = 0; i < 42; i++) {
          const sample = Math.abs(inputData[i * 10] || 0);
          this.currentFreqData[i] = Math.min(255, Math.floor(sample * 450));
        }

        // Downsample / convert float32 to int16 PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        this.chunkBuffer.push(pcm16);
        this.sampleCount += pcm16.length;

        if (this.sampleCount >= this.SAMPLES_PER_CHUNK) {
          const merged = new Int16Array(this.sampleCount);
          let offset = 0;
          for (const chunk of this.chunkBuffer) {
            merged.set(chunk, offset);
            offset += chunk.length;
          }
          this.chunkBuffer = [];
          this.sampleCount = 0;

          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(merged.buffer);
          }
        }
      };

      source.connect(this.processor);
      this.processor.connect(this.audioCtx.destination);
      this.isStreaming = true;
    } catch (err) {
      console.error("Microphone capture failed:", err);
      alert("Microphone capture failed: " + err.message);
      this.stopStreaming();
    }
  },

  stopStreaming() {
    this.isStreaming = false;
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    const micBtn = document.getElementById('btnToggleMic');
    const micStatusText = document.getElementById('micStatusText');
    if (micBtn) micBtn.innerHTML = `<span>🎤 START LIVE VOICE SHIELD</span>`;
    if (micStatusText) micStatusText.textContent = "STANDBY (Click to Activate 200ms Telemetry)";
    this.currentFreqData.fill(0);
  },

  // --------------------------------------------------------------------------
  // Audio File Upload (REST API)
  // --------------------------------------------------------------------------
  async uploadAudioFile(file) {
    const uploadStatus = document.getElementById('uploadStatusText');
    if (uploadStatus) uploadStatus.textContent = `Analyzing ${file.name} in RAM TEE...`;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/v1/analyze-audio', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      this.updateResults(data);
      if (uploadStatus) uploadStatus.textContent = `Completed analysis for ${file.name}`;
    } catch (err) {
      console.error("Upload failed", err);
      if (uploadStatus) uploadStatus.textContent = `Error: ${err.message}`;
    }
  },

  // --------------------------------------------------------------------------
  // Update Results & Gauge
  // --------------------------------------------------------------------------
  updateResults(data) {
    window.SentinelApp.sharedForensicData.voice_data = data;
    window.SentinelApp.sharedForensicData.session_id = data.session_id;

    const riskPct = Math.round((data.risk_score || 0) * 100);
    const gaugeCircle = document.getElementById('gaugeProgressCircle');
    const gaugePct = document.getElementById('gaugePctText');
    const gaugeLabel = document.getElementById('gaugeLabelText');
    const speechProgress = document.getElementById('speechProgressBar');
    const speechSecsText = document.getElementById('speechSecsText');

    // Telemetry metric cards
    const valSNR = document.getElementById('valSNR');
    const valPhase = document.getElementById('valPhase');
    const valJitter = document.getElementById('valJitter');
    const valLatency = document.getElementById('valProcessingTime');

    if (valSNR) valSNR.textContent = `${data.snr_db || 0} dB`;
    if (valPhase) valPhase.textContent = `${data.phase_variance || 0}`;
    if (valJitter) valJitter.textContent = `${data.pitch_jitter || 0}`;
    if (valLatency) valLatency.textContent = `${data.processing_ms || 0} ms`;

    // Speech accumulation progress
    if (speechProgress && speechSecsText) {
      const secs = data.speech_seconds || 0;
      const pct = Math.min(100, Math.round((secs / 2.5) * 100));
      speechProgress.style.width = `${pct}%`;
      speechSecsText.textContent = `Gathering Speech Telemetry: (${secs.toFixed(1)}s / 2.5s)`;
    }

    // Update gauge
    if (gaugePct) gaugePct.textContent = `${riskPct}%`;
    if (gaugeCircle) {
      // Circumference = 2 * PI * 90 ≈ 565
      const offset = 565 - (565 * riskPct) / 100;
      gaugeCircle.style.strokeDashoffset = offset;

      if (data.verdict === 'SILENCE') {
        gaugeCircle.style.stroke = 'var(--text-muted)';
        if (gaugeLabel) {
          gaugeLabel.className = 'verdict-pill verdict-silence';
          gaugeLabel.innerHTML = '🔇 VAD SILENCE GATE';
        }
      } else if (data.verdict === 'LISTENING') {
        gaugeCircle.style.stroke = 'var(--accent-purple)';
        if (gaugeLabel) {
          gaugeLabel.className = 'verdict-pill verdict-listening';
          gaugeLabel.innerHTML = '⚡ LISTENING / ACCUMULATING SPEECH';
        }
      } else if (data.verdict === 'AI_DETECTED' || riskPct >= 60) {
        gaugeCircle.style.stroke = 'var(--accent-crimson)';
        if (gaugeLabel) {
          gaugeLabel.className = 'verdict-pill verdict-danger';
          gaugeLabel.innerHTML = '🚨 SYNTHETIC AI VOICE DETECTED';
        }
      } else if (data.verdict === 'AI_SUSPECTED' || riskPct >= 35) {
        gaugeCircle.style.stroke = 'var(--accent-amber)';
        if (gaugeLabel) {
          gaugeLabel.className = 'verdict-pill verdict-suspected';
          gaugeLabel.innerHTML = '⚠️ SUSPICIOUS VOICE PATTERN';
        }
      } else {
        gaugeCircle.style.stroke = 'var(--accent-emerald)';
        if (gaugeLabel) {
          gaugeLabel.className = 'verdict-pill verdict-human';
          gaugeLabel.innerHTML = '✅ GENUINE HUMAN VOICE';
        }
      }
    }
  },

  // --------------------------------------------------------------------------
  // 60 FPS HTML5 Canvas Neon Spectrogram & Oscilloscope Visualizer
  // --------------------------------------------------------------------------
  startVisualizerLoop() {
    const render = () => {
      if (this.canvas && this.ctx) {
        const w = (this.canvas.width = this.canvas.offsetWidth);
        const h = (this.canvas.height = this.canvas.offsetHeight);
        this.ctx.clearRect(0, 0, w, h);

        const barCount = 42;
        const barWidth = w / barCount - 2;

        this.activePhase += 0.05;

        // Draw EQ Frequency Bars
        for (let i = 0; i < barCount; i++) {
          let val = this.currentFreqData[i] || 0;
          if (!this.isStreaming) {
            val = Math.sin(this.activePhase + i * 0.2) * 15 + 18;
          }
          const barH = (val / 255) * (h * 0.75);
          const x = i * (barWidth + 2);
          const y = h - barH - 10;

          // 8-16 kHz Anomaly zone (bars 28 to 42)
          if (i >= 28) {
            this.ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
          } else {
            this.ctx.fillStyle = 'rgba(6, 182, 212, 0.75)';
          }
          this.ctx.fillRect(x, y, barWidth, barH);
        }

        // Draw Sine Oscilloscope Beam
        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#00f0ff';
        for (let x = 0; x < w; x += 4) {
          const amp = this.isStreaming ? (this.currentFreqData[x % 42] || 10) * 0.25 : 12;
          const y = h / 2 + Math.sin(x * 0.03 + this.activePhase) * amp;
          if (x === 0) this.ctx.moveTo(x, y);
          else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
      }
      this.animId = requestAnimationFrame(render);
    };
    render();
  }
};
