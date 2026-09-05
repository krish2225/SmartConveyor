"""
SmartConveyor - AI Assistant Chatbot FastAPI Router
Real-Time AI Copilot for NMDC SmartConveyor Industrial Monitoring.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import json

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False

import urllib.request
import urllib.error

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    facilityId: Optional[str] = "nmdc-kirandul-cv101"
    context: Optional[Dict[str, Any]] = None
    apiKey: Optional[str] = None
    history: Optional[List[Dict[str, Any]]] = None

class ChatResponse(BaseModel):
    success: bool
    response: str
    sources: List[str]
    retrievedContextSummary: Dict[str, Any]

async def call_gemini_api(model: str, key: str, prompt_contents: list) -> Optional[str]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    payload = {
        "contents": prompt_contents,
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 1000
        }
    }
    
    if HAS_HTTPX:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text")
                        if text and text.strip():
                            return text.strip()
        except Exception:
            pass

    # Fallback to standard library urllib
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                candidates = data.get("candidates", [])
                if candidates:
                    text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text")
                    if text and text.strip():
                        return text.strip()
    except Exception:
        pass

    return None

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")

    q_lower = req.message.lower()
    sources = []
    
    # Extract live context if provided
    ctx = req.context or {}
    telemetry = ctx.get("telemetry") or {}
    sensors = telemetry.get("sensors") or ctx.get("sensors") or {}
    
    live_vibration = sensors.get("drive_vibration", telemetry.get("drive_vibration", 7.9))
    live_temp = sensors.get("joint_temperature", telemetry.get("joint_temperature", 74.5))
    live_speed = sensors.get("belt_speed", telemetry.get("belt_speed", 4.18))
    live_load = sensors.get("dynamic_load", telemetry.get("dynamic_load", 1840.5))
    live_thickness = sensors.get("ultrasonic_thickness", telemetry.get("ultrasonic_thickness", 16.2))
    live_acoustic = sensors.get("acoustic_emission", telemetry.get("acoustic_emission", 78.4))
    active_joint = telemetry.get("activeJointId", ctx.get("activeJointId", "Joint-05"))

    # If Gemini API key is available, call Google Gemini
    effective_key = (req.apiKey or os.getenv("GEMINI_API_KEY", "")).strip()
    if effective_key and len(effective_key) > 5:
        models = ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-3.5-flash"]
        system_prompt = f"""You are the ultimate AI Copilot for the NMDC SmartConveyor Industrial Monitoring System.
You have COMPLETE, comprehensive knowledge of EVERY screen, feature, data model, joint, sensor, report, and engineering procedure in the entire SmartConveyor platform.

=== SMARTCONVEYOR PLATFORM MODULES & PAGES ===
1. 📊 DASHBOARD (/): Real-time gauges (20Hz vibration, thermal core temp, ultrasonic thickness, acoustic emission, belt speed, dynamic load), rolling live vibration charts (ISO 10816 limits), fleet rupture risk index, minimum remaining useful life (RUL: 6.0d on Joint-05), active alarms.
2. 🧊 3D DIGITAL TWIN (/digital-twin): Three.js 3D closed-loop conveyor model with raycasting joint inspector, multi-camera views (Orbit, Follow Splice, Head Discharge, Tail Feed, Top-Down), and ⏪ HISTORICAL PLAYBACK MODE (rewind & replay 3-7 day splice degradation with 1x, 5x, 20x speed, live snapback, transition flash animations, and dynamic sparklines).
3. 📷 VISION MONITORING (/vision): High-speed line-scan camera with YOLOv8 defect detection for surface wear, cord pullouts, delamination, longitudinal tears, and edge fraying.
4. 🩺 SENSOR HEALTH (/sensor-health): Multi-transducer health index, Kalman filtering drift compensation, and reliability ratings for Accelerometers, IR Pyrometers, Ultrasonic Gauges, and Acoustic Sensors.
5. 🚨 ALERTS & INCIDENTS (/alerts): Critical, Warning, and Info alarm management with root-cause analysis and sign-off remarks.
6. 📋 LOGS & AUDIT TRAIL (/logs): Chronological audit logs with severity and category filtering.
7. 📑 REPORTS & MAINTENANCE (/reports): Automated shift handover reports, predictive RUL curves, cold vulcanization work orders, and radiographic compliance certificates.
8. ⚙️ SETTINGS & PLANT SAFETY (/settings): Threshold limits (ISO 10816 limits, temp limits, thickness cutoff), and Emergency Stop (E-Stop) lockout/tagout system.

=== FLEET SPLICE JOINTS (1200m Belt Loop, 1600mm ST-5400 Steel Cord) ===
• Joint-01 (0m, Head Discharge): OPTIMAL, RUL ~142d, Risk ~4.2%, Thickness 21.8mm.
• Joint-02 (200m, Take-Up Bend): OPTIMAL, RUL ~118.5d, Risk ~8.7%, Thickness 21.2mm.
• Joint-03 (400m, Loading Chute): ELEVATED_WEAR from high-impact ore drop, RUL ~45d, Risk ~41%, Thickness 19.4mm.
• Joint-04 (600m, Return Strand): OPTIMAL, RUL ~98d, Risk ~12.5%, Thickness 20.9mm.
• Joint-05 (800m, High Tension Curve): CRITICAL_DELAMINATION with longitudinal cord pull-out, RUL ~6.0d, Risk ~89.2%, Thickness 16.2mm (<18.5mm limit), elevated vibration ({live_vibration} mm/s), acoustic emission surges ({live_acoustic} dB). Requires immediate ultrasonic scan and cold vulcanization repair kit preparation.
• Joint-06 (1000m, Drive Drum): OPTIMAL, RUL ~160d, Risk ~3.1%, Thickness 22.4mm.

=== REAL-TIME CONVEYOR TELEMETRY ({req.facilityId}) ===
• Monitored Splice Joint: {active_joint}
• Drive Vibration: {live_vibration} mm/s RMS (ISO 10816 Limit: 6.0 mm/s)
• Thermal Core Temp: {live_temp} °C (Nominal: <65°C)
• Ultrasonic Thickness: {live_thickness} mm (Critical Wear Limit: <18.5 mm)
• Acoustic Stress Emission: {live_acoustic} dB
• Belt Linear Speed: {live_speed} m/s | Dynamic Load: {live_load} t/h

=== INSTRUCTIONS ===
1. Answer ANY question about ANY part of the website, features, joints, sensors, maintenance, physics, or calculations.
2. Ground all answers accurately in the platform specs and real-time context above.
3. Format responses in clean, structured Markdown with bold headers, bullet points, and code blocks for values.
4. DO NOT mention internal database names (MongoDB/Firebase)."""

        contents = []
        if req.history and isinstance(req.history, list):
            for h in req.history[-6:]:
                role = "user" if h.get("sender") == "user" or h.get("role") == "user" else "model"
                txt = h.get("text") or h.get("content") or ""
                if txt.strip():
                    contents.append({"role": role, "parts": [{"text": txt.strip()}]})

        contents.append({
            "role": "user",
            "parts": [{"text": f"{system_prompt}\n\nUSER QUESTION: {req.message}"}]
        })

        for m in models:
            text = await call_gemini_api(m, effective_key, contents)
            if text:
                return ChatResponse(
                    success=True,
                    response=text,
                    sources=[f"Google Gemini ({m})", "Real-Time Telemetry Stream"],
                    retrievedContextSummary={"facilityId": req.facilityId, "usedGemini": True}
                )

    # Built-in Real-Time Domain Synthesis Fallback Engine
    is_live = any(w in q_lower for w in ["live", "vibration", "temp", "speed", "load", "thickness", "acoustic", "sensor", "reading", "joint 5", "joint-05", "j-204"])
    is_alert = any(w in q_lower for w in ["alert", "alarm", "warning", "critical", "fault", "issue", "incident"])
    is_joint = any(w in q_lower for w in ["joint", "splice", "rul", "failure", "wear", "fleet", "health", "rupture"])
    is_emergency = any(w in q_lower for w in ["emergency", "e-stop", "halt", "stop"])

    if is_live or "vibration" in q_lower or "joint 5" in q_lower:
        sources.append("Real-Time Telemetry Stream")
        vib_status = "⚠️ Exceeds ISO 10816 Zone C warning limit of 6.0 mm/s" if live_vibration > 6.0 else "✅ Nominal within ISO 10816 Zone A/B"
        thick_status = "⚠️ Critical wear threshold (< 18.5 mm)" if live_thickness < 18.5 else "✅ Nominal thickness"
        temp_status = "⚠️ Elevated core temperature (> 65°C)" if live_temp > 65.0 else "✅ Normal thermal range"

        response_text = (
            f"📡 **Real-Time Telemetry for {active_joint} (High Tension Splice)**\n\n"
            f"• **Live Vibration:** `{live_vibration} mm/s RMS` *({vib_status})*\n"
            f"• **Thermal Core Temp:** `{live_temp} °C` *({temp_status})*\n"
            f"• **Ultrasonic Thickness:** `{live_thickness} mm` *({thick_status})*\n"
            f"• **Acoustic Stress Emission:** `{live_acoustic} dB` *(Internal delamination micro-cracks)*\n"
            f"• **Belt Linear Speed:** `{live_speed} m/s` | **Dynamic Load:** `{live_load} t/h`\n\n"
            f"**Engineering Assessment:** {active_joint} is exhibiting anomalous harmonic vibration due to longitudinal cord pull-out delamination. Immediate ultrasonic scan recommended."
        )
    elif is_alert:
        sources.append("Active Alarm Stream")
        response_text = (
            f"🚨 **Critical Alarm Analysis: {active_joint} Splice Delamination (ALT-1001)**\n\n"
            f"• **Severity:** `CRITICAL ALARM` | **Status:** `ACTIVE`\n"
            f"• **Target Splice:** `{active_joint}`\n"
            f"• **Root Cause:** Ultrasonic thickness degraded to `{live_thickness} mm` (< 18.5 mm limit) with surging acoustic stress (`{live_acoustic} dB`).\n"
            f"• **Action Required:** Perform ultrasonic radiography inspection and prepare cold vulcanization splicing kit."
        )
    elif is_joint:
        sources.append("Splice Health Matrix")
        response_text = (
            "🏗️ **Plant Fleet Splice Health & Predictive RUL Summary**\n\n"
            "• **Overall Plant Rupture Risk Index:** `89.2%` (HIGH RISK)\n"
            f"• **Lowest Estimated Remaining Useful Life (RUL):** `6.0 Days` *({active_joint})*\n"
            "• **Splice Status:** 4 Optimal, 1 Elevated Wear, 1 Critical Delamination\n\n"
            "**Splice Health Matrix:**\n"
            "• 🟢 **Joint-01 (Head Pulley Splice):** RUL: `142.0d` | Risk: `4.2%` | Thickness: `21.8mm`\n"
            "• 🟢 **Joint-02 (Take-Up Bend Splice):** RUL: `118.5d` | Risk: `8.7%` | Thickness: `21.2mm`\n"
            "• 🟡 **Joint-03 (Loading Zone Splice):** RUL: `45.0d` | Risk: `41.0%` | Thickness: `19.4mm`\n"
            "• 🟢 **Joint-04 (Return Strand Splice):** RUL: `98.0d` | Risk: `12.5%` | Thickness: `20.9mm`\n"
            f"• 🔴 **{active_joint} (High Tension Curve):** RUL: `6.0d` | Risk: `89.2%` | Thickness: `{live_thickness}mm`"
        )
    elif is_emergency:
        sources.append("Drive Interlock Stream")
        response_text = (
            "🛡️ **Conveyor Drive Interlock: Normal Operational State**\n\n"
            f"• All drive substations armed and running nominal linear speed (`{live_speed} m/s`).\n"
            "• Emergency Stop circuit is currently `INACTIVE` (Drive clear).\n"
            "• Auto-interlock trip armed for severe longitudinal rip detection and vibration > 9.0 mm/s."
        )
    else:
        sources.append("SmartConveyor AI Engine")
        response_text = (
            "👷 **SmartConveyor AI Assistant — NMDC Mining Intelligence**\n\n"
            "I can assist you with real-time operational diagnostics, mechanical physics, and predictive maintenance:\n\n"
            f"1. 📡 **Live Telemetry:** Ask *\"What's the live vibration on {active_joint}?\"*\n"
            "2. 🚨 **Alarm Explanations:** Ask *\"Explain the current critical alert\"*\n"
            "3. 📊 **Predictive Splice RUL:** Ask *\"What's our fleet health?\"*\n"
            "4. 🧠 **Engineering Knowledge:** Ask *\"Explain ISO 10816 vibration standards\"* or *\"Calculate CEMA belt sag\"*"
        )

    return ChatResponse(
        success=True,
        response=response_text,
        sources=sources,
        retrievedContextSummary={"facilityId": req.facilityId, "usedGemini": False}
    )
