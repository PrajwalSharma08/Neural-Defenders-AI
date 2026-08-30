package com.sentinelshield.ai

import android.content.Intent
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.sentinelshield.ai/call_monitor"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "initialize" -> {
                        // Nothing to do here — receiver is always registered
                        result.success(null)
                    }
                    "startMonitoring" -> {
                        InCallProtectionService.shieldEnabled = true
                        result.success(null)
                    }
                    "stopMonitoring" -> {
                        InCallProtectionService.shieldEnabled = false
                        // Stop service if currently running
                        stopService(Intent(this, InCallProtectionService::class.java))
                        result.success(null)
                    }
                    else -> result.notImplemented()
                }
            }
    }
}
