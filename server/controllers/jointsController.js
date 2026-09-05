import { JointHealth } from '../models/JointHealth.js';
import { JointHealthHistory } from '../models/JointHealthHistory.js';
import { Log } from '../models/Log.js';

export async function getJoints(req, res) {
  try {
    const { facilityId = 'nmdc-kirandul-cv101' } = req.query;
    const joints = await JointHealth.find({ facilityId }).sort({ positionMeters: 1 }).lean();
    res.json({ success: true, joints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getJointById(req, res) {
  try {
    const { jointId } = req.params;
    const { facilityId = 'nmdc-kirandul-cv101' } = req.query;
    const joint = await JointHealth.findOne({ jointId, facilityId }).lean();
    if (!joint) {
      return res.status(404).json({ success: false, message: 'Joint not found.' });
    }
    res.json({ success: true, joint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateJointHealth(req, res) {
  try {
    const { jointId } = req.params;
    const { facilityId = 'nmdc-kirandul-cv101', updates, user } = req.body;

    const joint = await JointHealth.findOneAndUpdate(
      { jointId, facilityId },
      { ...updates, lastUpdated: new Date() },
      { new: true, upsert: true }
    );

    // Record snapshot in JointHealthHistory
    try {
      await JointHealthHistory.create({
        facilityId,
        jointId: joint.jointId,
        name: joint.name,
        timestamp: new Date(),
        healthScore: Math.max(0, Math.min(100, Math.round(100 - (joint.riskScore || 0)))),
        status: joint.healthStatus || 'OPTIMAL',
        riskScore: joint.riskScore || 0,
        estimatedTimeToFailureDays: joint.estimatedTimeToFailureDays || 100,
        estimatedTimeToFailureHours: joint.estimatedTimeToFailureHours || 2400,
        ultrasonicThickness: joint.ultrasonicThickness || 22.0,
        temperature: joint.temperature || 40.0,
        vibrationRms: joint.vibrationRms || 2.0,
        acousticEmission: joint.acousticEmission || 35.0,
        wearProgress: joint.wearProgress || 0.1
      });
    } catch (hErr) {
      // ignore
    }

    // Log update in MongoDB
    await Log.create({
      facilityId,
      level: joint.healthStatus === 'CRITICAL_DELAMINATION' ? 'WARN' : 'INFO',
      category: 'MAINTENANCE',
      source: 'Joint Health Service',
      message: `[JOINT HEALTH UPDATED] ${joint.jointId} (${joint.name}): Status=${joint.healthStatus}, Risk=${joint.riskScore}%, RUL=${joint.estimatedTimeToFailureDays}d`,
      details: updates,
      jointId: joint.jointId,
      user: user?.displayName || 'Automated ML Inference'
    });

    res.json({ success: true, joint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/joints/history/all
 * Retrieves historical health timeline for ALL joints across a time range.
 * Used by 3D Digital Twin for smooth time-travel playback scrubber.
 */
export async function getAllJointsHistory(req, res) {
  try {
    const {
      facilityId = 'nmdc-kirandul-cv101',
      from,
      to,
      limit = 1500
    } = req.query;

    const filter = { facilityId };

    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const history = await JointHealthHistory.find(filter)
      .sort({ timestamp: 1 })
      .limit(parseInt(limit, 10))
      .lean();

    const minTimestamp = history.length > 0 ? history[0].timestamp : null;
    const maxTimestamp = history.length > 0 ? history[history.length - 1].timestamp : null;

    res.json({
      success: true,
      count: history.length,
      facilityId,
      minTimestamp,
      maxTimestamp,
      history
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/joints/:jointId/history
 * Retrieves historical health timeline for a SINGLE joint.
 */
export async function getJointHistory(req, res) {
  try {
    const { jointId } = req.params;
    const {
      facilityId = 'nmdc-kirandul-cv101',
      from,
      to,
      limit = 500
    } = req.query;

    const filter = { facilityId, jointId };

    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const history = await JointHealthHistory.find(filter)
      .sort({ timestamp: 1 })
      .limit(parseInt(limit, 10))
      .lean();

    res.json({
      success: true,
      jointId,
      count: history.length,
      history
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
