"""
SentinelShield AI — Typosquatting & Brand Impersonation Detector.

Ported from LinkGuard-main/js/modules/patternChecker.js.
Uses Levenshtein distance + keyboard-adjacency heuristics to detect
brand impersonation in domains.
"""
from __future__ import annotations

import re
from typing import Optional, Tuple

# ---------------------------------------------------------------------------
# Protected Brand Registry
# ---------------------------------------------------------------------------
BRAND_REGISTRY: dict[str, list[str]] = {
    # Format: canonical_brand: [canonical_domain, common_variants...]
    "google": ["google.com", "gmail.com", "googleapis.com"],
    "microsoft": ["microsoft.com", "live.com", "outlook.com", "office.com"],
    "apple": ["apple.com", "icloud.com"],
    "amazon": ["amazon.com", "amazon.in", "aws.amazon.com"],
    "paypal": ["paypal.com", "paypal.me"],
    "netflix": ["netflix.com"],
    "facebook": ["facebook.com", "fb.com", "instagram.com"],
    "twitter": ["twitter.com", "x.com"],
    "sbi": ["sbi.co.in", "onlinesbi.sbi"],
    "hdfc": ["hdfcbank.com", "hdfc.com"],
    "icici": ["icicibank.com"],
    "rbi": ["rbi.org.in"],
    "uidai": ["uidai.gov.in"],
    "incometax": ["incometax.gov.in", "efiling.income.tax.in"],
    "irctc": ["irctc.co.in"],
    "flipkart": ["flipkart.com"],
    "paytm": ["paytm.com"],
    "phonepe": ["phonepe.com"],
    "gpay": ["pay.google.com"],
}

# Pre-compile regex patterns for each brand keyword
_BRAND_PATTERNS: list[Tuple[str, re.Pattern[str]]] = [
    (brand, re.compile(
        # Match brand keyword anywhere in the domain, surrounded by non-word chars or digits
        rf"(?:^|[^a-z])({''.join([f'(?:{re.escape(ch)})' for ch in brand])})(?:[^a-z]|$)",
        re.IGNORECASE,
    ))
    for brand in BRAND_REGISTRY
]


# ---------------------------------------------------------------------------
# Levenshtein Distance
# ---------------------------------------------------------------------------
def _levenshtein(s1: str, s2: str) -> int:
    """Compute Levenshtein edit distance between two strings."""
    if len(s1) < len(s2):
        return _levenshtein(s2, s1)
    if not s2:
        return len(s1)
    prev = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1):
        curr = [i + 1]
        for j, c2 in enumerate(s2):
            ins = prev[j + 1] + 1
            dlt = curr[j] + 1
            sub = prev[j] + (c1 != c2)
            curr.append(min(ins, dlt, sub))
        prev = curr
    return prev[-1]


# ---------------------------------------------------------------------------
# Homoglyph & Keyboard Substitution Map
# ---------------------------------------------------------------------------
HOMOGLYPH_MAP: dict[str, str] = {
    "0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "@": "a",
    "rn": "m",  # rn → m visual trick
    "vv": "w",  # vv → w visual trick
    "ì": "i", "í": "i", "ï": "i",
    "à": "a", "á": "a", "ä": "a",
    "ò": "o", "ó": "o", "ö": "o",
    "ù": "u", "ú": "u", "ü": "u",
    "ñ": "n",
}


def _normalize_domain(domain: str) -> str:
    """Normalise a domain by replacing homoglyphs with their ASCII equivalents."""
    normalized = domain.lower()
    for glyph, replacement in HOMOGLYPH_MAP.items():
        normalized = normalized.replace(glyph, replacement)
    return normalized


# ---------------------------------------------------------------------------
# Typosquatting Detector
# ---------------------------------------------------------------------------
class TyposquattingDetector:
    """Detect brand impersonation via Levenshtein distance + homoglyph normalisation."""

    # Max edit distance relative to brand name length
    MAX_EDIT_RATIO = 0.40
    MIN_BRAND_LEN = 3

    def detect(self, domain: str) -> Tuple[bool, Optional[str]]:
        """
        Check whether a domain is impersonating a known brand.

        Returns:
            (is_typosquatting, targeted_brand_name)
        """
        # Strip TLD for matching
        host = domain.lower().split(":")[0]  # Remove port
        host_no_tld = re.sub(r"\.[a-z]{2,}$", "", host)  # Strip last TLD
        normalized_host = _normalize_domain(host_no_tld)

        for brand, canonical_domains in BRAND_REGISTRY.items():
            if len(brand) < self.MIN_BRAND_LEN:
                continue

            # Exact match against canonical domains → not typosquatting
            if any(host == canonical or host.endswith(f".{canonical}") for canonical in canonical_domains):
                return False, None

            # Levenshtein on the normalised host vs. brand keyword
            dist = _levenshtein(normalized_host, brand)
            max_allowed = max(1, int(len(brand) * self.MAX_EDIT_RATIO))

            if dist <= max_allowed and dist > 0:
                return True, brand

            # Also check if the brand keyword is embedded with suspicious surrounding
            # e.g., "sbi-online.tk", "g00gle-signin.com"
            norm_brand = _normalize_domain(brand)
            if norm_brand in normalized_host and host not in [
                c.split("/")[0] for c in canonical_domains
            ]:
                return True, brand

        return False, None

    def enrich_scan_response(
        self,
        response: "URLScanResponse",  # type: ignore[name-defined]  # noqa: F821
        domain: str,
    ) -> "URLScanResponse":  # type: ignore[name-defined]  # noqa: F821
        """Run typosquatting detection and mutate the scan response in-place."""
        from backend.schemas.url import ThreatIndicator
        is_typosquat, target = self.detect(domain)
        response.typosquatting_detected = is_typosquat
        response.typosquatting_target = target
        if is_typosquat and target:
            response.threat_indicators.append(ThreatIndicator(
                indicator_type="typosquatting",
                description=f"Domain appears to impersonate '{target}' brand using character substitution or spelling variation.",
                severity=0.88,
            ))
            # Re-compute phishing score with new indicator
            from functools import reduce
            import operator
            complement = reduce(
                operator.mul,
                [1.0 - ind.severity for ind in response.threat_indicators],
                1.0,
            )
            response.phishing_score = round(min(1.0 - complement, 1.0), 4)
            if response.phishing_score >= 0.75:
                response.verdict = "PHISHING"
            elif response.phishing_score >= 0.40:
                response.verdict = "SUSPICIOUS"
        return response
