import { EmergencyStatus } from '../models/EmergencyStatus.js';
import { Alert } from '../models/Alert.js';
import { Log } from '../models/Log.js';

export async function getEmergencyStatus(req, res) {
  try {
    const { facilityId = 'nmdc-kirandul-cv101' } = req.query;
    let status = await EmergencyStatus.findOne({ facilityId }).lean();
    if (!status) {
      status = await EmergencyStatus.create({
        facilityId,
        emergencyStopActive: false,
        clearedBy: 'Site Admin',
        clearedAt: new Date(Date.now() - 3600000),
        clearRemark: 'Physical inspection completed. Conveyor line operating normally.'
      });
    }
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function triggerEmergencyStop(req, res) {
  try {
    const { facilityId = 'nmdc-kirandul-cv101', user, reason = 'Critical Splice Joint Rupture Risk' } = req.body;

    const status = await EmergencyStatus.findOneAndUpdate(
      { facilityId },
      {
        emergencyStopActive: true,
        triggeredBy: user?.displayName || user?.name || 'Shift Operator',
        role: user?.role || 'OPERATOR',
        reason,
        source: 'Control Station UI / Safety Interlock',
        triggeredAt: new Date(),
        clearedBy: null,
        clearedAt: null,
        clearRemark: null
      },
      { new: true, upsert: true }
    );

    // Create a Critical Alert in MongoDB
    const alertId = `ALT-ESTOP-${Date.now()}`;
    await Alert.create({
      id: alertId,
      facilityId,
      title: 'EMERGENCY STOP TRIGGERED',
      description: `${reason} - Conveyor drive motors halted immediately by ${status.triggeredBy}.`,
      severity: 'CRITICAL',
      source: 'Plant Emergency Interlock',
      jointId: 'ALL JOINTS',
      status: 'ACTIVE',
      metrics: { beltSpeed: 0.0 },
      actionRequired: 'Inspect cause of emergency stop before admin release.'
    });

    // Record CRITICAL log in MongoDB
    await Log.create({
      facilityId,
      level: 'CRITICAL',
      category: 'EMERGENCY',
      source: 'Safety Interlock Controller',
      message: `[PLANT EMERGENCY STOP TRIGGERED] Conveyor halted by ${status.triggeredBy}. Reason: ${reason}`,
      details: { triggeredBy: status.triggeredBy, role: status.role, reason, timestamp: status.triggeredAt },
      jointId: 'ALL JOINTS',
      user: status.triggeredBy
    });

    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function clearEmergencyStop(req, res) {
  try {
    const {
      facilityId = 'nmdc-kirandul-cv101',
      user,
      clearRemark = 'Physical joint inspection completed. Splicing secured. Ready for continuous ore transport.'
    } = req.body;

    const status = await EmergencyStatus.findOneAndUpdate(
      { facilityId },
      {
        emergencyStopActive: false,
        clearedBy: user?.displayName || user?.name || 'Site Admin',
        role: user?.role || 'SITE_ADMIN',
        clearRemark,
        clearedAt: new Date()
      },
      { new: true, upsert: true }
    );

    // Record AUDIT log in MongoDB
    await Log.create({
      facilityId,
      level: 'INFO',
      category: 'EMERGENCY',
      source: 'Admin Safety Clearance Console',
      message: `[EMERGENCY STOP CLEARED] Conveyor restarted by ${status.clearedBy}. Justification: ${clearRemark}`,
      details: { clearedBy: status.clearedBy, role: status.role, clearRemark, clearedAt: status.clearedAt },
      jointId: 'ALL JOINTS',
      user: status.clearedBy
    });

    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
