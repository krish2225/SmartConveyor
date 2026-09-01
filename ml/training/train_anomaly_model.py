"""
SmartConveyor - SIH Problem Statement 26008 (NMDC Iron Ore Mining)
Anomaly Detection Model Training Script
Trains an Isolation Forest model capable of identifying anomalous multi-modal vibration/acoustic
stress spikes while accounting for the dump window suppression filter.
Serializes model to ml/service/models/anomaly_model.pkl.
"""

import os
import sys
import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from data.synthetic_generator import generate_anomaly_training_data

def train_and_export_anomaly_model():
    print("[*] Generating training dataset for anomaly detection...")
    df = generate_anomaly_training_data(num_samples=6000, random_seed=42)
    
    # Features for anomaly detection
    features = [
        "vibration_rms",
        "dynamic_load_tph",
        "joint_temperature",
        "acoustic_emission"
    ]
    
    # Train on normal + non-defect samples (unsupervised isolation)
    X = df[features]
    
    print("[*] Training Isolation Forest model...")
    iso_model = IsolationForest(
        n_estimators=150,
        contamination=0.08,
        max_samples=256,
        random_state=42
    )
    iso_model.fit(X)
    
    # Test predictions
    preds = iso_model.predict(X) # -1 is anomaly, 1 is normal
    binary_preds = np.where(preds == -1, 1, 0)
    
    print("[+] Isolation Forest trained successfully!")
    print(classification_report(df["is_anomaly"], binary_preds, target_names=["Normal/Dump", "Defect Anomaly"]))
    
    model_bundle = {
        "features": features,
        "model": iso_model,
        "vibration_threshold": 6.0,
        "temp_threshold": 70.0,
        "acoustic_threshold": 68.0
    }
    
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "service", "models")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "anomaly_model.pkl")
    
    joblib.dump(model_bundle, output_path)
    print(f"[OK] Serialized Anomaly model saved to: {output_path}")

if __name__ == "__main__":
    train_and_export_anomaly_model()
