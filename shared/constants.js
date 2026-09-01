/**
 * SmartConveyor - Intelligent Conveyor Belt Joint Rupture Monitoring & Predictive Maintenance System
 * SIH Problem Statement 26008 (NMDC Iron Ore Mining)
 * 
 * Shared constants, status enums, thresholds, and facility configurations
 * Used across client/, server/, and ml/ microservices.
 */

export const FACILITY_CONFIGS = {
  'nmdc-kirandul-cv101': {
    id: 'nmdc-kirandul-cv101',
    name: 'NMDC Kirandul Complex - Deposit 14 (CV-101)',
    shortName: 'Kirandul Dep-14 (CV-101)',
    location: 'Bailadila Iron Ore Mine, Chhattisgarh',
    beltLengthMeters: 1200,
    beltWidthMm: 1600,
    beltRating: 'ST-5400 (Steel Cord)',
    nominalSpeedMps: 4.2,
    ratedCapacityTph: 2400,
    totalJoints: 6,
    material: 'Iron Ore Lump & Fines (+65% Fe)'
  },
  'nmdc-bacheli-cv204': {
    id: 'nmdc-bacheli-cv204',
    name: 'NMDC Bacheli Complex - Deposit 11B (CV-204)',
    shortName: 'Bacheli Dep-11B (CV-204)',
    location: 'Bailadila Iron Ore Mine, Chhattisgarh',
    beltLengthMeters: 1800,
    beltWidthMm: 1800,
    beltRating: 'ST-6300 (Steel Cord Heavy Duty)',
    nominalSpeedMps: 4.5,
    ratedCapacityTph: 3000,
    totalJoints: 8,
    material: 'High Grade Hematite Ore'
  }
};

export const SENSOR_TYPES = {
  DRIVE_VIBRATION: 'drive_vibration',
  BELT_SPEED: 'belt_speed',
  DYNAMIC_LOAD: 'dynamic_load',
  JOINT_TEMPERATURE: 'joint_temperature',
  ULTRASONIC_THICKNESS: 'ultrasonic_thickness',
  ACOUSTIC_EMISSION: 'acoustic_emission'
};

export const SENSOR_METADATA = {
  [SENSOR_TYPES.DRIVE_VIBRATION]: {
    id: SENSOR_TYPES.DRIVE_VIBRATION,
    name: 'Drive Pulley Vibration',
    unit: 'mm/s',
    nominalRange: [1.2, 4.5],
    criticalMax: 8.5,
    warningMax: 6.0,
    physicalLimits: [0.0, 50.0],
    noiseFloor: 0.15,
    icon: 'Activity'
  },
  [SENSOR_TYPES.BELT_SPEED]: {
    id: SENSOR_TYPES.BELT_SPEED,
    name: 'Belt Linear Speed',
    unit: 'm/s',
    nominalRange: [3.8, 4.4],
    criticalMin: 1.5,
    criticalMax: 5.2,
    warningMin: 3.2,
    warningMax: 4.8,
    physicalLimits: [0.0, 7.0],
    noiseFloor: 0.05,
    icon: 'Gauge'
  },
  [SENSOR_TYPES.DYNAMIC_LOAD]: {
    id: SENSOR_TYPES.DYNAMIC_LOAD,
    name: 'Dynamic Belt Load',
    unit: 't/h',
    nominalRange: [1400, 2200],
    criticalMax: 2650,
    warningMax: 2400,
    physicalLimits: [0, 3500],
    noiseFloor: 15.0,
    icon: 'Weight'
  },
  [SENSOR_TYPES.JOINT_TEMPERATURE]: {
    id: SENSOR_TYPES.JOINT_TEMPERATURE,
    name: 'Joint Thermal Core',
    unit: '°C',
    nominalRange: [35, 62],
    criticalMax: 85,
    warningMax: 70,
    physicalLimits: [-10, 150],
    noiseFloor: 0.5,
    icon: 'Thermometer'
  },
  [SENSOR_TYPES.ULTRASONIC_THICKNESS]: {
    id: SENSOR_TYPES.ULTRASONIC_THICKNESS,
    name: 'Ultrasonic Splice Thickness',
    unit: 'mm',
    nominalRange: [22.0, 26.0],
    criticalMin: 15.0,
    warningMin: 18.5,
    physicalLimits: [0.0, 40.0],
    noiseFloor: 0.1,
    icon: 'Layers'
  },
  [SENSOR_TYPES.ACOUSTIC_EMISSION]: {
    id: SENSOR_TYPES.ACOUSTIC_EMISSION,
    name: 'Acoustic Emission (Stress Wave)',
    unit: 'dB',
    nominalRange: [30, 55],
    criticalMax: 82,
    warningMax: 68,
    physicalLimits: [0, 120],
    noiseFloor: 1.2,
    icon: 'Radio'
  }
};

export const SENSOR_RELIABILITY_STATUS = {
  HEALTHY: 'HEALTHY',     // score >= 85
  DEGRADED: 'DEGRADED',   // 50 <= score < 85
  FAULTY: 'FAULTY'        // score < 50
};

export const RELIABILITY_WEIGHTS = {
  UPTIME: 0.35,
  STUCK: 0.30,
  RANGE: 0.25,
  JITTER: 0.10
};

export const JOINT_STATUS = {
  OPTIMAL: 'OPTIMAL',
  ELEVATED_WEAR: 'ELEVATED_WEAR',
  CRITICAL_DELAMINATION: 'CRITICAL_DELAMINATION'
};

export const ALERT_SEVERITY = {
  CRITICAL: 'CRITICAL',
  WARNING: 'WARNING',
  INFO: 'INFO'
};

export const ALERT_STATUS = {
  ACTIVE: 'ACTIVE',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  RESOLVED: 'RESOLVED'
};

export const VISION_DEFECT_CLASSES = {
  NORMAL: 'Normal Belt Surface',
  LONGITUDINAL_TEAR: 'Longitudinal Rip / Tear',
  SPLICE_SEPARATION: 'Splice Joint Delamination / Pull-out',
  SURFACE_CRACK: 'Heavy Transverse Surface Crack',
  EDGE_DAMAGE: 'Severe Edge Abrasion & Fraying',
  THERMAL_OVERHEAT: 'Localized Hot Spot Overheating'
};

export const USER_ROLES = {
  OPERATOR: 'OPERATOR',
  ENGINEER: 'MAINTENANCE_ENGINEER',
  ADMIN: 'SITE_ADMIN'
};
