import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';

class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _phoneCtrl = TextEditingController();
  final _otpCtrl   = TextEditingController();
  bool _otpSent    = false;
  bool _loading    = false;
  String? _error;

  // For demo: OTP is always 123456
  static const _demoOtp = '123456';

  Future<void> _sendOtp() async {
    final phone = _phoneCtrl.text.trim();
    if (phone.length < 10) {
      setState(() => _error = 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setState(() { _loading = true; _error = null; });
    await Future.delayed(const Duration(seconds: 1)); // Simulate API call
    setState(() { _loading = false; _otpSent = true; });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppTheme.surface,
        content: Text(
          '📱 OTP sent to +91 $phone  (Demo OTP: 1 2 3 4 5 6)',
          style: const TextStyle(color: AppTheme.cyan, fontWeight: FontWeight.w700),
        ),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  Future<void> _verifyOtp() async {
    if (_otpCtrl.text.trim() != _demoOtp) {
      setState(() => _error = 'Incorrect OTP. Try: 123456');
      return;
    }
    setState(() { _loading = true; _error = null; });
    await Future.delayed(const Duration(milliseconds: 800));
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('is_logged_in', true);
    await prefs.setString('user_phone', _phoneCtrl.text.trim());
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, '/permissions');
  }

  Future<void> _guestLogin() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('is_logged_in', true);
    await prefs.setString('user_phone', 'guest');
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, '/permissions');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Logo
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: AppTheme.cyan.withOpacity(0.5), width: 2),
                        color: AppTheme.surface,
                        boxShadow: [BoxShadow(color: AppTheme.cyan.withOpacity(0.2), blurRadius: 30)],
                      ),
                      child: const Icon(Icons.shield, color: AppTheme.cyan, size: 38),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Welcome to SentinelShield AI',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppTheme.textMain),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Sign in to activate real-time call protection',
                      style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 40),

              // OTP Card
              GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('📱  Mobile OTP Login',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppTheme.textMain)),
                    const SizedBox(height: 16),

                    // Phone Input
                    TextField(
                      controller: _phoneCtrl,
                      enabled: !_otpSent,
                      keyboardType: TextInputType.phone,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(10)],
                      style: const TextStyle(color: AppTheme.textMain, fontSize: 16, letterSpacing: 1.5),
                      decoration: const InputDecoration(
                        labelText: 'Mobile Number',
                        prefixText: '+91  ',
                        prefixStyle: TextStyle(color: AppTheme.cyan, fontWeight: FontWeight.w700),
                        hintText: '98XXXXXXXX',
                      ),
                    ),
                    const SizedBox(height: 12),

                    if (!_otpSent)
                      ElevatedButton(
                        onPressed: _loading ? null : _sendOtp,
                        child: _loading
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Text('Send OTP'),
                      ),

                    if (_otpSent) ...[
                      const SizedBox(height: 8),
                      // OTP Input
                      TextField(
                        controller: _otpCtrl,
                        keyboardType: TextInputType.number,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
                        style: const TextStyle(color: AppTheme.cyan, fontSize: 22, letterSpacing: 8, fontWeight: FontWeight.w900),
                        textAlign: TextAlign.center,
                        decoration: const InputDecoration(
                          labelText: '6-Digit OTP',
                          hintText: '• • • • • •',
                        ),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: _loading ? null : _verifyOtp,
                        child: _loading
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Text('Verify & Activate'),
                      ),
                      TextButton(
                        onPressed: () => setState(() { _otpSent = false; _otpCtrl.clear(); }),
                        child: const Text('← Change Number', style: TextStyle(color: AppTheme.textMuted)),
                      ),
                    ],

                    if (_error != null) ...[
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppTheme.red.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppTheme.red.withOpacity(0.3)),
                        ),
                        child: Text(_error!, style: const TextStyle(color: AppTheme.red, fontSize: 13)),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Divider
              Row(
                children: [
                  Expanded(child: Divider(color: AppTheme.border)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text('or', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                  ),
                  Expanded(child: Divider(color: AppTheme.border)),
                ],
              ),

              const SizedBox(height: 16),

              // Guest Mode Button
              OutlinedButton.icon(
                onPressed: _guestLogin,
                icon: const Icon(Icons.person_outline, color: AppTheme.textMuted),
                label: const Text('Continue as Guest  (Limited Mode)',
                    style: TextStyle(color: AppTheme.textMuted)),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 52),
                  side: BorderSide(color: AppTheme.border),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),

              const SizedBox(height: 24),
              const Center(
                child: Text(
                  '🔒 No data leaves your device without consent.
SIH 2026 — Team Neural Defenders',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 11, color: AppTheme.textMuted, height: 1.6),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
