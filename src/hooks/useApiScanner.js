import { useState, useCallback } from 'react';

const BASE_URL = '/api/v1';

export function useApiScanner() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const scanUrl = useCallback(async (url) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/scan-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.detail?.message || `Scan failed with status ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const scanMessage = useCallback(async (text, sourceChannel = 'sms') => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/scan-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source_channel: sourceChannel }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.detail?.message || `Analysis failed with status ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const downloadForensicReport = useCallback(async (forensicData) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/forensic-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forensicData),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.detail?.message || `PDF generation failed with status ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sentinelshield_forensic_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { scanUrl, scanMessage, downloadForensicReport, isLoading, error };
}
