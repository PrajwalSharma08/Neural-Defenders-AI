package com.sentinelshield.ai

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Re-activates shield monitoring after device reboot. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            // Shield is re-enabled on boot — waiting silently for next call
            InCallProtectionService.shieldEnabled = true
        }
    }
}
