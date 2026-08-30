package com.sentinelshield.ai

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat

/**
 * Listens for Android phone call state changes.
 *
 * OFFHOOK → call picked up  → starts InCallProtectionService
 * IDLE    → call ended      → stops InCallProtectionService (which auto-wipes RAM)
 */
class PhoneStateReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (!InCallProtectionService.shieldEnabled) return

        val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE) ?: return

        val serviceIntent = Intent(context, InCallProtectionService::class.java)

        when (state) {
            TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                // User picked up the call — start foreground service
                ContextCompat.startForegroundService(context, serviceIntent)
            }
            TelephonyManager.EXTRA_STATE_IDLE -> {
                // Call ended — stop service (triggers onDestroy which wipes audio RAM)
                context.stopService(serviceIntent)
            }
        }
    }
}
