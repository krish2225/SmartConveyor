/**
 * SmartConveyor - useEmergencyStatus Hook
 * Global hook listening to facility Emergency Stop interlock status.
 */

import { useState, useEffect } from 'react';
import { listenToEmergencyStatus } from '../firebase/firestore.js';

export function useEmergencyStatus(facilityId = 'nmdc-kirandul-cv101') {
  const [status, setStatus] = useState({
    facilityId,
    emergencyStopActive: false,
    triggeredBy: null,
    role: null,
    reason: null,
    source: null,
    triggeredAt: null,
    clearedBy: null,
    clearedAt: null,
    clearRemark: null
  });

  useEffect(() => {
    const unsubscribe = listenToEmergencyStatus(facilityId, data => {
      if (data) {
        setStatus(data);
      }
    });

    return () => unsubscribe();
  }, [facilityId]);

  return {
    ...status,
    isEStopActive: Boolean(status.emergencyStopActive)
  };
}
