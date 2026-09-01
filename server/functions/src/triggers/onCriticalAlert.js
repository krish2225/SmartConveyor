/**
 * SmartConveyor - SIH Problem Statement 26008 (NMDC Iron Ore Mining)
 * Cloud Function Trigger: onCriticalAlert
 * File: server/functions/src/triggers/onCriticalAlert.js
 * 
 * Flow:
 * 1. Creates alert documents in `alerts/{alertId}` with standard severity (CRITICAL, WARNING, INFO).
 * 2. Manages alert status transitions (ACTIVE -> ACKNOWLEDGED -> RESOLVED).
 * 3. Enriches alerts with physical telemetry context and recommended operator actions.
 */

import { ALERT_SEVERITY, ALERT_STATUS } from '../../../../shared/constants.js';

export async function createAlertDocument(facilityId, alertData, firestoreDb) {
  const alertId = alertData.id || `ALT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  const doc = {
    id: alertId,
    facilityId,
    title: alertData.title || 'Conveyor Belt Anomaly Detected',
    description: alertData.description || 'Abnormal sensor or vision reading requiring inspection.',
    severity: alertData.severity || ALERT_SEVERITY.WARNING,
    source: alertData.source || 'Sensors / Anomaly Model',
    jointId: alertData.jointId || 'System Wide',
    status: ALERT_STATUS.ACTIVE,
    metrics: alertData.metrics || {},
    actionRequired: alertData.actionRequired || 'Inspect splice joint on CV-101.',
    acknowledgedBy: null,
    acknowledgedAt: null,
    resolvedBy: null,
    resolvedAt: null,
    createdAt: now,
    updatedAt: now
  };

  if (firestoreDb) {
    try {
      await firestoreDb.collection('facilities').doc(facilityId).collection('alerts').doc(alertId).set(doc);
    } catch (err) {
      console.error('[!] Firestore createAlertDocument error:', err.message);
    }
  }

  return doc;
}
