import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_theme.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;
  late Animation<double> _glow;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1500));
    _scale = CurvedAnimation(parent: _ctrl, curve: Curves.elasticOut);
    _glow  = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _ctrl, curve: const Interval(0.5, 1.0)),
    );
    _ctrl.forward();
    _navigate();
  }

  Future<void> _navigate() async {
    await Future.delayed(const Duration(milliseconds: 2400));
    if (!mounted) return;
    final prefs = await SharedPreferences.getInstance();
    final isLoggedIn = prefs.getBool('is_logged_in') ?? false;
    final permsDone  = prefs.getBool('perms_done') ?? false;
    if (isLoggedIn && permsDone) {
      Navigator.pushReplacementNamed(context, '/home');
    } else if (isLoggedIn) {
      Navigator.pushReplacementNamed(context, '/permissions');
    } else {
      Navigator.pushReplacementNamed(context, '/signin');
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: Center(
        child: AnimatedBuilder(
          animation: _ctrl,
          builder: (_, __) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ScaleTransition(
                scale: _scale,
                child: Container(
                  width: 110,
                  height: 110,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.cyan.withOpacity(0.5 * _glow.value),
                        blurRadius: 50,
                        spreadRadius: 10,
                      ),
                    ],
                    gradient: const LinearGradient(
                      colors: [Color(0xFF0f2b4a), Color(0xFF0a1628)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    border: Border.all(color: AppTheme.cyan.withOpacity(0.6), width: 2),
                  ),
                  child: const Icon(Icons.shield, color: AppTheme.cyan, size: 56),
                ),
              ),
              const SizedBox(height: 28),
              RichText(
                text: const TextSpan(
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: 1.5),
                  children: [
                    TextSpan(text: 'SENTINEL', style: TextStyle(color: AppTheme.textMain)),
                    TextSpan(text: 'SHIELD', style: TextStyle(color: AppTheme.cyan)),
                    TextSpan(text: ' AI', style: TextStyle(color: AppTheme.emerald)),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'SIH 2026 • Real-Time Deepfake Defense',
                style: TextStyle(color: AppTheme.textMuted, fontSize: 12, letterSpacing: 0.5),
              ),
              const SizedBox(height: 48),
              SizedBox(
                width: 36,
                height: 36,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    AppTheme.cyan.withOpacity(0.7),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
