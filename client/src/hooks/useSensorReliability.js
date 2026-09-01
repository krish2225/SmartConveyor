/**
 * SmartConveyor - useSensorReliability Hook
 * Listens to physics-informed sensor reliability scores and data quality metrics.
 */

import { useState, useEffect } from 'react';
import { listenToSensorReliability } from '../firebase/firestore.js';
import { SENSOR_RELIABILITY_STATUS } from '../../../shared/constants.js';

export function useSensorReliability(facilityId = 'nmdc-kirandul-cv101') {
  const [reliabilityData, setReliabilityData] = useState(null);

  useEffect(() => {
    const unsubscribe = listenToSensorReliability(facilityId, data => {
      if (data) {
        setReliabilityData(data);
      }
    });

    return () => unsubscribe();
  }, [facilityId]);

  const scores = reliabilityData?.scores || {};
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
