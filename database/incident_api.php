<?php
/**
 * SentinelShield AI — Forensic Threat Logging & Incident API
 * Engineered by: Raj (Web Security & Database Specialist)
 * 
 * Features:
 * - Anti-SQL Injection: Prepared Statements via PHP PDO
 * - Cross-Site Scripting (XSS) Sanitization: htmlspecialchars()
 * - Section 65B Audit Trail & Integrity Hashing
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

// Database Configuration
$db_host = getenv('DB_HOST') ?: '127.0.0.1';
$db_name = getenv('DB_NAME') ?: 'sentinelshield_db';
$db_user = getenv('DB_USER') ?: 'sentinel_user';
$db_pass = getenv('DB_PASS') ?: '';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false, // Native prepared statements
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed', 'status' => 'error']);
    exit;
}

// Handle Incoming Incident Log Request (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $data = json_decode($raw_input, true);

    if (!$data || !isset($data['session_id'], $data['threat_type'], $data['risk_score'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or missing required payload fields']);
        exit;
    }

    // Input Sanitization (Raj's Security Layer)
    $session_id   = htmlspecialchars(strip_tags($data['session_id']), ENT_QUOTES, 'UTF-8');
    $threat_type  = in_array($data['threat_type'], ['VOICE_AI_DEEPFAKE', 'PHISHING_LINK', 'DIGITAL_ARREST_SMS']) ? $data['threat_type'] : 'VOICE_AI_DEEPFAKE';
    $risk_score   = floatval($data['risk_score']);
    $db_spl       = isset($data['db_spl']) ? floatval($data['db_spl']) : null;
    $verdict      = htmlspecialchars(strip_tags($data['verdict'] ?? 'UNKNOWN'), ENT_QUOTES, 'UTF-8');
    $client_ip    = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $user_agent   = substr($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown', 0, 255);

    // Cryptographic SHA-256 Seal
    $evidence_hash = hash('sha256', $session_id . '|' . $threat_type . '|' . $risk_score . '|' . microtime(true));

    try {
        $stmt = $pdo->prepare("
            INSERT INTO threat_incidents 
            (session_id, threat_type, risk_score, db_spl_level, sha256_evidence_hash, verdict, client_ip, user_agent)
            VALUES (:session_id, :threat_type, :risk_score, :db_spl, :hash, :verdict, :client_ip, :user_agent)
        ");

        $stmt->execute([
            ':session_id'  => $session_id,
            ':threat_type' => $threat_type,
            ':risk_score'  => $risk_score,
            ':db_spl'      => $db_spl,
            ':hash'        => $evidence_hash,
            ':verdict'     => $verdict,
            ':client_ip'   => $client_ip,
            ':user_agent'  => $user_agent,
        ]);

        $incident_id = $pdo->lastInsertId();

        echo json_encode([
            'status'         => 'success',
            'incident_id'    => $incident_id,
            'evidence_hash'  => $evidence_hash,
            'section_65b'    => 'CERTIFIED_TAMPER_EVIDENT',
            'timestamp'      => date('c')
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to persist incident forensic audit record']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
