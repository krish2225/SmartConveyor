import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Log } from '../models/Log.js';
import { Alert } from '../models/Alert.js';
import { JointHealth } from '../models/JointHealth.js';
import { VisionEvent } from '../models/VisionEvent.js';
import { ReliabilityLog } from '../models/ReliabilityLog.js';
import { Report } from '../models/Report.js';
import { EmergencyStatus } from '../models/EmergencyStatus.js';
import { FacilityConfig } from '../models/FacilityConfig.js';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  console.log('[Seed] Checking MongoDB seed status...');
  
  try {
    // 1. Seed Users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Seed] Seeding initial users...');
      const salt = await bcrypt.genSalt(10);
      const defaultPassword = await bcrypt.hash('password123', salt);

      await User.create([
        {
          uid: 'usr-op-101',
          email: 'operator@nmdc.co.in',
          password: defaultPassword,
          displayName: 'Rajesh Sharma (Shift Operator)',
          role: 'OPERATOR',
          facilityId: 'nmdc-kirandul-cv101',
          avatar: '👷‍♂️'
        },
        {
          uid: 'usr-eng-204',
          email: 'engineer@nmdc.co.in',
          password: defaultPassword,
          displayName: 'Dr. Ananya Verma (Lead Maintenance Eng.)',
          role: 'MAINTENANCE_ENGINEER',
          facilityId: 'nmdc-kirandul-cv101',
          avatar: '👩‍🔧'
        },
        {
          uid: 'usr-adm-999',
          email: 'admin@nmdc.co.in',
          password: defaultPassword,
          displayName: 'Vikramaditya Roy (Bailadila Site Admin)',
          role: 'SITE_ADMIN',
          facilityId: 'nmdc-kirandul-cv101',
          avatar: '🛡️'
        }
      ]);
    }

    // 2. Seed Splice Joints
    const jointCount = await JointHealth.countDocuments();
    if (jointCount === 0) {
      console.log('[Seed] Seeding 6 vulcanized splice joints...');
      await JointHealth.create([
        {
          jointId: 'Joint-01',
          facilityId: 'nmdc-kirandul-cv101',
          name: 'Joint 01 (Head Vulcanized Splice)',
          positionMeters: 0,
          healthStatus: 'OPTIMAL',
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
          recommendation: 'Splice in prime condition. Normal continuous operation.'
        },
        {
          jointId: 'Joint-02',
          facilityId: 'nmdc-kirandul-cv101',
          name: 'Joint 02 (Tensioning Zone Splice)',
          positionMeters: 200,
          healthStatus: 'OPTIMAL',
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
          recommendation: 'Optimal condition. Minor normal surface abrasion.'
        },
        {
          jointId: 'Joint-03',
          facilityId: 'nmdc-kirandul-cv101',
          name: 'Joint 03 (Feeder Chute Impact Splice)',
          positionMeters: 400,
          healthStatus: 'ELEVATED_WEAR',
          riskScore: 58.4,
          estimatedTimeToFailureHours: 840,
          estimatedTimeToFailureDays: 35.0,
          ultrasonicThickness: 19.8,
          temperature: 58.6,
          vibrationRms: 4.8,
          acousticEmission: 64.2,
          confidence: 0.91,
          wearProgress: 0.58,
          cycleCount: 15100,
          recommendation: 'Elevated wear at ore drop zone. Schedule ultrasonic thickness audit in 7 days.'
        },
        {
          jointId: 'Joint-04',
          facilityId: 'nmdc-kirandul-cv101',
          name: 'Joint 04 (Mid-Span Drive Transition)',
          positionMeters: 600,
          healthStatus: 'OPTIMAL',
          riskScore: 18.0,
          estimatedTimeToFailureHours: 4600,
          estimatedTimeToFailureDays: 191.6,
          ultrasonicThickness: 25.1,
          temperature: 42.9,
          vibrationRms: 2.2,
          acousticEmission: 37.8,
          confidence: 0.95,
          wearProgress: 0.15,
          cycleCount: 14200,
          recommendation: 'Nominal operational baseline.'
        },
        {
          jointId: 'Joint-05',
          facilityId: 'nmdc-kirandul-cv101',
          name: 'Joint 05 (High Tension Curve Splice)',
          positionMeters: 800,
          healthStatus: 'CRITICAL_DELAMINATION',
          riskScore: 89.2,
          estimatedTimeToFailureHours: 144,
          estimatedTimeToFailureDays: 6.0,
          ultrasonicThickness: 16.2,
          temperature: 74.5,
          vibrationRms: 7.9,
          acousticEmission: 78.4,
          confidence: 0.96,
          wearProgress: 0.89,
          cycleCount: 16400,
          recommendation: 'CRITICAL: High risk of longitudinal cord pull-out. Immediate scheduled hot re-vulcanization required!'
        },
        {
          jointId: 'Joint-06',
          facilityId: 'nmdc-kirandul-cv101',
          name: 'Joint 06 (Tail Pulley Return Splice)',
          positionMeters: 1000,
          healthStatus: 'OPTIMAL',
          riskScore: 16.8,
          estimatedTimeToFailureHours: 4750,
          estimatedTimeToFailureDays: 197.9,
          ultrasonicThickness: 25.2,
          temperature: 41.5,
          vibrationRms: 2.0,
          acousticEmission: 35.1,
          confidence: 0.94,
          wearProgress: 0.14,
          cycleCount: 14050,
          recommendation: 'Splice in prime condition. Normal continuous operation.'
        }
      ]);
    }

    // 3. Seed Alerts
    const alertCount = await Alert.countDocuments();
    if (alertCount === 0) {
      console.log('[Seed] Seeding initial alerts...');
      await Alert.create([
        {
          id: 'ALT-1001',
          facilityId: 'nmdc-kirandul-cv101',
          title: 'Critical Splice Delamination & High Acoustic Emission',
          description: 'Joint-05 acoustic emission surged to 78.4 dB with ultrasonic thickness degradation down to 16.2mm (below 18.5mm safety threshold). High cord pull-out risk.',
          severity: 'CRITICAL',
          source: 'Acoustic / Ultrasonic Multi-Sensor Array',
          jointId: 'Joint-05',
          status: 'ACTIVE',
          metrics: { acousticEmission: 78.4, ultrasonicThickness: 16.2, temperature: 74.5 },
          actionRequired: 'Halt line at next scheduled window and perform non-destructive cord radiography.',
          createdAt: new Date(Date.now() - 1800000)
        },
        {
          id: 'ALT-1002',
          facilityId: 'nmdc-kirandul-cv101',
          title: 'Feeder Chute Impact Splice Accelerated Thermal Wear',
          description: 'Joint-03 core temperature elevated to 58.6°C during heavy haulage ore dumping cycle.',
          severity: 'WARNING',
          source: 'MLX90614 Contactless IR Array',
          jointId: 'Joint-03',
          status: 'ACKNOWLEDGED',
          acknowledgedBy: 'Dr. Ananya Verma',
          acknowledgedAt: new Date(Date.now() - 3600000),
          metrics: { temperature: 58.6, dynamicLoad: 2420 },
          actionRequired: 'Inspect chute skirt board rubber seal for friction rubbing.',
          createdAt: new Date(Date.now() - 7200000)
        },
        {
          id: 'ALT-1003',
          facilityId: 'nmdc-kirandul-cv101',
          title: 'Ultrasonic Coupler Dust Attenuation Warning',
          description: 'Ultrasonic transducer reliability score dropped to 78% due to fine hematite dust accumulation on acoustic wedge.',
          severity: 'INFO',
          source: 'SensorReliability Engine (4-Factor Model)',
          jointId: 'Joint-05',
          status: 'RESOLVED',
          resolvedBy: 'Rajesh Sharma',
          resolvedAt: new Date(Date.now() - 14400000),
          resolutionNote: 'Acoustic coupler cleaned with pressurized air nozzle. Signal restored.',
          metrics: { reliabilityScore: 78, jitterScore: 65 },
          actionRequired: 'Perform routine air blast cleaning on optical and ultrasonic lens.',
          createdAt: new Date(Date.now() - 28800000)
        }
      ]);
    }

    // 4. Seed Reports
    const reportCount = await Report.countDocuments();
    if (reportCount === 0) {
      console.log('[Seed] Seeding compliance and audit reports...');
      await Report.create([
        {
          id: 'REP-2026-0814',
          facilityId: 'nmdc-kirandul-cv101',
          title: 'Weekly Joint Splice Degradation & RUL Forecast',
          type: 'PREDICTIVE_RUL',
          generatedBy: 'Dr. Ananya Verma (Lead Eng.)',
          generatedAt: new Date(Date.now() - 86400000 * 4),
          totalTonnage: '428,500 Tons',
          overallRiskScore: 89.2,
          status: 'APPROVED'
        },
        {
          id: 'REP-2026-0808',
          facilityId: 'nmdc-kirandul-cv101',
          title: 'Chute Dump Vibration & Ore Impact Analysis',
          type: 'VIBRATION_AUDIT',
          generatedBy: 'Rajesh Sharma (Operator)',
          generatedAt: new Date(Date.now() - 86400000 * 9),
          totalTonnage: '394,200 Tons',
          overallRiskScore: 32.4,
          status: 'FILED'
        },
        {
          id: 'REP-2026-0792',
          facilityId: 'nmdc-kirandul-cv101',
          title: 'Monthly Line-Scan Optical Defect Log',
          type: 'VISION_SUMMARY',
          generatedBy: 'Vikramaditya Roy (Admin)',
          generatedAt: new Date(Date.now() - 86400000 * 18),
          totalTonnage: '1,840,000 Tons',
          overallRiskScore: 28.0,
          status: 'APPROVED'
        }
      ]);
    }

    // 5. Seed Vision Events
    const visionCount = await VisionEvent.countDocuments();
    if (visionCount === 0) {
      console.log('[Seed] Seeding optical line-scan inspection events...');
      await VisionEvent.create([
        {
          id: 'VIS-901',
          facilityId: 'nmdc-kirandul-cv101',
          timestamp: new Date(Date.now() - 1200000),
          cameraLocation: 'Feeder Discharge Line-Scan Camera #1',
          beltDisplacementMeters: 800.0,
          nearestJointId: 'Joint-05',
          defectType: 'Splice Joint Delamination / Pull-out',
          confidence: 0.94,
          severity: 'CRITICAL',
          boundingBox: { x: 340, y: 180, width: 280, height: 120 },
          consecutiveFrames: 3,
          isMergedIncident: true,
          notes: 'High confidence longitudinal cord gap widening visible under high intensity strobe illumination.'
        },
        {
          id: 'VIS-902',
          facilityId: 'nmdc-kirandul-cv101',
          timestamp: new Date(Date.now() - 3600000),
          cameraLocation: 'Mid-Span Inspection Camera #2',
          beltDisplacementMeters: 400.0,
          nearestJointId: 'Joint-03',
          defectType: 'Heavy Transverse Surface Crack',
          confidence: 0.88,
          severity: 'MEDIUM',
          boundingBox: { x: 190, y: 220, width: 140, height: 80 },
          consecutiveFrames: 1,
          isMergedIncident: false,
          notes: 'Transverse ore gouge crack detected near joint splice edge.'
        }
      ]);
    }

    // 6. Seed Logs (System, Sensor, Audit, Emergency)
    const logCount = await Log.countDocuments();
    if (logCount === 0) {
      console.log('[Seed] Seeding rich MongoDB system and audit logs...');
      const seedLogs = [
        {
          logId: 'LOG-SYS-001',
          facilityId: 'nmdc-kirandul-cv101',
          level: 'INFO',
          category: 'SYSTEM',
          source: 'Node.js Express API Server',
          message: 'SmartConveyor MERN backend initialized. Connected to MongoDB database.',
          details: { port: 5000, env: 'production', facility: 'nmdc-kirandul-cv101' },
          user: 'System Kernel',
          timestamp: new Date(Date.now() - 7200000)
        },
        {
          logId: 'LOG-IOT-002',
          facilityId: 'nmdc-kirandul-cv101',
          level: 'INFO',
          category: 'SENSOR',
          source: 'Firebase Live Telemetry Interface',
          message: 'Live ESP32 / Raspberry Pi IoT transducer stream synchronized (20Hz sampling rate).',
          details: { channel: 'telemetry/nmdc-kirandul-cv101', protocol: 'Firestore onSnapshot / REST' },
          user: 'ESP32 Gateway',
          timestamp: new Date(Date.now() - 5400000)
        },
        {
          logId: 'LOG-ALM-003',
          facilityId: 'nmdc-kirandul-cv101',
          level: 'CRITICAL',
          category: 'ALERT',
          source: 'Anomaly Detector Engine',
          message: 'CRITICAL ALARM: Joint-05 delamination risk score reached 89.2% with RUL < 6 days.',
          details: { jointId: 'Joint-05', riskScore: 89.2, thickness: 16.2, acoustic: 78.4 },
          jointId: 'Joint-05',
          user: 'ML Anomaly Engine',
          timestamp: new Date(Date.now() - 1800000)
        },
        {
          logId: 'LOG-AUD-004',
          facilityId: 'nmdc-kirandul-cv101',
          level: 'INFO',
          category: 'AUDIT',
          source: 'Control Room Console',
          message: 'Operator Rajesh Sharma logged in with role OPERATOR.',
          details: { ip: '192.168.1.104', role: 'OPERATOR' },
          user: 'Rajesh Sharma',
          timestamp: new Date(Date.now() - 1200000)
        },
        {
          logId: 'LOG-FLT-005',
          facilityId: 'nmdc-kirandul-cv101',
          level: 'INFO',
          category: 'ANOMALY',
          source: 'DumpNoiseFilter (PS 26008)',
          message: 'Ore Dump Surge Filter suppressed false positive transient shock wave (Load surge +710 t/h in 1.2s).',
          details: { durationSeconds: 4.5, isDumping: true, peakLoad: 2540 },
          user: 'DumpNoiseFilter',
          timestamp: new Date(Date.now() - 600000)
        }
      ];

      await Log.create(seedLogs);
    }

    // 7. Seed EmergencyStatus
    const eStatus = await EmergencyStatus.findOne({ facilityId: 'nmdc-kirandul-cv101' });
    if (!eStatus) {
      await EmergencyStatus.create({
        facilityId: 'nmdc-kirandul-cv101',
        emergencyStopActive: false,
        clearedBy: 'Vikramaditya Roy (Site Admin)',
        clearedAt: new Date(Date.now() - 3600000),
        clearRemark: 'Physical inspection completed. Conveyor cleared for high-tonnage hauling.'
      });
    }

    // 8. Seed FacilityConfigs
    const configs = await FacilityConfig.countDocuments();
    if (configs === 0) {
      await FacilityConfig.create([
        {
          facilityId: 'nmdc-kirandul-cv101',
          name: 'NMDC Kirandul Complex - Deposit 14 (CV-101)',
          location: 'Bailadila Iron Ore Mine, Chhattisgarh',
          beltLengthMeters: 1200,
          beltWidthMm: 1600,
          beltRating: 'ST-5400 (Steel Cord)',
          nominalSpeedMps: 4.2,
          ratedCapacityTph: 2400,
          totalJoints: 6,
          thresholds: { maxVibration: 8.5, maxTemp: 85.0, minThickness: 15.0, dumpSurge: 350 }
        },
        {
          facilityId: 'nmdc-bacheli-cv204',
          name: 'NMDC Bacheli Complex - Deposit 11B (CV-204)',
          location: 'Bailadila Iron Ore Mine, Chhattisgarh',
          beltLengthMeters: 1800,
          beltWidthMm: 1800,
          beltRating: 'ST-6300 (Steel Cord Heavy Duty)',
          nominalSpeedMps: 4.5,
          ratedCapacityTph: 3000,
          totalJoints: 8,
          thresholds: { maxVibration: 9.0, maxTemp: 85.0, minThickness: 16.0, dumpSurge: 400 }
        }
      ]);
    }

    console.log('[Seed] Database seed completed successfully!');
  } catch (err) {
    console.warn(`[Seed Warning] Database auto-seed encountered an issue (can be ignored if offline): ${err.message}`);
  }
}

// Standalone execution if run via `node seed/seedDatabase.js`
if (process.argv[1]?.endsWith('seedDatabase.js')) {
  (async () => {
    await connectDB();
    await seedDatabase();
    process.exit(0);
  })();
}
