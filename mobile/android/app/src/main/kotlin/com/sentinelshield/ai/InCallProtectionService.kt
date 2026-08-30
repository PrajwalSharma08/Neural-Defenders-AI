package com.sentinelshield.ai

import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.IBinder
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*

/**
 * SentinelShield AI — In-Call Foreground Protection Service
 *
 * Behaviour:
 *  • Starts automatically when user picks up a phone call (via PhoneStateReceiver)
 *  • Creates ONE sticky notification (NOTIFICATION_ID = 101) in the status bar
 *  • Updates that same notification in-place silently (no repeated buzzing/sound)
 *  • Captures 200ms rolling audio frames via AudioCaptureHelper
 *  • Sends audio bytes to the deepfake detection engine and receives a risk score (0–1)
 *  • Updates notification colour + text based on risk level
 *  • On call end: stops itself, wipes audio RAM, removes notification automatically
 */
class InCallProtectionService : Service() {

    companion object {
        const val NOTIFICATION_ID    = 101
        const val CHANNEL_ID         = "sentinelshield_incall"
        const val CHANNEL_NAME       = "SentinelShield In-Call Protection"

        @Volatile var shieldEnabled  = true
        @Volatile var currentRisk    = 0f
    }

    private val serviceScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private lateinit var notificationManager: NotificationManager
    private lateinit var audioCapture: AudioCaptureHelper
    private lateinit var deepfakeEngine: DeepfakeAnalysisEngine

    // ─── Lifecycle ───────────────────────────────────────────────────────────

    override fun onCreate() {
        super.onCreate()
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createNotificationChannel()
        audioCapture   = AudioCaptureHelper()
        deepfakeEngine = DeepfakeAnalysisEngine()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Show initial "scanning" notification immediately (required for foreground service)
        startForeground(NOTIFICATION_ID, buildNotification(NotifState.SCANNING))

        // Begin audio capture + analysis loop
        serviceScope.launch { runAnalysisLoop() }

        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        // ── CRITICAL: Stop audio capture and wipe all audio data from RAM ──
        audioCapture.stopAndWipe()
        serviceScope.cancel()
        // Notification is automatically removed when foreground service stops
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // ─── Analysis Loop ────────────────────────────────────────────────────────

    private suspend fun runAnalysisLoop() {
        audioCapture.start()

        while (isActive) {
            val audioFrame = audioCapture.get200msFrame() ?: break

            // Send to deepfake engine (runs ML model on-device)
            val riskScore = deepfakeEngine.analyze(audioFrame)
            currentRisk = riskScore

            val state = when {
                riskScore < 0.40f -> NotifState.SAFE
                riskScore < 0.75f -> NotifState.WARNING
                else              -> NotifState.DANGER
            }

            // Update the SAME notification in-place — no new notification, no sound
            notificationManager.notify(NOTIFICATION_ID, buildNotification(state, riskScore))

            delay(500) // Refresh every 500ms during call
        }
    }

    // ─── Notification Builder ─────────────────────────────────────────────────

    private fun buildNotification(state: NotifState, risk: Float = 0f): Notification {
        val (title, body, colorHex) = when (state) {
            NotifState.SCANNING -> Triple(
                "🔍 Analyzing caller voice...",
                "SentinelShield • Acoustic fingerprint loading",
                "#64748B"
            )
            NotifState.SAFE     -> Triple(
                "✅ Genuine Human Voice",
                "SentinelShield • ${(risk * 100).toInt()}% Risk — Call is Safe",
                "#10B981"
            )
            NotifState.WARNING  -> Triple(
                "⚠️ Unusual Voice Patterns Detected",
                "SentinelShield • ${(risk * 100).toInt()}% Risk — Stay Cautious",
                "#F59E0B"
            )
            NotifState.DANGER   -> Triple(
                "🚨 AI VOICE CLONE DETECTED!",
                "Do NOT share OTP or money! ${(risk * 100).toInt()}% Risk",
                "#EF4444"
            )
        }

        val openAppIntent = PendingIntent.getActivity(
            this, 0,
            packageManager.getLaunchIntentForPackage(packageName),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_shield_notif)
            .setContentTitle(title)
            .setContentText(body)
            .setColor(Color.parseColor(colorHex))
            .setColorized(true)
            .setOngoing(true)           // User cannot swipe away during active call
            .setOnlyAlertOnce(true)     // Silent in-place updates — NO repeated buzz/sound
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setContentIntent(openAppIntent)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build()
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            CHANNEL_NAME,
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Live in-call deepfake voice detection status"
            setSound(null, null)           // No sound on updates
            enableVibration(false)         // No vibration on updates
            enableLights(true)
            lightColor = Color.CYAN
        }
        notificationManager.createNotificationChannel(channel)
    }

    enum class NotifState { SCANNING, SAFE, WARNING, DANGER }
}
