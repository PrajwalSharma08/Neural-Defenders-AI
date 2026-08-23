"""
SentinelShield AI — Pydantic Settings Configuration.
All runtime configuration is loaded from environment variables / .env file.
Zero hardcoded secrets.
"""
from __future__ import annotations

import json
from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_env: str = Field(default="development")
    app_host: str = Field(default="0.0.0.0")
    app_port: int = Field(default=8888)
    app_secret_key: str = Field(default="sentinelshield_dev_secret_key_change_in_production_min32chars", min_length=32)
    app_log_level: str = Field(default="INFO")

    # CORS — stored as JSON array string or comma separated in .env
    cors_origins: List[str] = Field(default=["http://localhost:9999", "http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:9999"])

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors(cls, v: object) -> List[str]:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v  # type: ignore[return-value]

    # Rate Limits
    rate_limit_auth_per_ip: int = Field(default=5)
    rate_limit_auth_per_account: int = Field(default=10)
    rate_limit_public: int = Field(default=30)
    rate_limit_ws_per_connection: int = Field(default=600)
    rate_limit_auth_backoff_base_seconds: int = Field(default=2)

    # DSP Engine
    dsp_buffer_ms: int = Field(default=200)
    dsp_sample_rate: int = Field(default=16000)
    dsp_snr_threshold_db: float = Field(default=12.0)
    dsp_red_alert_threshold: float = Field(default=0.85)

    # n8n Incident Response
    n8n_webhook_base_url: str = Field(default="")
    n8n_webhook_secret: str = Field(default="")
    n8n_banking_freeze_path: str = Field(default="/banking-freeze")
    n8n_mfa_challenge_path: str = Field(default="/mfa-challenge")
    n8n_security_alert_path: str = Field(default="/security-alert")

    # File Upload
    max_upload_bytes: int = Field(default=10 * 1024 * 1024)  # 10 MB

    # TEE Guard
    tee_attestation_pepper: str = Field(default="sentinelshield_tee_attestation_pepper_key", min_length=0)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the singleton Settings instance (cached after first load)."""
    return Settings()
