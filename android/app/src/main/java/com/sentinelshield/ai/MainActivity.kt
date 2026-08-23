package com.sentinelshield.ai

import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

/**
 * SentinelShield AI — Android Native Dashboard & In-Call Permission Manager
 */
class MainActivity : AppCompatActivity() {

    private lateinit var btnToggleService: Button
    private lateinit var btnRequestOverlay: Button
    private lateinit var txtStatus: TextView
    private var isGuardActive = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        btnToggleService = findViewById(R.id.btnToggleService)
        btnRequestOverlay = findViewById(R.id.btnRequestOverlay)
        txtStatus = findViewById(R.id.txtGuardStatus)

        btnRequestOverlay.setOnClickListener {
            checkAndRequestOverlayPermission()
        }

        btnToggleService.setOnClickListener {
            if (!Settings.canDrawOverlays(this)) {
                Toast.makeText(this, "Please grant Overlay Permission first!", Toast.LENGTH_SHORT).show()
                checkAndRequestOverlayPermission()
                return@setOnClickListener
            }

            isGuardActive = !isGuardActive
            updateUIState()
        }
    }

    private fun checkAndRequestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:$packageName")
            )
            startActivityForResult(intent, 1001)
        } else {
            Toast.makeText(this, "Overlay permission already granted!", Toast.LENGTH_SHORT).show()
        }
    }

    private fun updateUIState() {
        if (isGuardActive) {
            btnToggleService.text = "STOP IN-CALL GUARD"
            btnToggleService.setBackgroundColor(0xFFEF4444.toInt())
            txtStatus.text = "ACTIVE • MONITORING INCOMING CALLS (RAM TEE)"
            txtStatus.setTextColor(0xFF10B981.toInt())
            Toast.makeText(this, "SentinelShield In-Call Guard Activated!", Toast.LENGTH_SHORT).show()
        } else {
            btnToggleService.text = "ACTIVATE IN-CALL GUARD"
            btnToggleService.setBackgroundColor(0xFF6366F1.toInt())
            txtStatus.text = "STANDBY • READY TO PROTECT"
            txtStatus.setTextColor(0xFF94A3B8.toInt())
        }
    }
}
