"""
SentinelShield AI — Digital Arrest & SMS Extortion Shield.

Uses Aho-Corasick multi-pattern matching for sub-millisecond detection of
digital arrest, customs seizure, financial extortion, and urgency pressure
indicators in any language (Latin-script transliterations included).
"""
from __future__ import annotations

import hashlib
import logging
import time
from collections import deque
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

try:
    import ahocorasick
except ImportError:
    ahocorasick = None

from backend.schemas.message import MessageScanRequest, MessageScanResponse, ThreatPattern

logger = logging.getLogger("sentinelshield.sms_shield")


# ---------------------------------------------------------------------------
# Threat Pattern Definitions
# ---------------------------------------------------------------------------
@dataclass
class PatternDef:
    pattern_id: str
    pattern_name: str
    keywords: List[str]
    category: str
    weight: float


PATTERN_DEFINITIONS: List[PatternDef] = [
    # --- Digital Arrest Indicators ---
    PatternDef(
        pattern_id="DA001", pattern_name="CBI & Law Enforcement Arrest Warrant",
        keywords=[
            "cbi arrest", "cbi warrant", "cbi officer", "cbi", "central bureau of investigation",
            "you have been arrested", "digital arrest", "cyber arrest", "under arrest",
            "arrest warrant", "arrested", "non-bailable arrest warrant",
        ],
        category="digital_arrest", weight=0.95,
    ),
    PatternDef(
        pattern_id="DA002", pattern_name="Customs & Narcotics Seizure",
        keywords=[
            "customs seizure", "narcotics control", "package seized",
            "illegal parcel", "drug shipment", "customs department",
            "ncb arrest", "narcotics bureau",
        ],
        category="digital_arrest", weight=0.90,
    ),
    PatternDef(
        pattern_id="DA003", pattern_name="Police Enforcement Threat",
        keywords=[
            "police will arrive", "cops are coming", "fir registered",
            "non-bailable warrant", "nbw issued", "arrest warrant issued",
            "chargesheet filed", "cybercrime fir",
        ],
        category="digital_arrest", weight=0.88,
    ),
    # --- Financial Extortion ---
    PatternDef(
        pattern_id="FE001", pattern_name="Immediate Money Transfer Demand",
        keywords=[
            "transfer money immediately", "send money now", "transfer to safe account",
            "safe account", "rbi safe account", "supreme court deposit", "pay fine immediately",
            "penalty payment", "settlement amount", "transfer rs", "pay immediately",
        ],
        category="financial_extortion", weight=0.92,
    ),
    PatternDef(
        pattern_id="FE002", pattern_name="Gift Card / Crypto Extortion",
        keywords=[
            "buy gift card", "send bitcoin", "send usdt", "crypto payment",
            "google play card", "itunes card", "amazon gift card payment",
        ],
        category="financial_extortion", weight=0.85,
    ),
    # --- Urgency Pressure ---
    PatternDef(
        pattern_id="UP001", pattern_name="2-Hour / Immediate Deadline",
        keywords=[
            "2 hour deadline", "two hour deadline", "within 2 hours",
            "30 minutes remaining", "last chance", "immediate action required",
            "do not delay", "act now or", "time is running out",
        ],
        category="urgency_pressure", weight=0.75,
    ),
    PatternDef(
        pattern_id="UP002", pattern_name="Secrecy Instruction",
        keywords=[
            "do not tell anyone", "keep this confidential", "don't inform family",
            "don't call police", "stay on the call", "disconnect at your own risk",
        ],
        category="urgency_pressure", weight=0.80,
    ),
    # --- Authority Impersonation ---
    PatternDef(
        pattern_id="AI001", pattern_name="Government Agency Impersonation",
        keywords=[
            "rrb officer", "income tax raid", "ed officer", "enforcement directorate",
            "ici officer", "trai", "telecom authority", "supreme court bench",
            "high court notice", "ministry of finance",
        ],
        category="authority_impersonation", weight=0.87,
    ),
    PatternDef(
        pattern_id="AI002", pattern_name="SIM / Account Block Threat",
        keywords=[
            "sim will be blocked", "sim card blocked", "account will be frozen",
            "bank account suspended", "kyc suspended", "aadhaar flagged",
        ],
        category="authority_impersonation", weight=0.82,
    ),
    # --- Personal Threat ---
    PatternDef(
        pattern_id="PT001", pattern_name="Physical Harm Threat",
        keywords=[
            "your family will suffer", "we know where you live",
            "harm will come", "gangster threat", "goonda sent",
        ],
        category="personal_threat", weight=0.97,
    ),
]


# ---------------------------------------------------------------------------
# Pure Python Aho-Corasick Trie (Zero dependency fallback)
# ---------------------------------------------------------------------------
class _AhoNode:
    def __init__(self):
        self.children: Dict[str, _AhoNode] = {}
        self.fail: Optional[_AhoNode] = None
        self.outputs: List[Tuple[str, PatternDef]] = []


class _PurePyAhoCorasick:
    def __init__(self):
        self.root = _AhoNode()

    def add_word(self, word: str, pat_def: PatternDef):
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = _AhoNode()
            node = node.children[ch]
        node.outputs.append((word, pat_def))

    def make_automaton(self):
        queue = deque()
        for ch, child in self.root.children.items():
            child.fail = self.root
            queue.append(child)

        while queue:
            current = queue.popleft()
            for ch, child in current.children.items():
                fail_node = current.fail
                while fail_node and ch not in fail_node.children:
                    fail_node = fail_node.fail
                child.fail = fail_node.children[ch] if fail_node else self.root
                child.outputs.extend(child.fail.outputs)
                queue.append(child)

    def iter(self, text: str):
        node = self.root
        for idx, ch in enumerate(text):
            while node and ch not in node.children:
                node = node.fail
            if not node:
                node = self.root
                continue
            node = node.children[ch]
            for kw, pat_def in node.outputs:
                yield idx, (0, kw, pat_def)


# ---------------------------------------------------------------------------
# Automaton Builder & SMSShield Engine
# ---------------------------------------------------------------------------
class SMSShield:
    """Aho-Corasick automaton for O(n+m) multi-pattern matching."""

    def __init__(self) -> None:
        if ahocorasick is not None:
            self._automaton: Any = ahocorasick.Automaton()
            self._use_c_ext = True
        else:
            self._automaton = _PurePyAhoCorasick()
            self._use_c_ext = False
        self._pattern_map: Dict[str, PatternDef] = {}
        self._build_automaton()

    def _build_automaton(self) -> None:
        idx = 0
        for pat_def in PATTERN_DEFINITIONS:
            for kw in pat_def.keywords:
                kw_lower = kw.lower()
                if self._use_c_ext:
                    if kw_lower in self._automaton:
                        existing = self._pattern_map.get(kw_lower)
                        if existing and pat_def.weight > existing.weight:
                            self._pattern_map[kw_lower] = pat_def
                    else:
                        self._automaton.add_word(kw_lower, (idx, kw_lower, pat_def))
                        self._pattern_map[kw_lower] = pat_def
                        idx += 1
                else:
                    self._automaton.add_word(kw_lower, pat_def)
                    self._pattern_map[kw_lower] = pat_def
                    idx += 1

        self._automaton.make_automaton()
        logger.info(
            "SMS Shield automaton initialized: %d keywords mapped across %d pattern groups (C-ext: %s)",
            idx, len(PATTERN_DEFINITIONS), self._use_c_ext,
        )

    def scan(self, request: MessageScanRequest) -> MessageScanResponse:
        t_start = time.perf_counter()
        text_lower = request.text.lower()
        text_hash = hashlib.sha256(request.text.encode()).hexdigest()

        matched: Dict[str, ThreatPattern] = {}
        for end_idx, (_, kw, pat_def) in self._automaton.iter(text_lower):
            start_idx = end_idx - len(kw) + 1
            fragment = request.text[start_idx: end_idx + 1]

            key = pat_def.pattern_id
            if key not in matched or pat_def.weight > matched[key].weight:
                matched[key] = ThreatPattern(
                    pattern_id=pat_def.pattern_id,
                    pattern_name=pat_def.pattern_name,
                    matched_fragment=fragment[:256],
                    category=pat_def.category,  # type: ignore[arg-type]
                    weight=pat_def.weight,
                )

        pattern_list = sorted(matched.values(), key=lambda p: p.weight, reverse=True)

        # Fused threat score: 1 - product of (1 - weight) for each unique pattern
        threat_score: float = 0.0
        if pattern_list:
            from functools import reduce
            import operator
            complement_product = reduce(
                operator.mul,
                [1.0 - p.weight for p in pattern_list],
                1.0,
            )
            threat_score = round(1.0 - complement_product, 4)

        # Verdict
        has_digital_arrest = any(p.category == "digital_arrest" for p in pattern_list)
        if has_digital_arrest and threat_score > 0.65:
            verdict = "DIGITAL_ARREST_DETECTED"
            action = "Immediately hang up. Contact cybercrime helpline 1930. Do NOT transfer money."
        elif threat_score > 0.65:
            verdict = "SCAM_DETECTED"
            action = "High scam probability. Do not comply with demands. Report to 1930."
        elif threat_score > 0.30:
            verdict = "SUSPICIOUS"
            action = "Exercise caution. Verify sender identity through official channels."
        else:
            verdict = "SAFE"
            action = "No significant threat indicators detected."

        elapsed_ms = (time.perf_counter() - t_start) * 1000

        return MessageScanResponse(
            text_hash=text_hash,
            source_channel=request.source_channel,
            matched_patterns=pattern_list,
            total_patterns_matched=len(pattern_list),
            threat_score=threat_score,
            verdict=verdict,  # type: ignore[arg-type]
            recommended_action=action,
            scan_ms=round(elapsed_ms, 4),
        )


# Singleton instance
_shield_instance: SMSShield | None = None


def get_sms_shield() -> SMSShield:
    """Return or build the singleton SMSShield instance."""
    global _shield_instance  # noqa: PLW0603
    if _shield_instance is None:
        _shield_instance = SMSShield()
    return _shield_instance
