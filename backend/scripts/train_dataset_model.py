"""
SentinelShield AI — Multi-Lingual Dataset Model Training Script.

Trains a Random Forest classifier directly on the 962 audio samples in:
  - C:\\Users\\FRONTMAN\\OneDrive\\Desktop\\voice-data-main\\features.csv
Saves the trained model and scaler to:
  - backend/models/voice_classifier.joblib
"""
import os
import sys
from pathlib import Path
import joblib
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, accuracy_score

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_FEATURES_PATH = Path(r"C:\Users\FRONTMAN\OneDrive\Desktop\voice-data-main\features.csv")
LOCAL_FEATURES_PATH = BASE_DIR.parent / "dataset" / "features.csv"
MODEL_OUTPUT_PATH = MODELS_DIR / "voice_classifier.joblib"


def train_model():
    feat_path = DEFAULT_FEATURES_PATH if DEFAULT_FEATURES_PATH.exists() else LOCAL_FEATURES_PATH
    if not feat_path.exists():
        print(f"Error: features.csv not found at {feat_path}")
        sys.exit(1)

    print(f"Loading dataset features from: {feat_path}")
    df = pd.read_csv(feat_path)
    print(f"Dataset shape: {df.shape[0]} samples, {df.shape[1]} columns")

    # Drop non-feature columns
    drop_cols = [c for c in ['filename', 'label', 'language'] if c in df.columns]
    X = df.drop(columns=drop_cols)
    y_raw = df['label']

    # 1 for AI, 0 for Human
    y = (y_raw.str.lower() == 'ai').astype(int).values
    feature_names = list(X.columns)

    print(f"Total AI samples: {np.sum(y == 1)}, Total Human samples: {np.sum(y == 0)}")

    # 5-fold Stratified Cross-Validation
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    rf_cv = cross_val_score(RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=1), X, y, cv=skf, scoring='roc_auc')
    print(f"5-Fold CV ROC-AUC: {np.mean(rf_cv):.4f} (+/- {np.std(rf_cv):.4f})")

    # Train / Test split for evaluation
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train Random Forest Classifier
    clf = RandomForestClassifier(n_estimators=150, max_depth=14, min_samples_split=2, random_state=42, n_jobs=1)
    clf.fit(X_train_scaled, y_train)

    y_pred = clf.predict(X_test_scaled)
    y_prob = clf.predict_proba(X_test_scaled)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)

    print(f"\nHoldout Test Accuracy: {acc*100:.2f}%")
    print(f"Holdout Test ROC-AUC:  {auc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Human', 'AI']))

    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    # Feature Importance Top 10
    importances = clf.feature_importances_
    indices = np.argsort(importances)[::-1]
    print("\nTop 10 Most Discriminative Acoustic Features:")
    for rank, idx in enumerate(indices[:10]):
        print(f"  {rank+1}. {feature_names[idx]:22s}: {importances[idx]:.4f}")

    # Save to disk
    payload = {
        "model": clf,
        "scaler": scaler,
        "feature_names": feature_names,
        "accuracy": acc,
        "roc_auc": auc,
        "total_samples": len(df),
    }
    joblib.dump(payload, MODEL_OUTPUT_PATH)
    print(f"\n[SUCCESS] Trained AI Voice Forensic model saved to: {MODEL_OUTPUT_PATH}")


if __name__ == "__main__":
    train_model()
