package com.sentinelshield.ai

import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*

class InCallProtectionService : Service() {

    companion object {
        const val NOTIFICATION_ID = 101
        const val CHANNEL_ID = "sentinelshield_incall_channel"
        var isShieldActive = true

        const val ACTION_UPDATE_VOICE_STATUS = "com.sentinelshield.ai.UPDATE_VOICE_STATUS"
        const val EXTRA_VERDICT = "extra_verdict"
        const val EXTRA_RISK_SCORE = "extra_risk_score"
        const val EXTRA_MESSAGE = "extra_message"
    }

    private val serviceScope = CoroutineScope(Dispatchers.Default + Job())

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!isShieldActive) {
            stopSelf()
            return START_NOT_STICKY
        }

        val verdict = intent?.getStringExtra(EXTRA_VERDICT) ?: "LISTENING"
        val riskScore = intent?.getIntExtra(EXTRA_RISK_SCORE, 0) ?: 0
        val customMsg = intent?.getStringExtra(EXTRA_MESSAGE)

        if (customMsg != null) {
            val (title, color) = when (verdict) {
                "AI_DETECTED" -> Pair("🚨 SentinelShield: AI Voice Clone Detected ($riskScore% Risk)", "#EF4444")
                "HUMAN" -> Pair("✅ SentinelShield: Genuine Human Voice Verified", "#10B981")
                else -> Pair("🔍 SentinelShield: Monitoring Live Voice (RAM TEE)", "#06B6D4")
            }
            updateNotification(title, customMsg, color)
        } else {
            startForeground(
                NOTIFICATION_ID,
                buildNotification(
                    "🛡️ SentinelShield AI: Active Voice & Link Defense",
                    "Status: Listening • Volatile RAM DSP Active (Zero Disk Retention)",
                    "#06B6D4"
                )
            )
        }

        return START_STICKY
    }

    fun updateNotification(title: String, message: String, colorHex: String) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, buildNotification(title, message, colorHex))
    }

    private fun buildNotification(title: String, message: String, colorHex: String): Notification {
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setColor(Color.parseColor(colorHex))
            .setColorized(true)
            .setOngoing(true) // Fixed sticky notification bar
            .setOnlyAlertOnce(true) // Silent in-place updates without spamming
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "SentinelShield In-Call & Background Monitor",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Persistent status notification for Human vs AI voice verification"
                setSound(null, null)
                enableVibration(false)
                setShowBadge(true)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
