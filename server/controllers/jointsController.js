import { JointHealth } from '../models/JointHealth.js';
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
