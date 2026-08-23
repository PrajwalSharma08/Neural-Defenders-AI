import { useRef, useState, useCallback, useEffect } from 'react';

const WS_PATH = '/ws/voice-stream';
const BUFFER_DURATION_MS = 200;
const TARGET_SAMPLE_RATE = 16000;
const PING_INTERVAL_MS = 3000;

export function useAudioStreamer({ onResult, onLatency, onSessionSummary }) {
  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const pingTimestampRef = useRef(null);
  const chunkBufferRef = useRef([]);
  const sampleCountRef = useRef(0);

  const [isStreaming, setIsStreaming] = useState(false);
  const [latestResult, setLatestResult] = useState(null);
  const [latencyMs, setLatencyMs] = useState(null);
  const [error, setError] = useState(null);

  const SAMPLES_PER_CHUNK = Math.floor(TARGET_SAMPLE_RATE * BUFFER_DURATION_MS / 1000); // 3200

  const connectWS = useCallback(() => {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}${WS_PATH}`;

      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        const sessionId = crypto.randomUUID();
        ws.send(JSON.stringify({
          action: 'start',
          session_id: sessionId,
          sample_rate: TARGET_SAMPLE_RATE,
        }));
        resolve(ws);
      };

      ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          try {
            const msg = JSON.parse(event.data);

            if (msg.action === 'pong' && pingTimestampRef.current) {
              const rtt = performance.now() - pingTimestampRef.current;
              const halfRtt = Math.round(rtt / 2);
              setLatencyMs(halfRtt);
              if (onLatency) onLatency(halfRtt);
              pingTimestampRef.current = null;
              return;
            }

            if (msg.action === 'session_summary') {
              if (onSessionSummary) onSessionSummary(msg);
              return;
            }

            if (msg.risk_score !== undefined) {
              setLatestResult(msg);
              if (onResult) onResult(msg);
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        }
      };

      ws.onerror = (e) => {
        setError('WebSocket error encountered. Ensure backend is running.');
        reject(e);
      };

      ws.onclose = () => {
        setIsStreaming(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      };
    });
  }, [onResult, onLatency, onSessionSummary]);

  const startStreaming = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: TARGET_SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: TARGET_SAMPLE_RATE,
      });
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const bufferSize = 2048;
      const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;

      const ws = await connectWS();
      wsRef.current = ws;

      chunkBufferRef.current = [];
      sampleCountRef.current = 0;

      processor.onaudioprocess = (event) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const float32 = event.inputBuffer.getChannelData(0);
        chunkBufferRef.current.push(...float32);
        sampleCountRef.current += float32.length;

        while (chunkBufferRef.current.length >= SAMPLES_PER_CHUNK) {
          const chunk = chunkBufferRef.current.splice(0, SAMPLES_PER_CHUNK);
          const pcm = new Int16Array(chunk.length);
          for (let i = 0; i < chunk.length; i++) {
            pcm[i] = Math.max(-32768, Math.min(32767, Math.round(chunk[i] * 32767)));
          }
          ws.send(pcm.buffer);
        }
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          pingTimestampRef.current = performance.now();
          ws.send(JSON.stringify({ action: 'ping' }));
        }
      }, PING_INTERVAL_MS);

      setIsStreaming(true);
    } catch (err) {
      setError(err.message || 'Microphone access denied or audio initialization failed.');
    }
  }, [connectWS, SAMPLES_PER_CHUNK]);

  const stopStreaming = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'end_session' }));
      setTimeout(() => {
        if (wsRef.current) wsRef.current.close();
      }, 300);
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    chunkBufferRef.current = [];
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  return { isStreaming, startStreaming, stopStreaming, latestResult, latencyMs, error };
}
