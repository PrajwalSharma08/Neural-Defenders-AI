-- ============================================================================
-- SentinelShield AI — Enterprise Forensic Incident & Threat Logging Schema
-- Designed by: Raj (Web Security & Database Specialist)
-- Database Engine: MySQL 8.0+ / MariaDB 10.5+ (InnoDB Engine)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS sentinelshield_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sentinelshield_db;

-- 1. Threat Incident Registry (Voice, Phishing, Extortion)
CREATE TABLE IF NOT EXISTS threat_incidents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL,
  threat_type ENUM('VOICE_AI_DEEPFAKE', 'PHISHING_LINK', 'DIGITAL_ARREST_SMS', 'AMBIENT_SAFE') NOT NULL,
  risk_score DECIMAL(5, 4) NOT NULL COMMENT 'Calculated Risk R ∈ [0.0000, 1.0000]',
  db_spl_level DECIMAL(5, 2) DEFAULT NULL COMMENT 'Acoustic SPL in decibels',
  sha256_evidence_hash CHAR(64) NOT NULL COMMENT 'Cryptographic hash of analyzed frame/URL',
  verdict VARCHAR(32) NOT NULL,
  client_ip VARCHAR(45) NOT NULL,
  user_agent VARCHAR(255) DEFAULT NULL,
  reported_to_helpline TINYINT(1) DEFAULT 0 COMMENT '1 if submitted to 1930 Cyber Helpline',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session (session_id),
  INDEX idx_threat_type (threat_type),
  INDEX idx_hash (sha256_evidence_hash),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Section 65B Tamper-Evident Forensic Dossier Certificates
CREATE TABLE IF NOT EXISTS forensic_certificates (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  incident_id BIGINT UNSIGNED NOT NULL,
  certificate_serial VARCHAR(64) NOT NULL UNIQUE,
  dossier_pdf_hash CHAR(64) NOT NULL COMMENT 'SHA-256 hash of generated court evidence PDF',
  examiner_name VARCHAR(128) DEFAULT 'SentinelShield Automated TEE Engine',
  evidence_act_section VARCHAR(64) DEFAULT 'Section 65B IEA / Section 63 BSA 2023',
  tamper_seal_hash CHAR(64) NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES threat_incidents(id) ON DELETE CASCADE,
  INDEX idx_cert_serial (certificate_serial)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Whitelisted & Known Legitimate Domains (Zero False Positive Cache)
CREATE TABLE IF NOT EXISTS domain_reputation (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  domain_name VARCHAR(255) NOT NULL UNIQUE,
  category ENUM('BANKING', 'GOVERNMENT', 'EDUCATION', 'TRUSTED_PUBLIC', 'MALICIOUS_DGA') NOT NULL,
  shannon_entropy DECIMAL(4, 3) DEFAULT 0.000,
  is_active TINYINT(1) DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_domain (domain_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
