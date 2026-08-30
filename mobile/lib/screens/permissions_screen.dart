import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';

class PermissionsScreen extends StatefulWidget {
  const PermissionsScreen({super.key});

  @override
  State<PermissionsScreen> createState() => _PermissionsScreenState();
}

class _PermissionsScreenState extends State<PermissionsScreen> {
  bool _loading = false;

  final List<_PermInfo> _perms = [
    _PermInfo(
      icon: Icons.call,
      color: AppTheme.cyan,
      title: 'Phone State',
      desc: 'Detects when a call is picked up. We never record call audio without your knowledge.',
    ),
    _PermInfo(
      icon: Icons.mic_none,
      color: AppTheme.emerald,
      title: 'Microphone (In-Call Only)',
      desc: '200ms rolling audio frame — only processed in RAM during active call, never stored.',
    ),
    _PermInfo(
      icon: Icons.notifications_none,
      color: AppTheme.amber,
      title: 'Notifications',
      desc: 'One single sticky notification during a call. No spam. Auto-clears when call ends.',
    ),
  ];

  Future<void> _requestAll() async {
    setState(() => _loading = true);
    await [Permission.phone, Permission.microphone, Permission.notification].request();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('perms_done', true);
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, '/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              const Icon(Icons.security, color: AppTheme.cyan, size: 44),
              const SizedBox(height: 16),
              const Text(
                'One-Time Setup',
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: AppTheme.textMain),
              ),
              const SizedBox(height: 8),
              const Text(
                'SentinelShield needs 3 permissions to protect your calls in the background. You'll never be asked again.',
                style: TextStyle(fontSize: 14, color: AppTheme.textMuted, height: 1.6),
              ),
              const SizedBox(height: 32),

              ..._perms.map((p) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: GlassCard(
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: p.color.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(p.icon, color: p.color, size: 24),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(p.title,
                                style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.textMain, fontSize: 14)),
                            const SizedBox(height: 4),
                            Text(p.desc,
                                style: const TextStyle(fontSize: 12, color: AppTheme.textMuted, height: 1.5)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              )),

              const Spacer(),

              // Privacy note
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTheme.emerald.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.emerald.withOpacity(0.2)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.lock_outline, color: AppTheme.emerald, size: 18),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Zero data stored. Audio is wiped from RAM when call ends.',
                        style: TextStyle(fontSize: 12, color: AppTheme.emerald, height: 1.5),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _loading ? null : _requestAll,
                icon: _loading
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.shield, size: 20),
                label: const Text('Allow & Activate Protection'),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}

class _PermInfo {
  final IconData icon;
  final Color color;
  final String title;
  final String desc;
  const _PermInfo({required this.icon, required this.color, required this.title, required this.desc});
}
