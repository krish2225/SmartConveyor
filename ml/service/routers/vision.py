"""
SmartConveyor - Vision Monitoring & Defect Classification Router
SIH PS 26008: High-Speed Line-Scan Computer Vision Defect Detection
Endpoint: POST /classify-image
"""

import os
import joblib
import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

router = APIRouter()

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "vision_model.pkl")
_vision_bundle = None

def get_vision_model():
    global _vision_bundle
    if _vision_bundle is None:
        if os.path.exists(MODEL_PATH):
            try:
                _vision_bundle = joblib.load(MODEL_PATH)
            except Exception as e:
                print(f"[!] Warning: Could not load Vision model from {MODEL_PATH}: {e}")
                _vision_bundle = None
    return _vision_bundle


class BoundingBox(BaseModel):
    x: float = Field(..., description="Normalized x coordinate (0.0 to 1.0)")
    y: float = Field(..., description="Normalized y coordinate (0.0 to 1.0)")
    width: float = Field(..., description="Normalized width")
    height: float = Field(..., description="Normalized height")
    label: str
    confidence: float


class DefectParameters(BaseModel):
    crackLengthMm: float
    tearWidthMm: float
    surfaceAreaDamagedMm2: float
    severityLevel: str
    affectedCordLayer: str
    thermalHotspotTempC: Optional[float] = None


class ImageClassificationInput(BaseModel):
    imageRef: Optional[str] = Field(default=None, description="Cloud Storage URL or Base64 frame representation")
    frameId: str = Field(default="FRM-99201", description="Line-scan camera sequential frame ID")
    beltDistanceMeters: float = Field(default=450.0, description="Belt linear position counter in meters")
    syntheticFeatures: Optional[Dict[str, float]] = Field(default=None, description="Pre-extracted computer vision edge & texture gradients")


class ImageClassificationResponse(BaseModel):
    frameId: str
    beltDistanceMeters: float
    classification: str
    isDefect: bool
    confidence: float
    severity: str
    boundingBoxes: List[BoundingBox]
    defectParameters: DefectParameters
    recommendedAction: str


@router.post("/classify-image", response_model=ImageClassificationResponse)
async def classify_image(data: ImageClassificationInput):
    bundle = get_vision_model()
    
    # Feature extraction simulation or model prediction
    features = data.syntheticFeatures or {}
    edge_grad = features.get("edge_gradient", 15.0)
    color_var = features.get("color_variance", 10.0)
    entropy = features.get("texture_entropy", 4.5)
    aspect_ratio = features.get("aspect_ratio", 1.0)
    thermal_peak = features.get("thermal_peak", 46.0)
    
    classification = "Normal Belt Surface"
    is_defect = False
    confidence = 0.94
    severity = "NOMINAL"
    bboxes = []
    
    crack_len = 0.0
    tear_width = 0.0
    damaged_area = 0.0
    affected_layer = "Top Cover Rubber Only"
    thermal_temp = thermal_peak if thermal_peak > 55.0 else None
    
    # If ML bundle is available, run inference
    if bundle is not None and "classifier" in bundle:
        try:
            X = np.array([[edge_grad, color_var, entropy, aspect_ratio, thermal_peak]])
            pred_idx = int(bundle["classifier"].predict(X)[0])
            probs = bundle["classifier"].predict_proba(X)[0]
            confidence = round(float(probs[pred_idx]), 3)
            
            cls_name = bundle["classes"][pred_idx]
            classification = cls_name
            
            if pred_idx != 0:
                is_defect = True
                reg_out = bundle["regressor"].predict(X)[0]
                bx, by, bw, bh, d_len, d_w = reg_out
                
                crack_len = max(0.0, float(d_len))
                tear_width = max(0.0, float(d_w))
                damaged_area = round(crack_len * tear_width, 1)
                
                bboxes.append(BoundingBox(
                    x=round(max(0.05, min(0.85, float(bx))), 3),
                    y=round(max(0.05, min(0.85, float(by))), 3),
                    width=round(max(0.08, min(0.90, float(bw))), 3),
                    height=round(max(0.08, min(0.90, float(bh))), 3),
                    label=classification,
                    confidence=confidence
                ))
        except Exception as e:
            print(f"[!] Vision inference error: {e}")
            
    # Rule based mapping if normal or fallback
    if not is_defect:
        # Check rule thresholds
        if edge_grad > 70.0 and aspect_ratio > 4.0:
            classification = "Longitudinal Rip / Tear"
            is_defect = True
            severity = "CRITICAL"
            crack_len = 780.0
            tear_width = 42.0
            damaged_area = crack_len * tear_width
            affected_layer = "Steel Cord Carcass Penetration"
            bboxes.append(BoundingBox(x=0.45, y=0.15, width=0.12, height=0.72, label="Longitudinal Rip", confidence=0.96))
        elif edge_grad > 60.0 and aspect_ratio < 0.6:
            classification = "Splice Joint Delamination / Pull-out"
            is_defect = True
            severity = "CRITICAL"
            crack_len = 1150.0
            tear_width = 58.0
            damaged_area = crack_len * tear_width
            affected_layer = "Splice Step Vulcanized Bond"
            bboxes.append(BoundingBox(x=0.12, y=0.42, width=0.76, height=0.18, label="Splice Delamination", confidence=0.92))
        elif edge_grad > 40.0:
            classification = "Heavy Transverse Surface Crack"
            is_defect = True
            severity = "WARNING"
            crack_len = 380.0
            tear_width = 16.0
            damaged_area = crack_len * tear_width
            affected_layer = "Top Cover Rubber"
            bboxes.append(BoundingBox(x=0.28, y=0.34, width=0.44, height=0.14, label="Transverse Crack", confidence=0.89))
        elif thermal_peak > 80.0:
            classification = "Localized Hot Spot Overheating"
            is_defect = True
            severity = "CRITICAL"
            crack_len = 220.0
            tear_width = 220.0
            damaged_area = 48400.0
            affected_layer = "Core Rubber & Idler Friction"
            bboxes.append(BoundingBox(x=0.35, y=0.35, width=0.30, height=0.30, label="Thermal Hotspot", confidence=0.95))
            
    if is_defect:
        if "Rip" in classification or "Delamination" in classification or severity == "CRITICAL":
            severity = "CRITICAL"
            action = "Immediate Emergency Stop recommended. Deploy splice maintenance crew to position."
        else:
            severity = "WARNING"
            action = "Log defect in maintenance queue. Schedule visual re-inspection during next shift change."
    else:
        severity = "NOMINAL"
        action = "Belt surface integrity normal. Continue line scanning."

    return ImageClassificationResponse(
        frameId=data.frameId,
        beltDistanceMeters=data.beltDistanceMeters,
        classification=classification,
        isDefect=is_defect,
        confidence=confidence,
        severity=severity,
        boundingBoxes=bboxes,
        defectParameters=DefectParameters(
            crackLengthMm=round(crack_len, 1),
            tearWidthMm=round(tear_width, 1),
            surfaceAreaDamagedMm2=round(damaged_area, 1),
            severityLevel=severity,
            affectedCordLayer=affected_layer,
            thermalHotspotTempC=thermal_temp
        ),
        recommendedAction=action
    )
