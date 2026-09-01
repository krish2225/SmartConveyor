/**
 * SmartConveyor - SIH Problem Statement 26008 (NMDC Iron Ore Mining)
 * Module: Physics-Informed Sensor Reliability & Data Quality Engine
 * File: server/functions/src/processing/sensorReliability.js
 * 
 * Implements the exact SIH PS 26008 Sensor Reliability Formula:
 * 
 * 1. uptimeScore = (actualReadings / expectedReadings) * 100
 * 2. stuckScore = 100 if stuckDuration < 30s, else decays exponentially toward 0
 * 3. rangeScore = 100 if value is within physical limits, else 0
 * 4. jitterScore = 100 if stdDev < noiseFloor, else decays toward 0 (captures excessive noise / loose wiring)
 * 5. reliabilityScore = 0.35 * uptimeScore + 0.30 * stuckScore + 0.25 * rangeScore + 0.10 * jitterScore
 * 
 * Reliability Classification:
 * - >= 85: HEALTHY   -> Full 1.0 weight in ML inference
 * - 50 - 84: DEGRADED -> Down-weighted by (reliabilityScore / 100)
 * - < 50: FAULTY     -> Excluded completely from ML inference to prevent false emergency stops
 */

import { SENSOR_METADATA, SENSOR_RELIABILITY_STATUS } from '../../../../shared/constants.js';

/**
 * Computes the reliability score and diagnostic status for a given sensor stream.
 * 
 * @param {Object} params
 * @param {string} params.sensorType - Identifier (e.g., 'drive_vibration', 'joint_temperature')
 * @param {number} params.currentValue - Latest sensor telemetry reading
 * @param {Array<number>} params.recentReadings - Circular buffer of the last N readings (default 20)
 * @param {number} params.actualReadings - Number of packets received in current evaluation window
 * @param {number} params.expectedReadings - Expected packets based on sampling frequency (e.g., 20)
 * @param {number} params.stuckDurationSeconds - Elapsed seconds that the sensor value has remained identical
 * @returns {Object} Reliability evaluation result
 */
export function computeSensorReliability({
  sensorType,
  currentValue,
  recentReadings = [],
  actualReadings = 20,
  expectedReadings = 20,
  stuckDurationSeconds = 0
}) {
  const metadata = SENSOR_METADATA[sensorType] || {
    physicalLimits: [-Infinity, Infinity],
    noiseFloor: 0.1,
    nominalRange: [-Infinity, Infinity]
  };

  // 1. Uptime Score: Packet arrival ratio
  const uptimeRatio = expectedReadings > 0 ? (actualReadings / expectedReadings) : 1.0;
  const uptimeScore = Math.max(0, Math.min(100, uptimeRatio * 100));

  // 2. Stuck-at-Fault Score: Continuous identical reading detection
  // In harsh mining environments, sensors often freeze on last known value due to ADC latching or dust caking.
  let stuckScore = 100;
  if (stuckDurationSeconds >= 30) {
    // Exponential decay: drops toward 0 as stuck duration exceeds 30s
    const excessSeconds = stuckDurationSeconds - 30;
    stuckScore = Math.max(0, Math.round(100 * Math.exp(-excessSeconds / 45)));
  }

  // 3. Physical Range Validation Score: Check physical operating boundaries
  const [physMin, physMax] = metadata.physicalLimits;
  const isWithinRange = currentValue >= physMin && currentValue <= physMax && !isNaN(currentValue);
  const rangeScore = isWithinRange ? 100 : 0;

  // 4. Jitter / Excessive Noise Score: Standard deviation analysis
  let jitterScore = 100;
  let stdDev = 0;
  if (recentReadings.length >= 4) {
    const mean = recentReadings.reduce((sum, v) => sum + v, 0) / recentReadings.length;
    const variance = recentReadings.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / recentReadings.length;
    stdDev = Math.sqrt(variance);

    // If stdDev exceeds allowable noise floor by a wide margin (loose transducer connection in mining vibratory zone)
    const allowableNoise = metadata.noiseFloor * 5.0;
    if (stdDev > allowableNoise) {
      const excess = stdDev - allowableNoise;
      jitterScore = Math.max(0, Math.round(100 * Math.exp(-excess / (allowableNoise * 2))));
    }
  }

  // 5. Composite Reliability Formula (SIH PS 26008 Specification)
  const weightedScore = (
    0.35 * uptimeScore +
    0.30 * stuckScore +
    0.25 * rangeScore +
    0.10 * jitterScore
  );
  const reliabilityScore = Math.round(Math.max(0, Math.min(100, weightedScore)));

  // Categorize status
  let status = SENSOR_RELIABILITY_STATUS.HEALTHY;
  let weightForML = 1.0;
  let actionRequired = 'None - Sensor operating within optimal specifications.';

  if (reliabilityScore < 50) {
    status = SENSOR_RELIABILITY_STATUS.FAULTY;
    weightForML = 0.0; // Excluded completely from ML inference
    actionRequired = 'FAULTY: Transducer requires calibration or replacement. Readings excluded from ML inference.';
  } else if (reliabilityScore < 85) {
    status = SENSOR_RELIABILITY_STATUS.DEGRADED;
    weightForML = reliabilityScore / 100.0; // Proportional down-weighting
    actionRequired = 'DEGRADED: Signal noise or minor latency detected. Model weights proportionally adjusted.';
  }

  return {
    sensorType,
    reliabilityScore,
    status,
    weightForML,
    metrics: {
      uptimeScore: Math.round(uptimeScore),
      stuckScore: Math.round(stuckScore),
      rangeScore: Math.round(rangeScore),
      jitterScore: Math.round(jitterScore),
      stuckDurationSeconds,
      recentStdDev: Number(stdDev.toFixed(3)),
      isWithinRange
    },
    actionRequired,
    evaluatedAt: new Date().toISOString()
  };
}
