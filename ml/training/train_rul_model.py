"""
SmartConveyor - SIH Problem Statement 26008 (NMDC Iron Ore Mining)
RUL (Remaining Useful Life) Model Training Script
Trains a GradientBoosting & RandomForest Regressor on multi-sensor degradation telemetry
and serializes the production model to ml/service/models/rul_model.pkl.
"""

import os
import sys
import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

# Add data generator path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from data.synthetic_generator import generate_rul_training_data

def train_and_export_rul_model():
    print("[*] Generating synthetic degradation curves for training...")
    df = generate_rul_training_data(random_seed=42)
    
    # Feature columns mapping to physical SIH 26008 IoT sensors
    features = [
        "vibration_rms",
        "joint_temperature",
        "ultrasonic_thickness",
        "acoustic_emission",
        "dynamic_load_tph",
        "belt_speed_mps"
    ]
    
    X = df[features]
    y_rul = df["rul_hours"]
    y_risk = df["risk_score"]
    
    X_train, X_test, y_rul_train, y_rul_test, y_risk_train, y_risk_test = train_test_split(
        X, y_rul, y_risk, test_size=0.2, random_state=42
    )
    
    print(f"[*] Training RUL Regressor on {len(X_train)} samples...")
    rul_model = GradientBoostingRegressor(
        n_estimators=120,
        learning_rate=0.08,
        max_depth=5,
        random_state=42
    )
    rul_model.fit(X_train, y_rul_train)
    
    rul_preds = rul_model.predict(X_test)
    rul_mae = mean_absolute_error(y_rul_test, rul_preds)
    rul_r2 = r2_score(y_rul_test, rul_preds)
    print(f"[+] RUL Model trained successfully! MAE: {rul_mae:.2f} hours, R2: {rul_r2:.4f}")
    
    print("[*] Training Risk Score Regressor...")
    risk_model = RandomForestRegressor(
        n_estimators=100,
        max_depth=6,
        random_state=42
    )
    risk_model.fit(X_train, y_risk_train)
    
    risk_preds = risk_model.predict(X_test)
    risk_mae = mean_absolute_error(y_risk_test, risk_preds)
    print(f"[+] Risk Score Model trained! MAE: {risk_mae:.2f}%")
    
    # Export bundle with feature names and metadata
    model_bundle = {
        "features": features,
        "rul_model": rul_model,
        "risk_model": risk_model,
        "metrics": {
            "rul_mae_hours": float(rul_mae),
            "rul_r2": float(rul_r2),
            "risk_mae_percent": float(risk_mae)
        },
        "feature_importances": {
            feat: float(imp) for feat, imp in zip(features, rul_model.feature_importances_)
        }
    }
    
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "service", "models")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "rul_model.pkl")
    
    joblib.dump(model_bundle, output_path)
    print(f"[OK] Serialized RUL model bundle saved to: {output_path}")

if __name__ == "__main__":
    train_and_export_rul_model()
