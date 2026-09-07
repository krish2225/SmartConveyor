/**
 * SmartConveyor - useSensorReliability Hook
 * Listens to physics-informed sensor reliability scores and data quality metrics.
 */

import { useState, useEffect } from 'react';
import { listenToSensorReliability } from '../firebase/firestore.js';
import { SENSOR_RELIABILITY_STATUS } from '../../../shared/constants.js';

const DEFAULT_RELIABILITY_DATA = {
  facilityId: 'nmdc-kirandul-cv101',
  fleetAverageScore: 92,
  scores: {
    drive_vibration: {
      sensorType: 'drive_vibration',
      reliabilityScore: 94,
      status: SENSOR_RELIABILITY_STATUS.HEALTHY,
      weightForML: 1.0,
      metrics: { uptimeScore: 100, stuckScore: 100, rangeScore: 100, jitterScore: 88 },
      actionRequired: 'Signal cross-validated. Operating nominally.'
    },
    belt_speed: {
      sensorType: 'belt_speed',
      reliabilityScore: 98,
      status: SENSOR_RELIABILITY_STATUS.HEALTHY,
      weightForML: 1.0,
      metrics: { uptimeScore: 100, stuckScore: 100, rangeScore: 100, jitterScore: 96 },
      actionRequired: 'Encoder pulses clean and calibrated.'
    },
    dynamic_load: {
      sensorType: 'dynamic_load',
      reliabilityScore: 91,
      status: SENSOR_RELIABILITY_STATUS.HEALTHY,
      weightForML: 1.0,
      metrics: { uptimeScore: 100, stuckScore: 100, rangeScore: 100, jitterScore: 78 },
      actionRequired: 'Load cell strain gauges verified within tolerance.'
    },
    joint_temperature: {
      sensorType: 'joint_temperature',
      reliabilityScore: 89,
      status: SENSOR_RELIABILITY_STATUS.HEALTHY,
      weightForML: 1.0,
      metrics: { uptimeScore: 100, stuckScore: 100, rangeScore: 100, jitterScore: 82 },
      actionRequired: 'Infrared pyrometer calibrated (45°C nominal).'
    },
    ultrasonic_thickness: {
      sensorType: 'ultrasonic_thickness',
      reliabilityScore: 78,
      status: SENSOR_RELIABILITY_STATUS.DEGRADED,
      weightForML: 0.78,
      metrics: { uptimeScore: 92, stuckScore: 100, rangeScore: 100, jitterScore: 65 },
      actionRequired: 'Coupling gel degraded; ML down-weights this input.'
    },
    acoustic_emission: {
      sensorType: 'acoustic_emission',
      reliabilityScore: 92,
      status: SENSOR_RELIABILITY_STATUS.HEALTHY,
      weightForML: 1.0,
      metrics: { uptimeScore: 100, stuckScore: 100, rangeScore: 100, jitterScore: 84 },
      actionRequired: 'Piezoelectric transducer verified.'
    }
  }
};

export function useSensorReliability(facilityId = 'nmdc-kirandul-cv101') {
  const [reliabilityData, setReliabilityData] = useState(DEFAULT_RELIABILITY_DATA);

  useEffect(() => {
    const unsubscribe = listenToSensorReliability(facilityId, data => {
      if (data) {
        if (data.scores) {
          setReliabilityData(data);
        } else if (typeof data === 'object' && Object.keys(data).length > 0) {
          setReliabilityData(prev => ({
            ...prev,
            scores: data
          }));
        }
      }
    });

    return () => unsubscribe();
  }, [facilityId]);

  const scores = reliabilityData?.scores || DEFAULT_RELIABILITY_DATA.scores;
  const scoreList = Object.values(scores);

  const fleetAverageScore = scoreList.length > 0
    ? Math.round(scoreList.reduce((acc, s) => acc + (s.reliabilityScore || 0), 0) / scoreList.length)
    : 92;

  const healthyCount = scoreList.filter(s => s.status === SENSOR_RELIABILITY_STATUS.HEALTHY).length;
  const degradedCount = scoreList.filter(s => s.status === SENSOR_RELIABILITY_STATUS.DEGRADED).length;
  const faultyCount = scoreList.filter(s => s.status === SENSOR_RELIABILITY_STATUS.FAULTY).length;

  return {
    reliabilityData,
    scores,
    scoreList,
    fleetAverageScore,
    healthyCount,
    degradedCount,
    faultyCount,
    lastUpdated: reliabilityData?.lastUpdated
  };
}
