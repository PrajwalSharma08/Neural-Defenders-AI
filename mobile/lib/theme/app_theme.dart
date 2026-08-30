import 'package:flutter/material.dart';

class AppTheme {
  static const Color bg       = Color(0xFF080914);
  static const Color surface  = Color(0xFF0f1629);
  static const Color cyan     = Color(0xFF06B6D4);
  static const Color emerald  = Color(0xFF10B981);
  static const Color red      = Color(0xFFEF4444);
  static const Color amber    = Color(0xFFF59E0B);
  static const Color textMain = Color(0xFFE2E8F0);
  static const Color textMuted= Color(0xFF64748B);
  static const Color border   = Color(0xFF1e293b);

  static ThemeData get darkTheme => ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: bg,
    primaryColor: cyan,
    colorScheme: const ColorScheme.dark(
      primary: cyan,
      secondary: emerald,
      surface: surface,
      error: red,
    ),
    fontFamily: 'Roboto',
    useMaterial3: true,
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      titleTextStyle: TextStyle(
        color: textMain,
        fontSize: 18,
        fontWeight: FontWeight.w800,
      ),
      iconTheme: IconThemeData(color: cyan),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: cyan,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: surface,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: cyan, width: 2),
      ),
      labelStyle: const TextStyle(color: textMuted),
      hintStyle: const TextStyle(color: textMuted),
    ),
  );
}
