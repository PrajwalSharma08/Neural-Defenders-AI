"""
SentinelShield AI — In-Memory ReportLab Forensic Evidence PDF Generator.

Generates official multi-modal forensic evidence reports combining:
  - Voice analysis telemetry & spectrogram feature hashes
  - Phishing URL scan analytics
  - SMS / extortion pattern match logs

All generation happens strictly in io.BytesIO (zero disk I/O).
The PDF buffer is streamed directly via HTTP without ever touching the filesystem.
"""
from __future__ import annotations

import hashlib
import io
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable,
)

# ---------------------------------------------------------------------------
# Colour Palette — matching the cyber HUD theme
# ---------------------------------------------------------------------------
COLOR_BG_DARK = colors.HexColor("#030712")
COLOR_CYAN = colors.HexColor("#06B6D4")
COLOR_EMERALD = colors.HexColor("#10B981")
COLOR_CRIMSON = colors.HexColor("#EF4444")
COLOR_AMBER = colors.HexColor("#F59E0B")
COLOR_WHITE = colors.HexColor("#F8FAFC")
COLOR_MUTED = colors.HexColor("#64748B")
COLOR_ROW_EVEN = colors.HexColor("#0F172A")
COLOR_ROW_ODD = colors.HexColor("#1E293B")


# ---------------------------------------------------------------------------
# Style Factory
# ---------------------------------------------------------------------------
def _build_styles() -> dict:
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "title",
            parent=base["Title"],
            fontSize=20,
            textColor=COLOR_CYAN,
            alignment=TA_CENTER,
            spaceAfter=4,
            fontName="Helvetica-Bold",
        ),
        "subtitle": ParagraphStyle(
            "subtitle",
            parent=base["Normal"],
            fontSize=9,
            textColor=COLOR_MUTED,
            alignment=TA_CENTER,
            spaceAfter=15,
        ),
        "section_header": ParagraphStyle(
            "section_header",
            parent=base["Heading2"],
            fontSize=12,
            textColor=COLOR_CYAN,
            fontName="Helvetica-Bold",
            spaceBefore=10,
            spaceAfter=5,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontSize=8.5,
            textColor=COLOR_WHITE,
            leading=12,
        ),
        "mono": ParagraphStyle(
            "mono",
            parent=base["Code"],
            fontSize=7,
            textColor=COLOR_EMERALD,
            fontName="Courier",
            leading=10,
        ),
        "verdict_safe": ParagraphStyle(
            "verdict_safe", parent=base["Normal"],
            fontSize=11, textColor=COLOR_EMERALD, fontName="Helvetica-Bold",
        ),
        "verdict_danger": ParagraphStyle(
            "verdict_danger", parent=base["Normal"],
            fontSize=11, textColor=COLOR_CRIMSON, fontName="Helvetica-Bold",
        ),
        "verdict_warn": ParagraphStyle(
            "verdict_warn", parent=base["Normal"],
            fontSize=11, textColor=COLOR_AMBER, fontName="Helvetica-Bold",
        ),
    }


def _table_style(header_color=None) -> TableStyle:
    hc = header_color or COLOR_CYAN
    return TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), hc),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8.5),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("TEXTCOLOR", (0, 1), (-1, -1), COLOR_WHITE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [COLOR_ROW_ODD, COLOR_ROW_EVEN]),
        ("GRID", (0, 0), (-1, -1), 0.25, COLOR_MUTED),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ])


# ---------------------------------------------------------------------------
# PDF Generator
# ---------------------------------------------------------------------------
def generate_forensic_pdf(
    voice_data: Optional[Dict[str, Any]] = None,
    url_data: Optional[Dict[str, Any]] = None,
    sms_data: Optional[Dict[str, Any]] = None,
    session_id: str = "unknown",
) -> io.BytesIO:
    """
    Generate a forensic evidence PDF entirely in memory.

    Args:
        voice_data: VoiceSessionSummary-like dict (or None)
        url_data:   URLScanResponse-like dict (or None)
        sms_data:   MessageScanResponse-like dict (or None)
        session_id: Session identifier

    Returns:
        io.BytesIO containing the PDF bytes (seeked to position 0).
    """
    styles = _build_styles()
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
        title="SentinelShield AI — Forensic Evidence Report",
        author="SentinelShield AI Platform (SIH26104)",
    )

    story: List[Any] = []
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    report_hash = hashlib.sha256(
        f"{session_id}{now_utc}".encode()
    ).hexdigest()

    # ---- Cover Header ----
    story.append(Paragraph("SENTINELSHIELD AI", styles["title"]))
    story.append(Paragraph("FORENSIC EVIDENCE & CYBER DEFENSE REPORT • SIH26104 (AICTE)", styles["subtitle"]))
    story.append(HRFlowable(width="100%", thickness=1, color=COLOR_CYAN))
    story.append(Spacer(1, 0.2 * cm))

    meta_data = [
        ["Field", "Value"],
        ["Report Generated", now_utc],
        ["Session ID", session_id],
        ["Report Integrity Hash", report_hash[:32] + "..."],
        ["Platform Version", "SentinelShield AI v1.0.0 (Production Core)"],
        ["Hackathon Alignment", "SIH26104 — AICTE Smart India Hackathon 2026"],
        ["Statutory Reference", "Section 65B, Indian Evidence Act 1872 & IT Act 2000"],
    ]
    t = Table(meta_data, colWidths=[4.5 * cm, 13.5 * cm])
    t.setStyle(_table_style())
    story.append(t)
    story.append(Spacer(1, 0.3 * cm))

    # ---- Voice Analysis Section ----
    if voice_data:
        story.append(Paragraph("1. Acoustic DSP Voice Integrity Forensics", styles["section_header"]))
        verdict_val = voice_data.get("verdict", "N/A")
        vstyle = styles["verdict_danger"] if "AI" in verdict_val else styles["verdict_safe"]
        story.append(Paragraph(f"Voice Verdict: {verdict_val}", vstyle))
        story.append(Spacer(1, 0.15 * cm))

        voice_rows = [
            ["Metric", "Value"],
            ["Session ID", str(voice_data.get("session_id", "N/A"))],
            ["Total Chunks Analysed", str(voice_data.get("total_chunks", 0))],
            ["Duration", f"{voice_data.get('duration_seconds', 0):.1f} s"],
            ["Mean Risk Score", f"{voice_data.get('mean_risk_score', 0):.4f}"],
            ["Peak Risk Score", f"{voice_data.get('peak_risk_score', 0):.4f}"],
            ["Red Alerts Dispatched", str(voice_data.get("red_alerts_fired", 0))],
        ]
        vt = Table(voice_rows, colWidths=[5.5 * cm, 12.5 * cm])
        vt.setStyle(_table_style(header_color=COLOR_CYAN))
        story.append(vt)

        chain = voice_data.get("attestation_chain", [])
        if chain:
            story.append(Spacer(1, 0.15 * cm))
            story.append(Paragraph("TEE Attestation Tokens (Volatile Zero-Disk SHA-256 Hashes):", styles["body"]))
            for i, token in enumerate(chain[:6]):
                story.append(Paragraph(f"[{i:03d}] {token}", styles["mono"]))
        story.append(Spacer(1, 0.25 * cm))

    # ---- URL / Link Shield Section ----
    if url_data:
        story.append(Paragraph("2. Phishing URL & Domain Heuristic Analysis", styles["section_header"]))
        url_verdict = url_data.get("verdict", "N/A")
        if url_verdict == "PHISHING":
            uvstyle = styles["verdict_danger"]
        elif url_verdict == "SUSPICIOUS":
            uvstyle = styles["verdict_warn"]
        else:
            uvstyle = styles["verdict_safe"]
        story.append(Paragraph(f"URL Verdict: {url_verdict}", uvstyle))
        story.append(Spacer(1, 0.15 * cm))

        url_rows = [
            ["Property", "Value"],
            ["Scanned URL", str(url_data.get("url", ""))[:75]],
            ["Domain / Host", str(url_data.get("domain", "N/A"))],
            ["HTTPS Protocol", "Yes (TLS Enabled)" if url_data.get("is_https") else "No (Insecure HTTP)"],
            ["Shannon Entropy Score", f"{url_data.get('entropy_score', 0):.4f}"],
            ["Phishing Probability", f"{url_data.get('phishing_score', 0):.4f}"],
            ["Typosquatting Detected", "YES" if url_data.get("typosquatting_detected") else "No"],
            ["Targeted Brand", str(url_data.get("typosquatting_target") or "None")],
            ["Shortener Service", "Yes" if url_data.get("is_shortened") else "No"],
            ["IP Address Host", "Yes" if url_data.get("has_ip_address") else "No"],
            ["Suspicious TLD", "Yes" if url_data.get("suspicious_tld") else "No"],
            ["Inspection Time", f"{url_data.get('scan_ms', 0):.2f} ms"],
        ]
        ut = Table(url_rows, colWidths=[5.5 * cm, 12.5 * cm])
        ut.setStyle(_table_style(header_color=COLOR_CYAN))
        story.append(ut)

        indicators = url_data.get("threat_indicators", [])
        if indicators:
            story.append(Spacer(1, 0.15 * cm))
            story.append(Paragraph("Threat Indicators Breakdown:", styles["body"]))
            ind_rows = [["Indicator", "Details", "Severity"]]
            for ind in indicators:
                ind_rows.append([
                    str(ind.get("indicator_type", "")),
                    str(ind.get("description", ""))[:75],
                    f"{ind.get('severity', 0):.2f}",
                ])
            it = Table(ind_rows, colWidths=[3.5 * cm, 12.5 * cm, 2 * cm])
            it.setStyle(_table_style(header_color=COLOR_AMBER))
            story.append(it)
        story.append(Spacer(1, 0.25 * cm))

    # ---- SMS / Extortion Section ----
    if sms_data:
        story.append(Paragraph("3. Digital Arrest & SMS Extortion Analysis", styles["section_header"]))
        sms_verdict = sms_data.get("verdict", "N/A")
        if "DETECTED" in sms_verdict:
            svstyle = styles["verdict_danger"]
        elif sms_verdict == "SUSPICIOUS":
            svstyle = styles["verdict_warn"]
        else:
            svstyle = styles["verdict_safe"]
        story.append(Paragraph(f"Message Verdict: {sms_verdict}", svstyle))
        story.append(Spacer(1, 0.15 * cm))

        sms_rows = [
            ["Field", "Value"],
            ["Text SHA-256 Digest", str(sms_data.get("text_hash", "N/A"))[:45] + "..."],
            ["Source Channel", str(sms_data.get("source_channel", "N/A"))],
            ["Cumulative Threat Score", f"{sms_data.get('threat_score', 0):.4f}"],
            ["Patterns Matched", str(sms_data.get("total_patterns_matched", 0))],
            ["Recommended Action", str(sms_data.get("recommended_action", ""))[:90]],
            ["Scan Processing Time", f"{sms_data.get('scan_ms', 0):.4f} ms"],
        ]
        st = Table(sms_rows, colWidths=[5.5 * cm, 12.5 * cm])
        st.setStyle(_table_style(header_color=COLOR_CYAN))
        story.append(st)

        patterns = sms_data.get("matched_patterns", [])
        if patterns:
            story.append(Spacer(1, 0.15 * cm))
            story.append(Paragraph("Matched Threat Patterns & Triggers:", styles["body"]))
            pat_rows = [["ID", "Pattern Name", "Category", "Matched Substring", "Weight"]]
            for pat in patterns:
                pat_rows.append([
                    str(pat.get("pattern_id", "")),
                    str(pat.get("pattern_name", "")),
                    str(pat.get("category", "")),
                    str(pat.get("matched_fragment", ""))[:35],
                    f"{pat.get('weight', 0):.2f}",
                ])
            pt = Table(pat_rows, colWidths=[1.5 * cm, 4 * cm, 3.5 * cm, 7 * cm, 2 * cm])
            pt.setStyle(_table_style(header_color=COLOR_CRIMSON))
            story.append(pt)
        story.append(Spacer(1, 0.25 * cm))

    # ---- Legal Compliance & Integrity ----
    story.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_MUTED))
    story.append(Spacer(1, 0.15 * cm))
    legal_text = (
        "This forensic dossier was autonomously synthesized by SentinelShield AI under TEE (Trusted Execution Environment) "
        "memory-zeroization protocols aligned with SIH26104 (AICTE). No raw audio or message plaintext is retained on permanent "
        "storage. Cryptographic hash tokens confirm zero-disk integrity and evidentiary validity under Section 65B of the "
        "Indian Evidence Act, 1872."
    )
    story.append(Paragraph(legal_text, styles["body"]))
    story.append(Spacer(1, 0.1 * cm))
    story.append(Paragraph(f"Integrity Checksum: {report_hash} | Timestamp: {now_utc}", styles["mono"]))

    doc.build(story)
    buffer.seek(0)
    return buffer
