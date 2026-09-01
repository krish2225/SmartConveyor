/**
 * SmartConveyor - SIH Problem Statement 26008 (NMDC Iron Ore Mining)
 * Module: Continuous Real-Time Sensor & Vision Telemetry Simulator
 * File: server/functions/src/simulators/sensorSimulator.js
 * 
 * Logic & SIH Context:
 * Generates continuous physics-accurate telemetry matching high-tonnage NMDC iron ore conveyor lines
 * (e.g. CV-101 at Deposit 14 Kirandul Complex).
 * 
 * Simulates:
 * - 6 physical joint splices circulating around a 1200m belt loop.
 * - Tri-axial drive vibration with occasional harmonic spikes on worn joints.
 * - Periodic hopper chute ore dumping cycles (load surges up to 2500 t/h).
 * - Joint ultrasonic thickness scans (Joint-01 to Joint-06) with realistic wear profiles.
 * - Acoustic stress wave emissions and thermal hot spots.
 * - Belt-distance-triggered line-scan camera events with simulated defect frames.
 */

import { FACILITY_CONFIGS, SENSOR_TYPES, JOINT_STATUS, ALERT_SEVERITY, VISION_DEFECT_CLASSES } from '../../../../shared/constants.js';
import { handleSensorWrite } from '../triggers/onSensorWrite.js';
import { handleVisionCapture } from '../triggers/onVisionEvent.js';
import { createAlertDocument } from '../triggers/onCriticalAlert.js';

export class ConveyorSimulationEngine {
  constructor({
    facilityId = 'nmdc-kirandul-cv101',
    updateIntervalMs = 1500,
    onTelemetryUpdate = null,
    onJointUpdate = null,
    onVisionUpdate = null,
    onAlertUpdate = null,
    onReliabilityUpdate = null,
    firestoreDb = null
  } = {}) {
    this.facilityId = facilityId;
    this.config = FACILITY_CONFIGS[facilityId] || FACILITY_CONFIGS['nmdc-kirandul-cv101'];
    this.updateIntervalMs = updateIntervalMs;
    this.firestoreDb = firestoreDb;

    // Callbacks for live UI or Cloud Function integration
    this.onTelemetryUpdate = onTelemetryUpdate;
    this.onJointUpdate = onJointUpdate;
    this.onVisionUpdate = onVisionUpdate;
    this.onAlertUpdate = onAlertUpdate;
    this.onReliabilityUpdate = onReliabilityUpdate;

    this.timer = null;
    this.isRunning = false;
    this.tickCount = 0;

    // Physical simulation state
    this.beltDisplacementMeters = 0.0;
    this.beltSpeedMps = this.config.nominalSpeedMps; // 4.2 m/s
    this.isDumping = false;
    this.dumpCountdownTicks = 0;

    // Joint Splice state (6 physical joints distributed evenly along the 1200m belt)
    this.joints = [
      { id: 'Joint-01', positionMeters: 0, status: JOINT_STATUS.OPTIMAL, thicknessMm: 25.2, wearProgress: 0.12, baseTemp: 44.0, baseVib: 2.1, cycleCount: 14200, installDate: '2025-11-10' },
      { id: 'Joint-02', positionMeters: 200, status: JOINT_STATUS.OPTIMAL, thicknessMm: 24.8, wearProgress: 0.18, baseTemp: 45.5, baseVib: 2.3, cycleCount: 13800, installDate: '2025-11-25' },
      { id: 'Joint-03', positionMeters: 400, status: JOINT_STATUS.ELEVATED_WEAR, thicknessMm: 19.4, wearProgress: 0.58, baseTemp: 58.0, baseVib: 5.4, cycleCount: 28400, installDate: '2025-05-14' },
      { id: 'Joint-04', positionMeters: 600, status: JOINT_STATUS.OPTIMAL, thicknessMm: 25.6, wearProgress: 0.08, baseTemp: 42.0, baseVib: 1.9, cycleCount: 8200, installDate: '2026-02-01' },
      { id: 'Joint-05', positionMeters: 800, status: JOINT_STATUS.CRITICAL_DELAMINATION, thicknessMm: 14.8, wearProgress: 0.88, baseTemp: 74.0, baseVib: 7.8, cycleCount: 42100, installDate: '2024-08-20' },
      { id: 'Joint-06', positionMeters: 1000, status: JOINT_STATUS.OPTIMAL, thicknessMm: 24.1, wearProgress: 0.22, baseTemp: 46.0, baseVib: 2.6, cycleCount: 16500, installDate: '2025-10-05' }
    ];

    // History circular buffers for jitter and reliability calculations
    this.historyBuffers = {
      [SENSOR_TYPES.DRIVE_VIBRATION]: [],
      [SENSOR_TYPES.BELT_SPEED]: [],
      [SENSOR_TYPES.DYNAMIC_LOAD]: [],
      [SENSOR_TYPES.JOINT_TEMPERATURE]: [],
      [SENSOR_TYPES.ULTRASONIC_THICKNESS]: [],
      [SENSOR_TYPES.ACOUSTIC_EMISSION]: []
    };

    this.stuckDurations = {
      [SENSOR_TYPES.DRIVE_VIBRATION]: 0,
      [SENSOR_TYPES.BELT_SPEED]: 0,
      [SENSOR_TYPES.DYNAMIC_LOAD]: 0,
      [SENSOR_TYPES.JOINT_TEMPERATURE]: 0,
      [SENSOR_TYPES.ULTRASONIC_THICKNESS]: 0,
      [SENSOR_TYPES.ACOUSTIC_EMISSION]: 0
    };

    this.activeJointIndex = 0;
    this.recentScansList = [];
    this.recentAlertsList = [];
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.timer = setInterval(() => this.step(), this.updateIntervalMs);
    console.log(`[SmartConveyor Simulator] Started telemetry engine for ${this.facilityId} (interval: ${this.updateIntervalMs}ms)`);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log(`[SmartConveyor Simulator] Stopped telemetry engine for ${this.facilityId}`);
  }

  step() {
    this.tickCount++;
    const dt = this.updateIntervalMs / 1000.0;

    // 1. Advance Belt Displacement (Δd = v * dt)
    this.beltDisplacementMeters = (this.beltDisplacementMeters + this.beltSpeedMps * dt) % this.config.beltLengthMeters;

    // 2. Identify Joint currently passing the Drive Pulley / Inspection Station
    let closestJoint = this.joints[0];
    let minDistance = Infinity;
    this.joints.forEach((joint, idx) => {
      const dist = Math.abs(this.beltDisplacementMeters - joint.positionMeters);
      if (dist < minDistance) {
        minDistance = dist;
        closestJoint = joint;
        this.activeJointIndex = idx;
      }
    });

    const isJointAtStation = minDistance < 25.0;

    // 3. Periodic Ore Dumping Chute Simulation (every 24-30 ticks)
    if (this.tickCount % 26 === 0 && !this.isDumping) {
      this.isDumping = true;
      this.dumpCountdownTicks = 4; // active for ~6 seconds
    } else if (this.isDumping) {
      this.dumpCountdownTicks--;
      if (this.dumpCountdownTicks <= 0) {
        this.isDumping = false;
      }
    }

    // 4. Synthesize Physical Telemetry Values
    let dynamicLoad = 1800 + Math.sin(this.tickCount * 0.15) * 180 + (Math.random() - 0.5) * 40;
    let driveVibration = 2.2 + (Math.random() - 0.5) * 0.3;
    let jointTemp = 44.0 + (Math.random() - 0.5) * 1.0;
    let ultrasonicThickness = 24.5;
    let acousticEmission = 38.0 + (Math.random() - 0.5) * 2.5;

    // If ore dump is active, load and transient vibration surge
    if (this.isDumping) {
      dynamicLoad += 680 + (Math.random() * 150); // Surge to ~2550 t/h
      driveVibration += 3.8 + (Math.random() * 1.2); // Transient chute impact shock
    }

    // If a worn joint is passing the station, induce joint-specific anomalies
    if (isJointAtStation) {
      driveVibration += (closestJoint.baseVib - 2.0);
      jointTemp = closestJoint.baseTemp + (Math.random() - 0.5) * 1.5;
      ultrasonicThickness = closestJoint.thicknessMm + (Math.random() - 0.5) * 0.2;
      if (closestJoint.status === JOINT_STATUS.CRITICAL_DELAMINATION) {
        acousticEmission = 76.0 + (Math.random() * 8.0);
        driveVibration = Math.max(driveVibration, 7.8 + Math.random() * 1.2);
      } else if (closestJoint.status === JOINT_STATUS.ELEVATED_WEAR) {
        acousticEmission = 58.0 + (Math.random() * 5.0);
      }
    }

    // Speed fluctuation with load torque
    const loadFactor = Math.min(1.1, Math.max(0.9, 1.0 - (dynamicLoad - 1800) / 15000));
    this.beltSpeedMps = Number((this.config.nominalSpeedMps * loadFactor + (Math.random() - 0.5) * 0.05).toFixed(2));

    // Round values
    const currentSensors = {
      [SENSOR_TYPES.DRIVE_VIBRATION]: Number(Math.max(0.1, driveVibration).toFixed(2)),
      [SENSOR_TYPES.BELT_SPEED]: this.beltSpeedMps,
      [SENSOR_TYPES.DYNAMIC_LOAD]: Number(Math.max(0, dynamicLoad).toFixed(1)),
      [SENSOR_TYPES.JOINT_TEMPERATURE]: Number(jointTemp.toFixed(1)),
      [SENSOR_TYPES.ULTRASONIC_THICKNESS]: Number(ultrasonicThickness.toFixed(1)),
      [SENSOR_TYPES.ACOUSTIC_EMISSION]: Number(acousticEmission.toFixed(1))
    };

    // Update history buffers
    for (const [key, val] of Object.entries(currentSensors)) {
      if (!this.historyBuffers[key]) this.historyBuffers[key] = [];
      this.historyBuffers[key].push(val);
      if (this.historyBuffers[key].length > 20) this.historyBuffers[key].shift();
    }

    // 5. Build Telemetry Snapshot Packet
    const timestamp = new Date().toISOString();
    const telemetrySnapshot = {
      facilityId: this.facilityId,
      timestamp,
      sensors: currentSensors,
      activeJointId: closestJoint.id,
      beltDisplacementMeters: Number(this.beltDisplacementMeters.toFixed(1)),
      isDumping: this.isDumping,
      isJointAtStation
    };

    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate(telemetrySnapshot);
    }

    // 6. Handle Cloud Function processing (Reliability, ML RUL, Anomaly)
    handleSensorWrite(
      this.facilityId,
      {
        jointId: closestJoint.id,
        drive_vibration: currentSensors[SENSOR_TYPES.DRIVE_VIBRATION],
        belt_speed: currentSensors[SENSOR_TYPES.BELT_SPEED],
        dynamic_load: currentSensors[SENSOR_TYPES.DYNAMIC_LOAD],
        joint_temperature: currentSensors[SENSOR_TYPES.JOINT_TEMPERATURE],
        ultrasonic_thickness: currentSensors[SENSOR_TYPES.ULTRASONIC_THICKNESS],
        acoustic_emission: currentSensors[SENSOR_TYPES.ACOUSTIC_EMISSION],
        historyBuffers: this.historyBuffers,
        stuckDurations: this.stuckDurations
      },
      this.firestoreDb
    ).then(res => {
      if (this.onReliabilityUpdate && res.sensorReliabilityUpdate) {
        this.onReliabilityUpdate(res.sensorReliabilityUpdate);
      }
      if (this.onJointUpdate && res.jointHealthUpdate) {
        this.onJointUpdate(res.jointHealthUpdate);
      }
    }).catch(() => {});

    // 7. Distance-Triggered Vision Capture Event (every ~10-15 ticks)
    if (this.tickCount % 12 === 0) {
      let defectMode = 'NORMAL';
      let syntheticFeatures = { edge_gradient: 14.0, color_variance: 9.0, texture_entropy: 4.2, aspect_ratio: 1.0, thermal_peak: 46.0 };

      // Induce defect if near critical joint
      if (closestJoint.status === JOINT_STATUS.CRITICAL_DELAMINATION && isJointAtStation) {
        defectMode = 'SPLICE_SEPARATION';
        syntheticFeatures = { edge_gradient: 78.0, color_variance: 58.0, texture_entropy: 8.4, aspect_ratio: 0.35, thermal_peak: 75.0 };
      } else if (this.tickCount % 48 === 0) {
        defectMode = 'LONGITUDINAL_TEAR';
        syntheticFeatures = { edge_gradient: 88.0, color_variance: 48.0, texture_entropy: 7.9, aspect_ratio: 6.8, thermal_peak: 54.0 };
      }

      handleVisionCapture(
        this.facilityId,
        {
          frameId: `SCAN-FRM-${1000 + this.tickCount}`,
          beltDistanceMeters: Number(this.beltDisplacementMeters.toFixed(1)),
          syntheticFeatures
        },
        this.firestoreDb
      ).then(visionEvent => {
        if (this.onVisionUpdate && visionEvent) {
          this.onVisionUpdate(visionEvent);
        }
      }).catch(() => {});
    }

    // 8. Generate Alerts on critical events
    if (closestJoint.status === JOINT_STATUS.CRITICAL_DELAMINATION && isJointAtStation && this.tickCount % 15 === 0) {
      createAlertDocument(
        this.facilityId,
        {
          title: `Critical Splice Degradation: ${closestJoint.id}`,
          description: `Ultrasonic thickness measured at ${currentSensors[SENSOR_TYPES.ULTRASONIC_THICKNESS]} mm (< 15.0 mm limit). Severe delamination risk.`,
          severity: ALERT_SEVERITY.CRITICAL,
          source: 'Ultrasonic Array & ML RUL',
          jointId: closestJoint.id,
          actionRequired: 'Initiate emergency stop or inspect splice during next haul lull.'
        },
        this.firestoreDb
      ).then(alertDoc => {
        if (this.onAlertUpdate && alertDoc) {
          this.onAlertUpdate(alertDoc);
        }
      }).catch(() => {});
    }

    return telemetrySnapshot;
  }
}

// Standalone execution entrypoint
if (typeof process !== 'undefined' && process.argv?.[1]?.includes('sensorSimulator.js')) {
  const engine = new ConveyorSimulationEngine({
    updateIntervalMs: 2000,
    onTelemetryUpdate: data => {
      console.log(`[TELEMETRY] ${data.timestamp} | Spd: ${data.sensors.belt_speed}m/s | Load: ${data.sensors.dynamic_load}t/h | Vib: ${data.sensors.drive_vibration}mm/s | Dump: ${data.isDumping} | Joint: ${data.activeJointId}`);
    }
  });
  engine.start();
}
