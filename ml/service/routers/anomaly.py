"""
SmartConveyor - Anomaly Detection Router
SIH PS 26008: Isolation Forest Vibration & Thermal Anomaly Detection with Dump-Noise Filter
Endpoint: POST /detect-anomaly
"""

import os
import joblib
import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

router = APIRouter()

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "anomaly_model.pkl")
_anomaly_bundle = None

def get_anomaly_model():
    global _anomaly_bundle
    if _anomaly_bundle is None:
        if os.path.exists(MODEL_PATH):
            try:
                _anomaly_bundle = joblib.load(MODEL_PATH)
            except Exception as e:
                print(f"[!] Warning: Could not load Anomaly model from {MODEL_PATH}: {e}")
                _anomaly_bundle = None
    return _anomaly_bundle


class AnomalyCheckInput(BaseModel):
    vibrationRms: float = Field(..., description="Drive pulley / joint vibration in mm/s")
    jointTemperature: float = Field(default=48.0, description="Thermal core temperature in °C")
    dynamicLoadTph: float = Field(default=1800.0, description="Ore loading rate in t/h")
    acousticEmission: float = Field(default=40.0, description="High-frequency stress wave in dB")
    isDumping: bool = Field(default=False, description="Flagged true if chute ore dump occurred within the window")
    sensorReliabilityScore: Optional[float] = Field(default=100.0, description="Sensor reliability score from sensorReliability.js")


class AnomalyCheckResponse(BaseModel):
    isAnomaly: bool
    confidence: float
    anomalyType: str
    isDumpSuppressed: bool
    vibrationSeverity: str
    temperatureSeverity: str
    details: Dict[str, Any]


@router.post("/detect-anomaly", response_model=AnomalyCheckResponse)
async def detect_anomaly(data: AnomalyCheckInput):
    # Rule 1: DUMP FILTER SUPPRESSION (SIH PS 26008 explicit requirement)
    # If isDumping is true (hopper chute impact window), suppress vibration false positives!
    if data.isDumping:
        return AnomalyCheckResponse(
            isAnomaly=False,
            confidence=0.96,
            anomalyType="NONE_DUMP_FILTERED",
            isDumpSuppressed=True,
            vibrationSeverity="NORMAL_DUMP_IMPACT",
            temperatureSeverity="NORMAL",
            details={
                "message": "Vibration spike suppressed by Dump-Noise Filter (ore dump chute impact window active)",
                "rawVibration": data.vibrationRms,
                "dynamicLoad": data.dynamicLoadTph
            }
        )
        
    bundle = get_anomaly_model()
    is_anomaly = False
    confidence = 0.88
    anomaly_type = "NONE"
    
    # Check physical limit thresholds
    vib_sev = "NORMAL"
    if data.vibrationRms >= 8.5:
        vib_sev = "CRITICAL"
        is_anomaly = True
        anomaly_type = "SEVERE_MECHANICAL_VIBRATION_RUPTURE_RISK"
    elif data.vibrationRms >= 6.0:
        vib_sev = "WARNING"
        is_anomaly = True
        anomaly_type = "ELEVATED_VIBRATION_SPLICE_FATIGUE"
        
    temp_sev = "NORMAL"
    if data.jointTemperature >= 85.0:
        temp_sev = "CRITICAL"
        is_anomaly = True
        anomaly_type = "CRITICAL_THERMAL_OVERHEAT" if anomaly_type == "NONE" else f"{anomaly_type}_AND_THERMAL_OVERHEAT"
    elif data.jointTemperature >= 70.0:
        temp_sev = "WARNING"
        is_anomaly = True
        anomaly_type = "ELEVATED_TEMPERATURE" if anomaly_type == "NONE" else anomaly_type

    # If ML model loaded, run isolation forest inference
    if bundle is not None and "model" in bundle and not is_anomaly:
        try:
            X = np.array([[data.vibrationRms, data.dynamicLoadTph, data.jointTemperature, data.acousticEmission]])
            pred = bundle["model"].predict(X)[0] # -1 anomaly, 1 normal
            score = bundle["model"].decision_function(X)[0]
            
            if pred == -1:
                is_anomaly = True
                anomaly_type = "MULTIVARIATE_STATISTICAL_ANOMALY"
                confidence = round(min(0.99, max(0.60, float(-score * 2.5 + 0.5))), 3)
            else:
                confidence = round(min(0.98, max(0.70, float(score * 1.5 + 0.7))), 3)
        except Exception:
            pass
            
    # Adjust confidence by sensor reliability
    rel_factor = max(0.1, (data.sensorReliabilityScore or 100.0) / 100.0)
    confidence = round(confidence * rel_factor, 3)
    
    return AnomalyCheckResponse(
        isAnomaly=is_anomaly,
        confidence=confidence,
        anomalyType=anomaly_type,
        isDumpSuppressed=False,
        vibrationSeverity=vib_sev,
        temperatureSeverity=temp_sev,
        details={
            "vibrationRms": data.vibrationRms,
            "jointTemperature": data.jointTemperature,
            "acousticEmission": data.acousticEmission,
            "sensorReliabilityScore": data.sensorReliabilityScore
        }
    )
