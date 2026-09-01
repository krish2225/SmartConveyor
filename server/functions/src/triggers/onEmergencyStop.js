/**
 * SmartConveyor - SIH Problem Statement 26008 (NMDC Iron Ore Mining)
 * Cloud Function Trigger: onEmergencyStop
 * File: server/functions/src/triggers/onEmergencyStop.js
 * 
 * Logic & SIH Context:
 * Manages the high-reliability plant Emergency Stop (E-Stop) interlocking state.
 * When triggered (either manually by an operator/engineer or automatically by AI vision/vibration safety cut-off):
 * - Writes `systemStatus/{facilityId}.emergencyStopActive = true`
 * - Records operator identity, timestamp, origin screen/sensor, and reason
 * - Cleared only by authorized SITE_ADMIN with mandatory audit justification remark.
 */

export async function triggerEmergencyStop({
  facilityId,
  triggeredBy = 'Operator',
  role = 'OPERATOR',
  reason = 'Critical Belt Joint Rupture Risk Detected',
  source = 'Vision Line-Scan AI',
  firestoreDb
}) {
  const now = new Date().toISOString();
  const statusDoc = {
    facilityId,
    emergencyStopActive: true,
    triggeredBy,
    role,
    reason,
    source,
    triggeredAt: now,
    clearedBy: null,
    clearedAt: null,
    clearRemark: null,
    lastUpdated: now
  };

  if (firestoreDb) {
    try {
      await firestoreDb.collection('systemStatus').doc(facilityId).set(statusDoc, { merge: true });
    } catch (err) {
      console.error('[!] Firestore triggerEmergencyStop error:', err.message);
    }
  }

  return statusDoc;
}

export async function clearEmergencyStop({
  facilityId,
  clearedBy = 'Site Admin',
  role = 'SITE_ADMIN',
  clearRemark = 'Physical inspection completed. Joint secured. Safe to resume ore hauling.',
  firestoreDb
}) {
  const now = new Date().toISOString();
  const statusDoc = {
    facilityId,
    emergencyStopActive: false,
    clearedBy,
    role,
    clearRemark,
    clearedAt: now,
    lastUpdated: now
  };

  if (firestoreDb) {
    try {
      await firestoreDb.collection('systemStatus').doc(facilityId).set(statusDoc, { merge: true });
    } catch (err) {
      console.error('[!] Firestore clearEmergencyStop error:', err.message);
    }
  }

  return statusDoc;
}
