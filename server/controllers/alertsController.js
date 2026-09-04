import { Alert } from '../models/Alert.js';
import { Log } from '../models/Log.js';

export async function getAlerts(req, res) {
  try {
    const { facilityId, status, severity } = req.query;
    const query = {};

    if (facilityId) query.facilityId = facilityId;
    if (status && status !== 'ALL') query.status = status;
    if (severity && severity !== 'ALL') query.severity = severity;

    const alerts = await Alert.find(query).sort({ createdAt: -1 }).lean();
    res.json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createAlert(req, res) {
  try {
    const {
      facilityId,
      title,
      description,
      severity,
      source,
      jointId,
      metrics,
      actionRequired
    } = req.body;

    const alertId = `ALT-${Date.now()}`;
    const alert = await Alert.create({
      id: alertId,
      facilityId: facilityId || 'nmdc-kirandul-cv101',
      title: title || 'Transducer Alarm',
      description: description || 'Threshold anomaly detected.',
      severity: severity || 'WARNING',
      source: source || 'Sensor Processing Unit',
      jointId: jointId || 'Joint-01',
      metrics: metrics || {},
      actionRequired: actionRequired || 'Inspect splice joint immediately.',
      status: 'ACTIVE'
    });

    // Automatically record log in MongoDB
    await Log.create({
      facilityId: alert.facilityId,
      level: alert.severity === 'CRITICAL' ? 'CRITICAL' : alert.severity === 'WARNING' ? 'WARN' : 'INFO',
      category: 'ALERT',
      source: alert.source,
      message: `[ALARM CREATED] ${alert.title}: ${alert.description}`,
      details: { alertId: alert.id, severity: alert.severity, jointId: alert.jointId, metrics: alert.metrics },
      jointId: alert.jointId,
      user: 'System Detector'
    });

    res.status(201).json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function acknowledgeAlert(req, res) {
  try {
    const { id } = req.params;
    const { user, remark } = req.body;

    const alert = await Alert.findOne({ id });
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedBy = user?.displayName || user?.name || 'Shift Operator';
    alert.acknowledgedAt = new Date();
    await alert.save();

    // Automatically record AUDIT log in MongoDB
    await Log.create({
      facilityId: alert.facilityId,
      level: 'INFO',
      category: 'AUDIT',
      source: 'Control Room Console',
      message: `[ALARM ACKNOWLEDGED] ${alert.id} (${alert.title}) acknowledged by ${alert.acknowledgedBy}. ${remark ? 'Note: ' + remark : ''}`,
      details: { alertId: alert.id, acknowledgedBy: alert.acknowledgedBy, remark },
      jointId: alert.jointId,
      user: alert.acknowledgedBy
    });

    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function resolveAlert(req, res) {
  try {
    const { id } = req.params;
    const { user, resolutionNote } = req.body;

    const alert = await Alert.findOne({ id });
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    alert.status = 'RESOLVED';
    alert.resolvedBy = user?.displayName || user?.name || 'Maintenance Engineer';
    alert.resolvedAt = new Date();
    alert.resolutionNote = resolutionNote || 'Inspection completed and problem resolved.';
    await alert.save();

    // Automatically record AUDIT log in MongoDB
    await Log.create({
      facilityId: alert.facilityId,
      level: 'INFO',
      category: 'MAINTENANCE',
      source: 'Maintenance Console',
      message: `[ALARM RESOLVED] ${alert.id} (${alert.title}) resolved by ${alert.resolvedBy}. Resolution: ${alert.resolutionNote}`,
      details: { alertId: alert.id, resolvedBy: alert.resolvedBy, resolutionNote: alert.resolutionNote },
      jointId: alert.jointId,
      user: alert.resolvedBy
    });

    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
