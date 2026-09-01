/**
 * SmartConveyor - Theme and Semantic Color Mapping Utilities
 */

import { JOINT_STATUS, SENSOR_RELIABILITY_STATUS, ALERT_SEVERITY } from '../../../shared/constants.js';

export function getJointStatusColor(status) {
  switch (status) {
    case JOINT_STATUS.CRITICAL_DELAMINATION:
      return {
        bg: 'bg-red-500/10',
        border: 'border-red-500/40',
        text: 'text-red-400',
        badge: 'bg-red-950/80 text-red-300 border-red-500/50',
        hex: '#ef4444',
        label: 'Critical Delamination'
      };
    case JOINT_STATUS.ELEVATED_WEAR:
      return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/40',
        text: 'text-amber-400',
        badge: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
        hex: '#f59e0b',
        label: 'Elevated Wear'
      };
    case JOINT_STATUS.OPTIMAL:
    default:
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/40',
        text: 'text-emerald-400',
        badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
        hex: '#10b981',
        label: 'Optimal Condition'
      };
  }
}

export function getReliabilityStatusColor(status) {
  switch (status) {
    case SENSOR_RELIABILITY_STATUS.FAULTY:
      return {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        text: 'text-red-400',
        hex: '#ef4444',
        label: 'Faulty (Excluded)'
      };
    case SENSOR_RELIABILITY_STATUS.DEGRADED:
      return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        hex: '#f59e0b',
        label: 'Degraded (Down-weighted)'
      };
    case SENSOR_RELIABILITY_STATUS.HEALTHY:
    default:
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        hex: '#10b981',
        label: 'Healthy (Full Weight)'
      };
  }
}

export function getAlertSeverityColor(severity) {
  switch (severity) {
    case ALERT_SEVERITY.CRITICAL:
      return {
        badge: 'bg-red-950/80 text-red-300 border-red-500/50',
        icon: 'text-red-400',
        dot: 'bg-red-500'
      };
    case ALERT_SEVERITY.WARNING:
      return {
        badge: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
        icon: 'text-amber-400',
        dot: 'bg-amber-500'
      };
    case ALERT_SEVERITY.INFO:
    default:
      return {
        badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50',
        icon: 'text-cyan-400',
        dot: 'bg-cyan-500'
      };
  }
}
