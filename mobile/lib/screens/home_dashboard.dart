import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import '../services/call_monitor_service.dart';

class HomeDashboard extends StatefulWidget {
  const HomeDashboard({super.key});

  @override
  State<HomeDashboard> createState() => _HomeDashboardState();
}

class _HomeDashboardState extends State<HomeDashboard> {
  bool _shieldActive = true;
  String _userPhone   = '';
  final CallMonitorService _monitor = CallMonitorService();

  @override
  void initState() {
    super.initState();
    _loadUser();
    _monitor.initialize();
  }

  Future<void> _loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() => _userPhone = prefs.getString('user_phone') ?? 'guest');
  }

  Future<void> _toggleShield(bool val) async {
    setState(() => _shieldActive = val);
    if (val) {
      await _monitor.startMonitoring();
    } else {
      await _monitor.stopMonitoring();
    }
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, '/signin');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.shield, color: AppTheme.cyan, size: 22),
            const SizedBox(width: 8),
            RichText(
              text: const TextSpan(
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
                children: [
                  TextSpan(text: 'SENTINEL', style: TextStyle(color: AppTheme.textMain)),
                  TextSpan(text: 'SHIELD', style: TextStyle(color: AppTheme.cyan)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: AppTheme.textMuted, size: 20),
            onPressed: _logout,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            // User greeting
            Text(
              _userPhone == 'guest' ? 'Guest Mode 👋' : 'Protected: +91 $_userPhone',
              style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
            ),
            const SizedBox(height: 20),

            // Shield Status Card (BIG)
            GlassCard(
              child: Column(
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 400),
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: (_shieldActive ? AppTheme.emerald : AppTheme.red).withOpacity(0.1),
                      border: Border.all(
                        color: _shieldActive ? AppTheme.emerald : AppTheme.red,
                        width: 2.5,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: (_shieldActive ? AppTheme.emerald : AppTheme.red).withOpacity(0.35),
                          blurRadius: 30,
                          spreadRadius: 4,
                        ),
                      ],
                    ),
                    child: Icon(
                      _shieldActive ? Icons.shield : Icons.shield_outlined,
                      color: _shieldActive ? AppTheme.emerald : AppTheme.red,
                      size: 52,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _shieldActive ? 'PROTECTION ACTIVE' : 'PROTECTION OFF',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: _shieldActive ? AppTheme.emerald : AppTheme.red,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _shieldActive
                        ? 'All incoming calls are being monitored for AI voices'
                        : 'Toggle ON to protect your calls',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                  ),
                  const SizedBox(height: 20),
                  Switch.adaptive(
                    value: _shieldActive,
                    onChanged: _toggleShield,
                    activeColor: AppTheme.emerald,
                    inactiveThumbColor: AppTheme.red,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // How it works
            const Text('How It Works', style: TextStyle(
                fontSize: 15, fontWeight: FontWeight.w800, color: AppTheme.textMuted)),
            const SizedBox(height: 12),

            ...[
              _Step('1', Icons.call_received, AppTheme.cyan,
                  'Call Detected', 'When you pick up a call, protection activates silently.'),
              _Step('2', Icons.notifications_active, AppTheme.amber,
                  'Live Notification Appears', 'A single sticky notification shows analysis status in your status bar.'),
              _Step('3', Icons.graphic_eq, AppTheme.emerald,
                  'AI Analysis (200ms)', 'Audio is analyzed in RAM — never stored or uploaded.'),
              _Step('4', Icons.warning_amber, AppTheme.red,
                  'Instant Alert if Threat', 'Notification turns RED and alerts you if an AI voice clone is detected.'),
              _Step('5', Icons.delete_sweep, AppTheme.textMuted,
                  'Call Ends — Clean Slate', 'Notification disappears. All audio data wiped from RAM.'),
            ].map((s) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: GlassCard(
                child: Row(
                  children: [
                    Container(
                      width: 36, height: 36,
                      decoration: BoxDecoration(
                        color: s.color.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(s.icon, color: s.color, size: 18),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(s.title,
                              style: const TextStyle(fontWeight: FontWeight.w800,
                                  color: AppTheme.textMain, fontSize: 13)),
                          Text(s.desc,
                              style: const TextStyle(fontSize: 11,
                                  color: AppTheme.textMuted, height: 1.4)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            )),

            const SizedBox(height: 20),

            // Notification preview
            const Text('Notification Preview', style: TextStyle(
                fontSize: 15, fontWeight: FontWeight.w800, color: AppTheme.textMuted)),
            const SizedBox(height: 12),
            _NotifPreview(),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

class _Step {
  final String num;
  final IconData icon;
  final Color color;
  final String title;
  final String desc;
  const _Step(this.num, this.icon, this.color, this.title, this.desc);
}

class _NotifPreview extends StatefulWidget {
  @override
  State<_NotifPreview> createState() => _NotifPreviewState();
}

class _NotifPreviewState extends State<_NotifPreview> {
  int _step = 0;

  final _states = [
    _NS(Colors.grey.shade700, '🔍 Analyzing caller voice...', 'SentinelShield • In-Call Protection'),
    _NS(AppTheme.emerald, '✅ Genuine Human Voice — 8% Risk', 'SentinelShield • SAFE'),
    _NS(AppTheme.amber,   '⚠️ Unusual Patterns — 61% Risk', 'SentinelShield • WARNING'),
    _NS(AppTheme.red,     '🚨 AI Voice Clone Detected! Do NOT share OTP!', 'SentinelShield • RED ALERT'),
  ];

  @override
  Widget build(BuildContext context) {
    final s = _states[_step];
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.phonelink_ring, color: AppTheme.textMuted, size: 14),
              SizedBox(width: 6),
              Text('STATUS BAR NOTIFICATION PREVIEW',
                  style: TextStyle(fontSize: 10, color: AppTheme.textMuted, fontWeight: FontWeight.w700, letterSpacing: 0.8)),
            ],
          ),
          const SizedBox(height: 14),
          AnimatedContainer(
            duration: const Duration(milliseconds: 400),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: s.color.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: s.color.withOpacity(0.4)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.shield, color: s.color, size: 16),
                    const SizedBox(width: 8),
                    Text(s.title2, style: TextStyle(
                        color: s.color, fontWeight: FontWeight.w800, fontSize: 12)),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: s.color.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text('ONGOING', style: TextStyle(color: s.color, fontSize: 9, fontWeight: FontWeight.w900)),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(s.msg, style: const TextStyle(color: AppTheme.textMain, fontSize: 13, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              const Text('Simulate:', style: TextStyle(color: AppTheme.textMuted, fontSize: 11)),
              const SizedBox(width: 8),
              ...List.generate(_states.length, (i) => GestureDetector(
                onTap: () => setState(() => _step = i),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.only(right: 6),
                  width: i == _step ? 24 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: i == _step ? _states[i].color : AppTheme.border,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              )),
            ],
          ),
        ],
      ),
    );
  }
}

class _NS {
  final Color color;
  final String msg;
  final String title2;
  const _NS(this.color, this.msg, this.title2);
}
