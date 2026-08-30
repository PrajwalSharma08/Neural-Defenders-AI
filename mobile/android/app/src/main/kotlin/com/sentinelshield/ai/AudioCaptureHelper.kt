package com.sentinelshield.ai

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import java.util.Arrays

/**
 * Captures 200ms rolling audio frames from the device microphone.
 * All data lives in a fixed ByteArray — overwritten every frame.
 * Call stopAndWipe() to zero-fill and release the buffer (zero disk storage guarantee).
 */
class AudioCaptureHelper {

    private val SAMPLE_RATE   = 16000   // 16kHz — standard for speech models
    private val FRAME_MS      = 200     // 200ms frame size
    private val FRAME_BYTES   = SAMPLE_RATE * FRAME_MS / 1000 * 2  // 16-bit PCM → ×2

    private var recorder: AudioRecord? = null
    private var buffer: ByteArray      = ByteArray(FRAME_BYTES)
    private var running = false

    fun start() {
        val minBuf = AudioRecord.getMinBufferSize(
            SAMPLE_RATE,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        )
        recorder = AudioRecord(
            MediaRecorder.AudioSource.VOICE_COMMUNICATION,
            SAMPLE_RATE,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
            maxOf(minBuf, FRAME_BYTES)
        )
        recorder?.startRecording()
        running = true
    }

    /** Returns a copy of the latest 200ms frame, or null if stopped. */
    fun get200msFrame(): ByteArray? {
        if (!running) return null
        val read = recorder?.read(buffer, 0, FRAME_BYTES) ?: 0
        if (read <= 0) return null
        return buffer.copyOf(read)
    }

    /** Zero-fills buffer and releases AudioRecord — called on call end. */
    fun stopAndWipe() {
        running = false
        recorder?.stop()
        recorder?.release()
        recorder = null
        Arrays.fill(buffer, 0.toByte())   // Overwrite audio RAM with zeros
    }
}
