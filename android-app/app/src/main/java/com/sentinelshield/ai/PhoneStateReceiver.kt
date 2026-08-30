package com.sentinelshield.ai

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat

class PhoneStateReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (!InCallProtectionService.isShieldActive) return

        val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE) ?: return
        val serviceIntent = Intent(context, InCallProtectionService::class.java)

        when (state) {
            TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                // Call picked up -> Start Single Sticky Foreground Service Notification
                ContextCompat.startForegroundService(context, serviceIntent)
            }
            TelephonyManager.EXTRA_STATE_IDLE -> {
                // Call ended -> Stop Foreground Service & Remove Notification
                context.stopService(serviceIntent)
            }
        }
    }
}
