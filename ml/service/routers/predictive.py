"""
SmartConveyor - Predictive Maintenance Router
SIH PS 26008: RUL (Remaining Useful Life) Regression & Joint Rupture Risk Scoring
Endpoint: POST /predict-rul
"""

import os
import joblib
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

router = APIRouter()

# Model loader
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "rul_model.pkl")
_model_bundle = None

def get_rul_model():
    global _model_bundle
    if _model_bundle is None:
        if os.path.exists(MODEL_PATH):
            try:
                _model_bundle = joblib.load(MODEL_PATH)
            except Exception as e:
                print(f"[!] Warning: Could not load RUL model from {MODEL_PATH}: {e}")
                _model_bundle = None
    return _model_bundle


class SensorReadingsInput(BaseModel):
    jointId: str = Field(default="Joint-01", description="Identifier of the belt splice joint")
    vibrationRms: float = Field(default=2.4, description="Drive pulley / joint vibration in mm/s")
    jointTemperature: float = Field(default=45.0, description="Thermal core temp in °C")
    ultrasonicThickness: float = Field(default=24.0, description="Splice residual thickness in mm")
    acousticEmission: float = Field(default=42.0, description="High frequency stress wave in dB")
    dynamicLoadTph: float = Field(default=1850.0, description="Belt loading rate in t/h")
    beltSpeedMps: float = Field(default=4.2, description="Belt linear speed in m/s")
    operatingHours: Optional[float] = Field(default=1200.0, description="Cumulative joint operating hours")
    sensorReliabilityWeights: Optional[Dict[str, float]] = Field(default=None, description="Down-weighting factors from sensorReliability.js")


class RULPredictionResponse(BaseModel):
    jointId: str
    riskScore: float
    estimatedTimeToFailureHours: float
    estimatedTimeToFailureDays: float
    healthStatus: str
    confidence: float
    featureImportances: Dict[str, float]
    recommendation: str
    isReliabilityWeighted: bool


@router.post("/predict-rul", response_model=RULPredictionResponse)
async def predict_rul(data: SensorReadingsInput):
    bundle = get_rul_model()
    
    # Apply reliability down-weighting if provided by sensorReliability.js
    weights = data.sensorReliabilityWeights or {}
    vibration_w = weights.get("drive_vibration", 1.0)
    temp_w = weights.get("joint_temperature", 1.0)
    thickness_w = weights.get("ultrasonic_thickness", 1.0)
    acoustic_w = weights.get("acoustic_emission", 1.0)
    
    # Weight adjusted features
    adj_vibration = data.vibrationRms * vibration_w + (1.0 - vibration_w) * 2.5
    adj_temp = data.jointTemperature * temp_w + (1.0 - temp_w) * 45.0
    adj_thickness = data.ultrasonicThickness * thickness_w + (1.0 - thickness_w) * 24.0
    adj_acoustic = data.acousticEmission * acoustic_w + (1.0 - acoustic_w) * 40.0
    
    features = np.array([[
        adj_vibration,
        adj_temp,
        adj_thickness,
        adj_acoustic,
        data.dynamicLoadTph,
        data.beltSpeedMps
    ]])
    
    if bundle is not None and "rul_model" in bundle and "risk_model" in bundle:
        try:
            rul_hours = float(bundle["rul_model"].predict(features)[0])
            risk_score = float(bundle["risk_model"].predict(features)[0])
            importances = bundle.get("feature_importances", {})
        except Exception:
            rul_hours = None
            risk_score = None
            importances = {}
    else:
        rul_hours = None
        risk_score = None
        importances = {
            "vibration_rms": 0.35,
            "ultrasonic_thickness": 0.30,
            "acoustic_emission": 0.20,
            "joint_temperature": 0.15
        }
        
    # Rule-based physics fallback if model was not pre-trained
    if rul_hours is None or risk_score is None:
        # Physics degradation proxy
        wear_ratio = max(0.0, min(1.0, (26.0 - adj_thickness) / 11.0))
        vib_ratio = max(0.0, min(1.0, (adj_vibration - 1.2) / 7.3))
        temp_ratio = max(0.0, min(1.0, (adj_temp - 35.0) / 50.0))
        acoustic_ratio = max(0.0, min(1.0, (adj_acoustic - 30.0) / 52.0))
        
        composite_wear = 0.35 * vib_ratio + 0.30 * wear_ratio + 0.20 * acoustic_ratio + 0.15 * temp_ratio
        risk_score = round(composite_wear * 100.0, 2)
        max_life = 6000.0
        rul_hours = round(max(0.0, max_life * (1.0 - composite_wear)), 1)
        
    risk_score = round(max(0.0, min(100.0, risk_score)), 2)
    rul_hours = round(max(0.0, rul_hours), 1)
    rul_days = round(rul_hours / 24.0, 1)
    
    # Categorize Health Status (SIH 26008 criteria)
    if risk_score >= 70.0 or rul_days <= 14.0:
        health_status = "CRITICAL_DELAMINATION"
        recommendation = "Immediate splice inspection required. Schedule urgent belt vulcanization maintenance."
    elif risk_score >= 35.0 or rul_days <= 45.0:
        health_status = "ELEVATED_WEAR"
        recommendation = "Joint wear detected. Plan splice re-clamping during upcoming planned maintenance window."
    else:
        health_status = "OPTIMAL"
        recommendation = "Joint condition optimal. Continuous real-time monitoring active."
        
    confidence = round(0.92 * min(vibration_w, thickness_w, acoustic_w), 3)
    
    return RULPredictionResponse(
        jointId=data.jointId,
        riskScore=risk_score,
        estimatedTimeToFailureHours=rul_hours,
        estimatedTimeToFailureDays=rul_days,
        healthStatus=health_status,
        confidence=confidence,
        featureImportances=importances,
        recommendation=recommendation,
        isReliabilityWeighted=bool(weights)
    )
