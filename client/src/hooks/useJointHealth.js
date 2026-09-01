/**
 * SmartConveyor - useJointHealth Hook
 * Listens to live splice joint statuses, RUL predictions, and computes overall system risk.
 */

import { useState, useEffect } from 'react';
import { listenToJoints } from '../firebase/firestore.js';
import { JOINT_STATUS } from '../../../shared/constants.js';

export function useJointHealth(facilityId = 'nmdc-kirandul-cv101') {
  const [joints, setJoints] = useState([]);
  const [selectedJointId, setSelectedJointId] = useState('Joint-05');

  useEffect(() => {
    const unsubscribe = listenToJoints(facilityId, data => {
      if (Array.isArray(data)) {
        setJoints(data);
      }
    });

    return () => unsubscribe();
  }, [facilityId]);

  const selectedJoint = joints.find(j => j.jointId === selectedJointId) || joints[0] || null;

  // Compute composite Plant Joint Rupture Risk Index
  let highestRisk = 0;
  let criticalCount = 0;
  let warningCount = 0;
  let minRulDays = Infinity;

  joints.forEach(j => {
    if (j.riskScore > highestRisk) highestRisk = j.riskScore;
    if (j.estimatedTimeToFailureDays < minRulDays) minRulDays = j.estimatedTimeToFailureDays;
    if (j.healthStatus === JOINT_STATUS.CRITICAL_DELAMINATION) criticalCount++;
    if (j.healthStatus === JOINT_STATUS.ELEVATED_WEAR) warningCount++;
  });

  if (minRulDays === Infinity) minRulDays = 6.0;

  return {
    joints,
    selectedJoint,
    setSelectedJointId,
    overallRiskScore: Math.round(highestRisk),
    minRulDays,
    criticalCount,
    warningCount,
    healthyCount: joints.length - criticalCount - warningCount
  };
}
