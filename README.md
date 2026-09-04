# SmartConveyor: Intelligent Conveyor Belt Joint Rupture Monitoring & Predictive Maintenance System
> **Smart India Hackathon (SIH) Problem Statement 26008 — NMDC (National Mineral Development Corporation)**  
> **Mining Complex:** Bailadila Iron Ore Mine, Chhattisgarh (Kirandul Dep-14 & Bacheli Dep-11B)

---

## Executive Summary
SmartConveyor is an autonomous, full-stack predictive maintenance and continuous joint integrity monitoring system engineered for high-tonnage iron ore conveyor systems (e.g. ST-5400 and ST-6300 steel-cord belts hauling 2,400+ t/h).

Every screen is powered by **live real-time data streams** with zero hardcoded values, physics-informed data quality filters, multi-axis transducer anomaly detection, distance-triggered line-scan optical inspection, and Remaining Useful Life (RUL) regression.

---

## Key Technical Features & Algorithms

### 1. Physics-Informed Sensor Reliability Formula (`sensorReliability.js`)
Evaluates telemetry channels across harsh vibratory and high-dust mining environments using the exact SIH formula:
```
reliabilityScore = 0.35 × uptimeScore + 0.30 × stuckScore + 0.25 × rangeScore + 0.10 × jitterScore
```
- **≥ 85 (HEALTHY)**: Full `1.0x` weighting used in ML RUL inference.
- **50 – 84 (DEGRADED)**: Down-weighted proportionally by `(reliabilityScore / 100)`.
- **< 50 (FAULTY)**: Excluded completely from ML inference to prevent false emergency halts.

### 2. Dump-Vibration False Positive Filter (`dumpNoiseFilter.js`)
- Detects sudden surges in Dynamic Belt Load (> 25% increase in < 1.5s) caused by 80-ton haul truck and chute dumping.
- Flags `isDumping = true` for 4.5 seconds to suppress transient shock waves.
- Only forwards candidate vibration defects to the ML anomaly detector if:
  1. `isDumping === false`, AND
  2. The vibration pattern cyclically repeats at the joint harmonic passing frequency `f = beltSpeed / beltLength`.

### 3. Belt-Distance-Triggered Vision Capture & Frame Merger (`visionCaptureTrigger.js`)
- Integrates live belt tachometer speed to trigger optical line-scan cameras every fixed distance interval (`Δd = 50m`), rather than arbitrary fixed time.
- If the computer vision model classifies the same defect in 2+ consecutive frames on the same belt section, it automatically merges them into a single ongoing incident record.

### 4. 3D Digital Twin (`ConveyorScene.jsx`)
- Built with **Three.js** and interactive OrbitControls.
- Features procedural steel trusses, drive/tail pulleys, 3-roll troughing idler sets, moving rubber belt texture synchronized to live linear speed, and 6 interactive color-coded joint markers with pulsing warning rings.
- Raycaster click interaction opens deep joint splice diagnostics and RUL curves.

### 5. Plant Emergency Stop Interlocking System
- Real-time listener on `systemStatus/{facilityId}`.
- Global full-width persistent warning banner across all pages whenever `emergencyStopActive === true`.
- Secured admin clearance workflow requiring physical inspection justification remarks.

---

## Monorepo Layout

```
smartconveyor/
├── client/                                  # FRONTEND (React + Vite + Tailwind CSS + Three.js + Recharts)
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/                   # HealthRiskGauge, SensorCard, AlertFeed, TelemetryChart
│   │   │   ├── digital-twin/                # ConveyorScene, BeltMesh, JointMarker, useThreeScene
│   │   │   ├── vision/                      # LiveFeedPanel, AnalysisResultsPanel, RecentScansStrip
│   │   │   ├── sensor-health/               # SensorHealthGrid, ReliabilityHistoryPanel
│   │   │   ├── alerts/                      # AlertsTable (Connected to MongoDB)
│   │   │   ├── reports/                     # ReportsTable (Connected to MongoDB)
│   │   │   └── shared/                      # Navbar, Sidebar, PlantSelector, StatusBadge, EmergencyStopBanner
│   │   ├── pages/                           # 9 Screens: Login, Dashboard, DigitalTwin, Vision, SensorHealth, Alerts, Logs (MongoDB), Reports, Settings
│   │   ├── services/                        # api.js (Centralized MongoDB REST API Client)
│   │   ├── firebase/                        # config.js, firestore.js (Dedicated strictly to 20Hz live sensor telemetry)
│   │   └── hooks/                           # useSensorData (Firebase Live), useLogs (MongoDB), useJointHealth, useSensorReliability, useEmergencyStatus
├── server/                                  # BACKEND (Node.js + Express + MongoDB Mongoose)
│   ├── config/                              # db.js (MongoDB Connection Manager)
│   ├── models/                              # User.js, Log.js, Alert.js, JointHealth.js, VisionEvent.js, ReliabilityLog.js, Report.js, EmergencyStatus.js, FacilityConfig.js
│   ├── controllers/                         # authController, logsController, alertsController, jointsController, visionController, reliabilityController, reportsController, emergencyController, settingsController
│   ├── routes/                              # authRoutes, logsRoutes, alertsRoutes, jointsRoutes, visionRoutes, reliabilityRoutes, reportsRoutes, emergencyRoutes, settingsRoutes
│   ├── seed/                                # seedDatabase.js (Auto-populates MongoDB users, logs, alerts, reports, joints)
│   └── server.js                            # Express Server on Port 5000
├── ml/                                      # ML MICROSERVICE & OFFLINE TRAINING
│   ├── service/                             # FastAPI microservice on Cloud Run (POST /predict-rul, /detect-anomaly, /classify-image)
│   │   ├── models/                          # rul_model.pkl, anomaly_model.pkl, vision_model.pkl
│   │   └── main.py
│   └── training/                            # Offline training scripts and synthetic data generators
├── hardware/                                # PHYSICAL IoT HARDWARE FIRMWARE
│   ├── esp32/                               # smartconveyor_esp32_firmware.ino (Streams 6 sensors to Firebase Firestore)
│   └── raspberry_pi/                        # edge_gateway.py (Edge gateway publisher to Firebase)
└── shared/
    └── constants.js                         # Shared sensor schemas, thresholds, facility IDs
```

---

## Quickstart Guide

### 1. Install & Run MERN Backend Server (Express + MongoDB)
```bash
cd server
npm install
npm start
```
*Backend runs on [http://localhost:5000](http://localhost:5000) with auto-seeded MongoDB collections for logs, alerts, users, reports, and joints.*

### 2. Install Client Dependencies & Run Frontend (React + Vite)
```bash
cd client
npm install
npm run dev
```
*Frontend opens on [http://localhost:3000](http://localhost:3000) with Vite `/api` proxy connected to MongoDB backend and live Firebase IoT telemetry.*

### 3. Run ML Microservice (Optional / Cloud Run Standalone)
```bash
cd ml/service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 3. Run Standalone Node Simulator
```bash
cd server/functions
npm install
npm run simulate
```

---

## SIH PS 26008 Compliance Matrix

| Requirement | Implementation Component | File Path |
| :--- | :--- | :--- |
| **IoT Multi-Sensor Sensing** | 6 physical transducers (vibration, speed, load, temp, ultrasonic thickness, acoustic dB) | `shared/constants.js`, `sensorSimulator.js` |
| **Sensor Reliability Index** | 4-factor formula (Uptime 35%, Stuck 30%, Range 25%, Jitter 10%) | `server/functions/src/processing/sensorReliability.js` |
| **Dump-Vibration Filter** | Dynamic load spike rate-of-change + joint harmonic verification | `server/functions/src/processing/dumpNoiseFilter.js` |
| **Distance-Based Vision** | Linear displacement integration + consecutive frame merger | `server/functions/src/processing/visionCaptureTrigger.js` |
| **ML RUL Regression** | GradientBoosting / RandomForest Remaining Useful Life estimation | `ml/service/routers/predictive.py` |
| **3D Digital Twin** | Three.js procedural conveyor belt with raycasting joint inspector | `client/src/components/digital-twin/ConveyorScene.jsx` |
| **Emergency Interlock** | Global persistent siren banner + Admin safety release console | `client/src/components/shared/EmergencyStopBanner.jsx`, `Settings.jsx` |
