"""
SentinelShield AI — URL Entropy & Heuristic Scanner.

Ported from LinkGuard-main/js/utils/urlUtils.js and adapted to Python.
Adds Shannon entropy, IP-in-URL detection, suspicious TLD fingerprinting,
and URL shortener detection.
"""
from __future__ import annotations

import ipaddress
import math
import re
import time
from typing import List, Tuple
from urllib.parse import urlparse, unquote

from backend.schemas.url import ThreatIndicator, URLScanRequest, URLScanResponse

# ---------------------------------------------------------------------------
# Constants — ported from LinkGuard-main urlUtils.js
# ---------------------------------------------------------------------------
URL_SHORTENERS: frozenset[str] = frozenset({
    "bit.ly", "t.co", "tinyurl.com", "goo.gl", "ow.ly", "is.gd", "buff.ly",
    "j.mp", "rb.gy", "shorturl.at", "cutt.ly", "bl.ink", "short.io",
    "rebrand.ly", "lnkd.in", "amzn.to", "youtu.be", "v.gd", "po.st",
    "dlvr.it", "soo.gd", "s.id", "qr.ae", "zpr.io", "clck.ru", "x.co",
    "su.pr", "mcaf.ee", "aka.ms", "1drv.ms",
})

SUSPICIOUS_TLDS: frozenset[str] = frozenset({
    ".tk", ".ml", ".ga", ".cf", ".gq",  # Free/abused TLDs
    ".xyz", ".top", ".club", ".online", ".site", ".icu",
    ".buzz", ".vip", ".live", ".fun", ".work",
    ".pw", ".cc", ".ru", ".cn",  # High-abuse country TLDs
})

SUSPICIOUS_KEYWORDS: List[str] = [
    "login", "signin", "verify-account", "update-kyc", "verify-kyc",
    "banking-login", "paypal-security", "netbanking", "confirm-identity",
    "wallet-seed", "crypto-claim", "aadhaar-link", "pan-update", "rbi-safe",
    "refund-claim", "lottery-winner", "account-suspended",
]

IP_IN_URL_RE = re.compile(
    r"(?:https?://)"
    r"((?:\d{1,3}\.){3}\d{1,3})"
)

EXCESSIVE_SUBDOMAIN_THRESHOLD = 4  # More than 4 dots in host -> suspicious


# ---------------------------------------------------------------------------
# Shannon Entropy Calculator
# ---------------------------------------------------------------------------
def _shannon_entropy(s: str) -> float:
    """Compute Shannon entropy of a string."""
    if not s:
        return 0.0
    freq: dict[str, int] = {}
    for ch in s:
        freq[ch] = freq.get(ch, 0) + 1
    n = len(s)
    entropy = -sum((c / n) * math.log2(c / n) for c in freq.values())
    return entropy


def _normalize_entropy(raw_entropy: float, str_length: int) -> float:
    """Normalise Shannon entropy to [0, 1]."""
    max_theoretical = math.log2(max(str_length, 2))
    if max_theoretical < 1e-6:
        return 0.0
    return min(raw_entropy / max_theoretical, 1.0)


# ---------------------------------------------------------------------------
# Main Scanner Class
# ---------------------------------------------------------------------------
class EntropyScanner:
    """Heuristic URL phishing scanner using entropy, TLD, and keyword signals."""

    def scan(self, request: URLScanRequest) -> URLScanResponse:
        t_start = time.perf_counter()
        url = request.url.strip()
        indicators: List[ThreatIndicator] = []

        parsed = urlparse(url)
        domain = parsed.netloc.lower().replace("www.", "")
        full_url_lower = url.lower()

        # 1. HTTPS check
        is_https = parsed.scheme == "https"
        if not is_https:
            indicators.append(ThreatIndicator(
                indicator_type="insecure_protocol",
                description="URL uses plain HTTP — no TLS encryption.",
                severity=0.35,
            ))

        # 2. URL Shortener detection
        host_clean = domain.split(":")[0]  # Strip port
        is_shortened = host_clean in URL_SHORTENERS
        if is_shortened:
            indicators.append(ThreatIndicator(
                indicator_type="url_shortener",
                description=f"URL uses a known shortener service ({host_clean}), masking the target host.",
                severity=0.50,
            ))

        # 3. IP address in URL
        has_ip = bool(IP_IN_URL_RE.match(url))
        if not has_ip:
            try:
                ipaddress.ip_address(host_clean)
                has_ip = True
            except ValueError:
                pass
        if has_ip:
            indicators.append(ThreatIndicator(
                indicator_type="ip_in_url",
                description="URL uses a raw IP address instead of a registered domain name.",
                severity=0.80,
            ))

        # 4. Suspicious TLD
        suspicious_tld = any(domain.endswith(tld) for tld in SUSPICIOUS_TLDS)
        if suspicious_tld:
            matched_tld = next((tld for tld in SUSPICIOUS_TLDS if domain.endswith(tld)), "")
            indicators.append(ThreatIndicator(
                indicator_type="suspicious_tld",
                description=f"Domain uses a high-abuse TLD: {matched_tld}",
                severity=0.55,
            ))

        # 5. Excessive subdomains
        subdomain_count = host_clean.count(".")
        if subdomain_count > EXCESSIVE_SUBDOMAIN_THRESHOLD:
            indicators.append(ThreatIndicator(
                indicator_type="excessive_subdomains",
                description=f"Unusually deep subdomain hierarchy ({subdomain_count} levels) masking domain identity.",
                severity=0.45,
            ))

        # 6. Domain Shannon entropy (DGA detection)
        domain_raw_entropy = _shannon_entropy(host_clean)
        domain_entropy_norm = _normalize_entropy(domain_raw_entropy, len(host_clean))
        if domain_entropy_norm > 0.88 and len(host_clean) > 12:
            indicators.append(ThreatIndicator(
                indicator_type="high_domain_entropy",
                description=f"Host name entropy ({domain_raw_entropy:.2f} bits) indicates possible DGA domain generation.",
                severity=0.40,
            ))

        # 7. Suspicious Phishing Keywords in Path / Query
        path_query = (parsed.path + "?" + (parsed.query or "")).lower()
        kw_hits = [kw for kw in SUSPICIOUS_KEYWORDS if kw in path_query or kw in domain]
        if kw_hits:
            indicators.append(ThreatIndicator(
                indicator_type="suspicious_keywords",
                description=f"Sensitive phishing keywords found: {', '.join(kw_hits[:4])}",
                severity=0.60,
            ))

        # 8. Data URI / encoded XSS patterns
        for encoded_bad in ("%3cscript", "%22javascript", "%27eval", "data:text/html"):
            if encoded_bad in full_url_lower:
                indicators.append(ThreatIndicator(
                    indicator_type="encoded_xss",
                    description="URL contains obfuscated script injection patterns.",
                    severity=0.90,
                ))
                break

        # Calculate overall normalized entropy for telemetry
        full_decoded = unquote(url)
        full_entropy_norm = _normalize_entropy(_shannon_entropy(full_decoded), len(full_decoded))

        # --- Phishing Score Fusion ---
        if indicators:
            from functools import reduce
            import operator
            complement = reduce(operator.mul, [1.0 - ind.severity for ind in indicators], 1.0)
            phishing_score = round(1.0 - complement, 4)
        else:
            phishing_score = 0.0

        # Verdict
        if phishing_score >= 0.70:
            verdict = "PHISHING"
        elif phishing_score >= 0.35:
            verdict = "SUSPICIOUS"
        else:
            verdict = "SAFE"

        scan_ms = (time.perf_counter() - t_start) * 1000
        return URLScanResponse(
            url=url,
            domain=domain,
            is_https=is_https,
            entropy_score=round(full_entropy_norm, 4),
            typosquatting_detected=False,
            typosquatting_target=None,
            is_shortened=is_shortened,
            has_ip_address=has_ip,
            suspicious_tld=suspicious_tld,
            redirect_depth=0,
            threat_indicators=indicators,
            phishing_score=phishing_score,
            verdict=verdict,
            scan_ms=round(scan_ms, 4),
        )
