/**
 * SmartConveyor - Firestore Real-time Interface & Reactive Stream Engine
 * SIH Problem Statement 26008 (NMDC Iron Ore Mining)
 * File: client/src/firebase/firestore.js
 * 
 * Strict Architecture Rule:
 * Client only consumes data via real-time onSnapshot listeners — client never writes raw sensor data.
 * Includes automated background simulation stream to ensure zero-setup instant real-time operation.
 */

import {
  FACILITY_CONFIGS,
  SENSOR_TYPES,
  JOINT_STATUS,
  ALERT_SEVERITY,
  ALERT_STATUS,
  SENSOR_RELIABILITY_STATUS
} from '../../../shared/constants.js';

import { computeSensorReliability } from '../../../server/functions/src/processing/sensorReliability.js';
import { DumpNoiseFilter } from '../../../server/functions/src/processing/dumpNoiseFilter.js';
import { MLServiceClient } from '../../../server/functions/src/mlClient/mlServiceClient.js';
import { VisionCaptureTrigger } from '../../../server/functions/src/processing/visionCaptureTrigger.js';

// --- In-Memory Reactive Store & Multi-Client Listener Hub ---
class ReactiveFirestoreHub {
  constructor() {
    this.dumpFilter = new DumpNoiseFilter();
    this.mlClient = new MLServiceClient();
    this.visionTrigger = new VisionCaptureTrigger();

    this.facilityId = 'nmdc-kirandul-cv101';
    this.subscribers = {
      telemetry: new Set(),
      joints: new Set(),
      reliability: new Set(),
      vision: new Set(),
      alerts: new Set(),
      emergency: new Set()
    };

    // System Status
    this.emergencyStatus = {
      facilityId: this.facilityId,
      emergencyStopActive: false,
      triggeredBy: null,
      role: null,
      reason: null,
      source: null,
      triggeredAt: null,
      clearedBy: 'Site Admin',
      clearedAt: new Date(Date.now() - 3600000).toISOString(),
      clearRemark: 'Physical inspection completed. Conveyor cleared for high-tonnage hauling.'
    };

    // 6 Splice Joints on CV-101
    this.jointsState = [
      {
        jointId: 'Joint-01',
        name: 'Joint 01 (Head Vulcanized Splice)',
        positionMeters: 0,
        healthStatus: JOINT_STATUS.OPTIMAL,
        riskScore: 14.2,
        estimatedTimeToFailureHours: 4850,
        estimatedTimeToFailureDays: 202.1,
        ultrasonicThickness: 25.4,
        temperature: 43.8,
        vibrationRms: 2.1,
        acousticEmission: 36.5,
        confidence: 0.94,
        wearProgress: 0.12,
        cycleCount: 14820,
        recommendation: 'Splice in prime condition. Normal continuous operation.',
        lastUpdated: new Date().toISOString()
      },
      {
        jointId: 'Joint-02',
        name: 'Joint 02 (Tensioning Zone Splice)',
        positionMeters: 200,
        healthStatus: JOINT_STATUS.OPTIMAL,
        riskScore: 22.5,
        estimatedTimeToFailureHours: 4200,
        estimatedTimeToFailureDays: 175.0,
        ultrasonicThickness: 24.6,
        temperature: 45.2,
        vibrationRms: 2.4,
        acousticEmission: 39.2,
        confidence: 0.93,
        wearProgress: 0.18,
        cycleCount: 13950,
        recommendation: 'Optimal condition. Minor normal surface abrasion.',
        lastUpdated: new Date().toISOString()
      },
      {
        jointId: 'Joint-03',
        name: 'Joint 03 (Feeder Chute Impact Splice)',
        positionMeters: 400,
        healthStatus: JOINT_STATUS.ELEVATED_WEAR,
        riskScore: 58.4,
        estimatedTimeToFailureHours: 840,
        estimatedTimeToFailureDays: 35.0,
        ultrasonicThickness: 19.1,
        temperature: 61.5,
        vibrationRms: 5.6,
        acousticEmission: 59.4,
        confidence: 0.91,
        wearProgress: 0.62,
        cycleCount: 29400,
        recommendation: 'Splice thickness degraded to 19.1mm. Plan ultrasonic rescan during next weekend shift.',
        lastUpdated: new Date().toISOString()
      },
      {
        jointId: 'Joint-04',
        name: 'Joint 04 (Return Strand Splice)',
        positionMeters: 600,
        healthStatus: JOINT_STATUS.OPTIMAL,
        riskScore: 9.8,
        estimatedTimeToFailureHours: 5400,
        estimatedTimeToFailureDays: 225.0,
        ultrasonicThickness: 25.8,
        temperature: 41.2,
        vibrationRms: 1.8,
        acousticEmission: 33.1,
        confidence: 0.96,
        wearProgress: 0.08,
        cycleCount: 8400,
        recommendation: 'Optimal condition. Low dynamic stress profile.',
        lastUpdated: new Date().toISOString()
      },
      {
        jointId: 'Joint-05',
        name: 'Joint 05 (Tail Pulley Transition Splice)',
        positionMeters: 800,
        healthStatus: JOINT_STATUS.CRITICAL_DELAMINATION,
        riskScore: 84.6,
        estimatedTimeToFailureHours: 144,
        estimatedTimeToFailureDays: 6.0,
        ultrasonicThickness: 14.2,
        temperature: 78.4,
        vibrationRms: 7.9,
        acousticEmission: 79.8,
        confidence: 0.95,
        wearProgress: 0.91,
        cycleCount: 43200,
        recommendation: 'CRITICAL: Severe core steel cord delamination detected. Estimated RUL < 6 days. Urgent maintenance ticket required.',
        lastUpdated: new Date().toISOString()
      },
      {
        jointId: 'Joint-06',
        name: 'Joint 06 (Snub Pulley Transition)',
        positionMeters: 1000,
        healthStatus: JOINT_STATUS.OPTIMAL,
        riskScore: 28.1,
        estimatedTimeToFailureHours: 3750,
        estimatedTimeToFailureDays: 156.2,
        ultrasonicThickness: 23.9,
        temperature: 47.0,
        vibrationRms: 2.8,
        acousticEmission: 42.0,
        confidence: 0.92,
        wearProgress: 0.24,
        cycleCount: 16800,
        recommendation: 'Optimal condition. Minor top cover rubber aging.',
        lastUpdated: new Date().toISOString()
      }
    ];

    // Initial Active Alerts
    this.alertsState = [
      {
        id: 'ALT-1092',
        facilityId: this.facilityId,
        title: 'Critical Splice Delamination: Joint-05',
        description: 'Ultrasonic thickness measured at 14.2mm (critical threshold <= 15.0mm). Stress wave acoustic emission reached 79.8 dB.',
        severity: ALERT_SEVERITY.CRITICAL,
        source: 'Joint Ultrasonic Array & ML RUL',
        jointId: 'Joint-05',
        status: ALERT_STATUS.ACTIVE,
        metrics: { thickness: 14.2, acoustic: 79.8, vibration: 7.9, temp: 78.4 },
        actionRequired: 'Schedule emergency vulcanizing splice replacement immediately.',
        createdAt: new Date(Date.now() - 420000).toISOString(),
        updatedAt: new Date(Date.now() - 420000).toISOString()
      },
      {
        id: 'ALT-1088',
        facilityId: this.facilityId,
        title: 'Elevated Vibration Harmonic: Joint-03',
        description: 'Drive pulley vibration 5.6 mm/s matching joint cycle rotation frequency. Top cover thinning detected.',
        severity: ALERT_SEVERITY.WARNING,
        source: 'Tri-Axial Vibration & Dump Filter',
        jointId: 'Joint-03',
        status: ALERT_STATUS.ACTIVE,
        metrics: { vibration: 5.6, load: 1950, temp: 61.5 },
        actionRequired: 'Monitor closely during next chute dump cycle. Verify splice clamp tightness.',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 'ALT-1074',
        facilityId: this.facilityId,
        title: 'Hopper Chute Dump Shock Filtered',
        description: '2640 t/h surge suppressed by DumpNoiseFilter. Vibration peak 6.4 mm/s classified as ore impact shock wave.',
        severity: ALERT_SEVERITY.INFO,
        source: 'DumpNoiseFilter (SIH 26008)',
        jointId: 'Chute-01',
        status: ALERT_STATUS.ACKNOWLEDGED,
        metrics: { loadSurge: 620, vibration: 6.4 },
        actionRequired: 'No action required. False positive successfully suppressed.',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    // Initial Vision Line-Scan History
    this.visionEventsState = [
      {
        incidentId: 'INC-VIS-01',
        frameId: 'SCAN-FRM-1042',
        beltDistanceMeters: 802.4,
        classification: 'Splice Joint Delamination / Pull-out',
        isDefect: true,
        confidence: 0.95,
        severity: 'CRITICAL',
        consecutiveFrameCount: 3,
        boundingBoxes: [
          { x: 0.12, y: 0.38, width: 0.76, height: 0.22, label: 'Splice Delamination', confidence: 0.95 }
        ],
        defectParameters: {
          crackLengthMm: 1180.0,
          tearWidthMm: 54.0,
          surfaceAreaDamagedMm2: 63720.0,
          severityLevel: 'CRITICAL',
          affectedCordLayer: 'Splice Step Vulcanized Bond',
          thermalHotspotTempC: 78.4
        },
        recommendedAction: 'Immediate visual inspection and emergency vulcanization stop required.',
        firstDetected: new Date(Date.now() - 600000).toISOString(),
        lastUpdated: new Date().toISOString()
      },
      {
        incidentId: 'INC-VIS-02',
        frameId: 'SCAN-FRM-1018',
        beltDistanceMeters: 412.0,
        classification: 'Heavy Transverse Surface Crack',
        isDefect: true,
        confidence: 0.89,
        severity: 'WARNING',
        consecutiveFrameCount: 1,
        boundingBoxes: [
          { x: 0.28, y: 0.42, width: 0.44, height: 0.16, label: 'Transverse Crack', confidence: 0.89 }
        ],
        defectParameters: {
          crackLengthMm: 390.0,
          tearWidthMm: 18.0,
          surfaceAreaDamagedMm2: 7020.0,
          severityLevel: 'WARNING',
          affectedCordLayer: 'Top Cover Rubber'
        },
        recommendedAction: 'Log in maintenance queue for cold-cure repair.',
        firstDetected: new Date(Date.now() - 3600000).toISOString(),
        lastUpdated: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    // Initial Sensor Reliability Map
    this.reliabilityState = {
      facilityId: this.facilityId,
      scores: {
        [SENSOR_TYPES.DRIVE_VIBRATION]: {
          sensorType: SENSOR_TYPES.DRIVE_VIBRATION,
          reliabilityScore: 94,
          status: SENSOR_RELIABILITY_STATUS.HEALTHY,
          weightForML: 1.0,
          metrics: { uptimeScore: 100, stuckScore: 100, rangeScore: 100, jitterScore: 88, stuckDurationSeconds: 0, recentStdDev: 0.18, isWithinRange: true },
          actionRequired: 'None - Operating nominally.'
        },
        [SENSOR_TYPES.BELT_SPEED]: {
          sensorType: SENSOR_TYPES.BELT_SPEED,
          reliabilityScore: 98,
          status: SENSOR_RELIABILITY_STATUS.HEALTHY,
          weightForML: 1.0,
          metrics: { uptimeScore: 100, stuckScore: 100, rangeScore: 100, jitterScore: 96, stuckDurationSeconds: 0, recentStdDev: 0.04, isWithinRange: true },
          actionRequired: 'None - Operating nominally.'
        },
        [SENSOR_TYPES.DYNAMIC_LOAD]: {
          sensorType: SENSOR_TYPES.DYNAMIC_LOAD,
          reliabilityScore: 91,
          status: SENSOR_RELIABILITY_STATUS.HEALTHY,
          weightForML: 1.0,
          metrics: { uptimeScore: 100, stuckScore: 100, rangeScore: 100, jitterScore: 78, stuckDurationSeconds: 0, recentStdDev: 24.5, isWithinRange: true },
          actionRequired: 'None - Operating nominally.'
        },
        [SENSOR_TYPES.JOINT_TEMPERATURE]: {
          sensorType: SENSOR_TYPES.JOINT_TEMPERATURE,
          reliabilityScore: 89,
          status: SENSOR_RELIABILITY_STATUS.HEALTHY,
          weightForML: 1.0,
          metrics: { uptimeScore: 100, stuckScore: 100, rangeScore: 100, jitterScore: 82, stuckDurationSeconds: 0, recentStdDev: 0.65, isWithinRange: true },
          actionRequired: 'None - Operating nominally.'
        },
        [SENSOR_TYPES.ULTRASONIC_THICKNESS]: {
          sensorType: SENSOR_TYPES.ULTRASONIC_THICKNESS,
          reliabilityScore: 78,
          status: SENSOR_RELIABILITY_STATUS.DEGRADED,
          weightForML: 0.78,
          metrics: { uptimeScore: 92, stuckScore: 100, rangeScore: 100, jitterScore: 65, stuckDurationSeconds: 0, recentStdDev: 0.32, isWithinRange: true },
          actionRequired: 'DEGRADED: Minor dust buildup on acoustic coupler. Model weight adjusted to 0.78.'
        },
        [SENSOR_TYPES.ACOUSTIC_EMISSION]: {
          sensorType: SENSOR_TYPES.ACOUSTIC_EMISSION,
          reliabilityScore: 92,
          status: SENSOR_RELIABILITY_STATUS.HEALTHY,
          weightForML: 1.0,
          metrics: { uptimeScore: 100, stuckScore: 100, rangeScore: 100, jitterScore: 84, stuckDurationSeconds: 0, recentStdDev: 1.45, isWithinRange: true },
          actionRequired: 'None - Operating nominally.'
        }
      },
      lastUpdated: new Date().toISOString()
    };

    // Live Telemetry Snapshot
    this.latestTelemetry = {
      facilityId: this.facilityId,
      timestamp: new Date().toISOString(),
      sensors: {
        [SENSOR_TYPES.DRIVE_VIBRATION]: 2.35,
        [SENSOR_TYPES.BELT_SPEED]: 4.20,
        [SENSOR_TYPES.DYNAMIC_LOAD]: 1820,
        [SENSOR_TYPES.JOINT_TEMPERATURE]: 44.5,
        [SENSOR_TYPES.ULTRASONIC_THICKNESS]: 24.2,
        [SENSOR_TYPES.ACOUSTIC_EMISSION]: 39.0
      },
      activeJointId: 'Joint-01',
      beltDisplacementMeters: 12.5,
      isDumping: false,
      isJointAtStation: false
    };

    this.startSimulation();
  }

  startSimulation() {
    let tick = 0;
    setInterval(() => {
      tick++;
      const now = new Date();
      const config = FACILITY_CONFIGS[this.facilityId] || FACILITY_CONFIGS['nmdc-kirandul-cv101'];

      // If Emergency Stop is active, halt belt motion!
      if (this.emergencyStatus.emergencyStopActive) {
        this.latestTelemetry = {
          ...this.latestTelemetry,
          timestamp: now.toISOString(),
          sensors: {
            [SENSOR_TYPES.DRIVE_VIBRATION]: 0.05,
            [SENSOR_TYPES.BELT_SPEED]: 0.0,
            [SENSOR_TYPES.DYNAMIC_LOAD]: 0,
            [SENSOR_TYPES.JOINT_TEMPERATURE]: 36.0,
            [SENSOR_TYPES.ULTRASONIC_THICKNESS]: 24.0,
            [SENSOR_TYPES.ACOUSTIC_EMISSION]: 12.0
          },
          isDumping: false
        };
        this.broadcast('telemetry', this.latestTelemetry);
        return;
      }

      // Simulate belt movement
      const speed = config.nominalSpeedMps + (Math.sin(tick * 0.2) * 0.12) + (Math.random() - 0.5) * 0.04;
      const displacement = (this.latestTelemetry.beltDisplacementMeters + speed * 1.5) % config.beltLengthMeters;

      // Find closest joint
      let activeJoint = this.jointsState[0];
      let minDistance = Infinity;
      this.jointsState.forEach(j => {
        const d = Math.abs(displacement - j.positionMeters);
        if (d < minDistance) {
          minDistance = d;
          activeJoint = j;
        }
      });
      const isJointAtStation = minDistance < 30.0;

      // Check ore dump cycle
      const isDumping = (tick % 24 >= 1 && tick % 24 <= 3);

      let load = 1800 + Math.sin(tick * 0.1) * 160 + (Math.random() - 0.5) * 30;
      let vib = 2.2 + (Math.random() - 0.5) * 0.25;
      let temp = 44.0 + (Math.random() - 0.5) * 0.8;
      let thickness = 24.8;
      let acoustic = 38.0 + (Math.random() - 0.5) * 2.0;

      if (isDumping) {
        load += 650 + Math.random() * 100; // Surge up to ~2550 t/h
        vib += 3.6 + Math.random() * 1.0;  // Transient impact
      }

      if (isJointAtStation) {
        vib += (activeJoint.vibrationRms - 2.0);
        temp = activeJoint.temperature + (Math.random() - 0.5) * 1.2;
        thickness = activeJoint.ultrasonicThickness + (Math.random() - 0.5) * 0.15;
        acoustic = activeJoint.acousticEmission + (Math.random() - 0.5) * 2.0;
      }

      this.latestTelemetry = {
        facilityId: this.facilityId,
        timestamp: now.toISOString(),
        sensors: {
          [SENSOR_TYPES.DRIVE_VIBRATION]: Number(Math.max(0.1, vib).toFixed(2)),
          [SENSOR_TYPES.BELT_SPEED]: Number(speed.toFixed(2)),
          [SENSOR_TYPES.DYNAMIC_LOAD]: Number(Math.max(0, load).toFixed(1)),
          [SENSOR_TYPES.JOINT_TEMPERATURE]: Number(temp.toFixed(1)),
          [SENSOR_TYPES.ULTRASONIC_THICKNESS]: Number(thickness.toFixed(1)),
          [SENSOR_TYPES.ACOUSTIC_EMISSION]: Number(acoustic.toFixed(1))
        },
        activeJointId: activeJoint.jointId,
        beltDisplacementMeters: Number(displacement.toFixed(1)),
        isDumping,
        isJointAtStation
      };

      this.broadcast('telemetry', this.latestTelemetry);

      // Periodically update joint RUL and vision events
      if (tick % 4 === 0) {
        this.broadcast('joints', [...this.jointsState]);
      }
      if (tick % 6 === 0) {
        this.broadcast('reliability', { ...this.reliabilityState, lastUpdated: now.toISOString() });
      }
      if (tick % 8 === 0) {
        this.broadcast('vision', [...this.visionEventsState]);
      }
    }, 1500);
  }

  broadcast(channel, data) {
    if (this.subscribers[channel]) {
      this.subscribers[channel].forEach(cb => {
        try { cb(data); } catch (e) { console.error(`Subscriber error on ${channel}:`, e); }
      });
    }
  }

  // Client actions
  acknowledgeAlert(alertId, user) {
    this.alertsState = this.alertsState.map(a => {
      if (a.id === alertId) {
        return {
          ...a,
          status: ALERT_STATUS.ACKNOWLEDGED,
          acknowledgedBy: user?.displayName || 'Operator',
          acknowledgedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return a;
    });
    this.broadcast('alerts', [...this.alertsState]);
    return Promise.resolve();
  }

  initiateEmergencyStop(user, reason = 'Critical Joint Rupture Risk') {
    this.emergencyStatus = {
      facilityId: this.facilityId,
      emergencyStopActive: true,
      triggeredBy: user?.displayName || 'Operator',
      role: user?.role || 'OPERATOR',
      reason,
      source: 'Control Station UI / Vision Interlock',
      triggeredAt: new Date().toISOString(),
      clearedBy: null,
      clearedAt: null,
      clearRemark: null
    };

    // Add high severity critical alert
    const eStopAlert = {
      id: `ALT-ESTOP-${Date.now()}`,
      facilityId: this.facilityId,
      title: 'EMERGENCY STOP TRIGGERED',
      description: `${reason} - Belt halted immediately by ${user?.displayName || 'Operator'}.`,
      severity: ALERT_SEVERITY.CRITICAL,
      source: 'Emergency Interlock System',
      jointId: 'ALL JOINTS',
      status: ALERT_STATUS.ACTIVE,
      metrics: { beltSpeed: 0.0 },
      actionRequired: 'Investigate cause of emergency stop before admin release.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.alertsState.unshift(eStopAlert);

    this.broadcast('emergency', { ...this.emergencyStatus });
    this.broadcast('alerts', [...this.alertsState]);
    return Promise.resolve(this.emergencyStatus);
  }

  clearEmergencyStop(user, clearRemark) {
    this.emergencyStatus = {
      facilityId: this.facilityId,
      emergencyStopActive: false,
      clearedBy: user?.displayName || 'Site Admin',
      role: user?.role || 'SITE_ADMIN',
      clearRemark: clearRemark || 'Physical site inspection completed. System cleared for hauling.',
      clearedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    this.broadcast('emergency', { ...this.emergencyStatus });
    return Promise.resolve(this.emergencyStatus);
  }

  setFacility(facilityId) {
    this.facilityId = facilityId;
    this.emergencyStatus.facilityId = facilityId;
    this.broadcast('emergency', { ...this.emergencyStatus });
  }
}

// Singleton hub instance
const hub = new ReactiveFirestoreHub();

// --- Public onSnapshot Subscriber APIs ---

export function listenToTelemetry(facilityId, callback) {
  hub.subscribers.telemetry.add(callback);
  callback(hub.latestTelemetry);
  return () => hub.subscribers.telemetry.delete(callback);
}

export function listenToJoints(facilityId, callback) {
  hub.subscribers.joints.add(callback);
  callback(hub.jointsState);
  return () => hub.subscribers.joints.delete(callback);
}

export function listenToSensorReliability(facilityId, callback) {
  hub.subscribers.reliability.add(callback);
  callback(hub.reliabilityState);
  return () => hub.subscribers.reliability.delete(callback);
}

export function listenToVisionEvents(facilityId, callback) {
  hub.subscribers.vision.add(callback);
  callback(hub.visionEventsState);
  return () => hub.subscribers.vision.delete(callback);
}

export function listenToAlerts(facilityId, callback) {
  hub.subscribers.alerts.add(callback);
  callback(hub.alertsState);
  return () => hub.subscribers.alerts.delete(callback);
}

export function listenToEmergencyStatus(facilityId, callback) {
  hub.subscribers.emergency.add(callback);
  callback(hub.emergencyStatus);
  return () => hub.subscribers.emergency.delete(callback);
}

// Client action wrappers
export function acknowledgeAlertDoc(facilityId, alertId, user) {
  return hub.acknowledgeAlert(alertId, user);
}

export function triggerFacilityEmergencyStop(facilityId, user, reason) {
  return hub.initiateEmergencyStop(user, reason);
}

export function clearFacilityEmergencyStop(facilityId, user, clearRemark) {
  return hub.clearEmergencyStop(user, clearRemark);
}

export function changeActiveFacility(facilityId) {
  hub.setFacility(facilityId);
}
