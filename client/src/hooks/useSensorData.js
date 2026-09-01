/**
 * SmartConveyor - useSensorData Hook
 * Listens to real-time multi-sensor telemetry and maintains rolling time-series buffer.
 */

import { useState, useEffect, useRef } from 'react';
import { listenToTelemetry } from '../firebase/firestore.js';

export function useSensorData(facilityId = 'nmdc-kirandul-cv101', bufferSize = 30) {
  const [currentTelemetry, setCurrentTelemetry] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const historyRef = useRef([]);

  useEffect(() => {
    const unsubscribe = listenToTelemetry(facilityId, data => {
      if (!data) return;
      setCurrentTelemetry(data);

      const newPoint = {
        timestamp: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        rawTimestamp: data.timestamp,
        ...data.sensors,
        isDumping: data.isDumping ? 1 : 0
      };

      const updated = [...historyRef.current, newPoint].slice(-bufferSize);
      historyRef.current = updated;
      setTelemetryHistory(updated);
    });

    return () => unsubscribe();
  }, [facilityId, bufferSize]);

  return {
    telemetry: currentTelemetry,
    history: telemetryHistory,
    sensors: currentTelemetry?.sensors || {},
    activeJointId: currentTelemetry?.activeJointId || 'Joint-01',
    isDumping: currentTelemetry?.isDumping || false
  };
}
