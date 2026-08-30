import 'package:flutter/services.dart';

/// Flutter <-> Android MethodChannel bridge.
/// The actual heavy lifting (PhoneStateReceiver, ForegroundService, AudioCapture)
/// is done natively in Kotlin. This Dart class acts as the control interface.
class CallMonitorService {
  static const _channel = MethodChannel('com.sentinelshield.ai/call_monitor');

  Future<void> initialize() async {
    try {
      await _channel.invokeMethod('initialize');
    } catch (_) {
      // Native layer not yet connected (web/desktop dev mode)
    }
  }

  Future<void> startMonitoring() async {
    try {
      await _channel.invokeMethod('startMonitoring');
    } catch (_) {}
  }

  Future<void> stopMonitoring() async {
    try {
      await _channel.invokeMethod('stopMonitoring');
    } catch (_) {}
  }
}
