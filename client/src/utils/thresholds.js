/**
 * SmartConveyor - Industrial Thresholds & Evaluation Rules
 * SIH PS 26008 (NMDC Iron Ore Mining)
 */

import { SENSOR_METADATA, SENSOR_TYPES } from '../../../shared/constants.js';

export function evaluateSensorStatus(sensorType, value) {
  const meta = SENSOR_METADATA[sensorType];
  if (!meta) return { status: 'NORMAL', label: 'Nominal', color: 'emerald' };

  if (sensorType === SENSOR_TYPES.BELT_SPEED) {
    if (value < meta.criticalMin || value > meta.criticalMax) {
      return { status: 'CRITICAL', label: 'Speed Deviation', color: 'red' };
    }
    if (value < meta.warningMin || value > meta.warningMax) {
      return { status: 'WARNING', label: 'Speed Warning', color: 'amber' };
    }
    return { status: 'NORMAL', label: 'Optimal Speed', color: 'emerald' };
  }

  if (sensorType === SENSOR_TYPES.ULTRASONIC_THICKNESS) {
    if (value <= meta.criticalMin) {
      return { status: 'CRITICAL', label: 'Splice Thinning (<15mm)', color: 'red' };
    }
    if (value <= meta.warningMin) {
      return { status: 'WARNING', label: 'Splice Wear (<18.5mm)', color: 'amber' };
    }
    return { status: 'NORMAL', label: 'Nominal Splice (>22mm)', color: 'emerald' };
  }

  if (meta.criticalMax && value >= meta.criticalMax) {
    return { status: 'CRITICAL', label: 'Critical Threshold Exceeded', color: 'red' };
  }
  if (meta.warningMax && value >= meta.warningMax) {
    return { status: 'WARNING', label: 'Elevated Reading', color: 'amber' };
  }

  return { status: 'NORMAL', label: 'Nominal Operation', color: 'emerald' };
}

export function formatSensorValue(sensorType, value) {
  if (value === undefined || value === null || isNaN(value)) return '--';
  if (sensorType === SENSOR_TYPES.DYNAMIC_LOAD) return Math.round(value).toLocaleString();
  if (sensorType === SENSOR_TYPES.DRIVE_VIBRATION || sensorType === SENSOR_TYPES.BELT_SPEED) return value.toFixed(2);
  if (sensorType === SENSOR_TYPES.ULTRASONIC_THICKNESS || sensorType === SENSOR_TYPES.JOINT_TEMPERATURE) return value.toFixed(1);
  return Number(value).toFixed(1);
}
