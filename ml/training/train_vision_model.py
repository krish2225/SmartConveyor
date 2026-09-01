"""
SmartConveyor - SIH Problem Statement 26008 (NMDC Iron Ore Mining)
Vision Model Training and Export Script
Trains a multi-class defect classification and bounding box regression model
for line-scan conveyor surface inspection (Tear, Delamination, Transverse Crack, Normal).
Serializes model artifacts to ml/service/models/vision_model.pkl.
"""

import os
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.multioutput import MultiOutputRegressor
from sklearn.linear_model import Ridge

def train_and_export_vision_model():
    print("[*] Generating synthetic vision feature dataset (color variance, edge gradient, thermal intensity, texture entropy)...")
    np.random.seed(42)
    
    classes = [
        "Normal Belt Surface",
        "Longitudinal Rip / Tear",
        "Splice Joint Delamination / Pull-out",
        "Heavy Transverse Surface Crack",
        "Localized Hot Spot Overheating"
    ]
    
    # 2000 synthetic image feature vectors
    X = []
    y_class = []
    y_bbox = [] # [x_min, y_min, width, height, defect_len_mm, defect_width_mm]
    
    for _ in range(2500):
        cls_idx = np.random.choice([0, 1, 2, 3, 4], p=[0.55, 0.12, 0.12, 0.15, 0.06])
        
        if cls_idx == 0:  # Normal
            edge_grad = np.random.normal(12.0, 3.0)
            color_var = np.random.normal(8.0, 2.0)
            entropy = np.random.normal(4.2, 0.4)
            aspect_ratio = np.random.normal(1.0, 0.2)
            thermal_peak = np.random.normal(45.0, 4.0)
            bbox = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
        elif cls_idx == 1:  # Longitudinal Tear
            edge_grad = np.random.normal(85.0, 10.0)
            color_var = np.random.normal(45.0, 8.0)
            entropy = np.random.normal(7.8, 0.5)
            aspect_ratio = np.random.normal(6.5, 1.2)
            thermal_peak = np.random.normal(52.0, 5.0)
            bbox = [0.42, 0.15, 0.16, 0.70, 850.0, 35.0] # long vertical tear
        elif cls_idx == 2:  # Splice Delamination
            edge_grad = np.random.normal(75.0, 12.0)
            color_var = np.random.normal(55.0, 9.0)
            entropy = np.random.normal(8.2, 0.6)
            aspect_ratio = np.random.normal(0.4, 0.1) # wide horizontal seam
            thermal_peak = np.random.normal(58.0, 6.0)
            bbox = [0.10, 0.45, 0.80, 0.18, 1280.0, 65.0]
        elif cls_idx == 3:  # Transverse Crack
            edge_grad = np.random.normal(62.0, 8.0)
            color_var = np.random.normal(30.0, 6.0)
            entropy = np.random.normal(6.5, 0.5)
            aspect_ratio = np.random.normal(0.6, 0.15)
            thermal_peak = np.random.normal(48.0, 4.0)
            bbox = [0.30, 0.35, 0.45, 0.12, 420.0, 18.0]
        else:  # Thermal Overheat
            edge_grad = np.random.normal(35.0, 6.0)
            color_var = np.random.normal(60.0, 10.0)
            entropy = np.random.normal(5.9, 0.5)
            aspect_ratio = np.random.normal(1.2, 0.3)
            thermal_peak = np.random.normal(92.0, 8.0)
            bbox = [0.38, 0.38, 0.24, 0.24, 250.0, 250.0]
            
        feat = [edge_grad, color_var, entropy, aspect_ratio, thermal_peak]
        X.append(feat)
        y_class.append(cls_idx)
        y_bbox.append(bbox)
        
    X = np.array(X)
    y_class = np.array(y_class)
    y_bbox = np.array(y_bbox)
    
    print("[*] Training Random Forest Vision Classifier...")
    clf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    clf.fit(X, y_class)
    
    print("[*] Training Bounding Box & Dimension Regressor...")
    reg = MultiOutputRegressor(Ridge())
    reg.fit(X, y_bbox)
    
    model_bundle = {
        "classes": classes,
        "classifier": clf,
        "regressor": reg,
        "feature_names": ["edge_gradient", "color_variance", "texture_entropy", "aspect_ratio", "thermal_peak"]
    }
    
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "service", "models")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "vision_model.pkl")
    
    joblib.dump(model_bundle, output_path)
    print(f"[OK] Serialized Vision model saved to: {output_path}")

if __name__ == "__main__":
    train_and_export_vision_model()
