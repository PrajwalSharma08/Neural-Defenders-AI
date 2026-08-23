"""
SentinelShield AI — Link Shield Package.
Ingested and ported from LinkGuard-main (JavaScript → Python).
"""
from backend.services.link_shield.entropy_scanner import EntropyScanner
from backend.services.link_shield.typosquatting import TyposquattingDetector

__all__ = ["EntropyScanner", "TyposquattingDetector"]
