/**
 * SentinelShield AI — Forensic PDF & Section 65B Export Module (Vanilla JS)
 */

window.ForensicPdf = {
  init() {
    const openBtn = document.getElementById('btnOpenPdfModal');
    const closeBtn = document.getElementById('btnClosePdfModal');
    const backdrop = document.getElementById('pdfModalBackdrop');
    const generateBtn = document.getElementById('btnGeneratePdf');

    if (openBtn) {
      openBtn.addEventListener('click', () => this.openModal());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this.closeModal();
      });
    }

    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.downloadPdf());
    }
  },

  openModal() {
    const backdrop = document.getElementById('pdfModalBackdrop');
    if (backdrop) {
      backdrop.classList.add('open');
      this.populateEvidencePreview();
    }
  },

  closeModal() {
    const backdrop = document.getElementById('pdfModalBackdrop');
    if (backdrop) {
      backdrop.classList.remove('open');
    }
  },

  populateEvidencePreview() {
    const shared = window.SentinelApp.sharedForensicData;
    const previewBox = document.getElementById('pdfEvidencePreviewBox');
    if (!previewBox) return;

    previewBox.innerHTML = `
      <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-main);">
        <p style="margin-bottom: 0.4rem;">
          • Voice Telemetry: <strong>${shared.voice_data ? `${shared.voice_data.verdict} (Risk: ${Math.round(shared.voice_data.risk_score * 100)}%)` : 'No voice stream recorded'}</strong>
        </p>
        <p style="margin-bottom: 0.4rem;">
          • URL Threat Inspection: <strong>${shared.url_data ? `${shared.url_data.verdict} (${shared.url_data.domain})` : 'No URL scan recorded'}</strong>
        </p>
        <p style="margin-bottom: 0.4rem;">
          • SMS Extortion Vectors: <strong>${shared.sms_data ? `${shared.sms_data.verdict} (${shared.sms_data.total_patterns_matched} matches)` : 'No SMS scan recorded'}</strong>
        </p>
        <p style="color: var(--accent-cyan); margin-top: 0.5rem;">
          • Section 65B Digital Attestation Hash: <em>${shared.voice_data ? shared.voice_data.attestation_hash : 'Dynamic HMAC-SHA256 will be compiled on download'}</em>
        </p>
      </div>
    `;
  },

  async downloadPdf() {
    const generateBtn = document.getElementById('btnGeneratePdf');
    const shared = window.SentinelApp.sharedForensicData;
    if (generateBtn) generateBtn.textContent = 'COMPILING IN-MEMORY PDF...';

    const payload = {
      session_id: shared.session_id || 'session_' + Math.random().toString(36).substring(2, 11),
      voice_data: shared.voice_data,
      url_data: shared.url_data,
      sms_data: shared.sms_data,
    };

    const apiUrl = window.SentinelApp.getApiUrl('/api/v1/forensic-report');

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SentinelShield_Section65B_Forensic_Dossier_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      this.closeModal();
    } catch (err) {
      console.error("PDF Download failed:", err);
      alert("PDF generation notice: When testing on static GitHub Pages, connect the backend server to generate court-signed ReportLab PDFs.");
    } finally {
      if (generateBtn) generateBtn.textContent = '📄 GENERATE & DOWNLOAD LEGAL PDF';
    }
  }
};
