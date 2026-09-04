import { ReliabilityLog } from '../models/ReliabilityLog.js';
import { Log } from '../models/Log.js';

export async function getLatestReliability(req, res) {
  try {
    const { facilityId = 'nmdc-kirandul-cv101' } = req.query;
    const latest = await ReliabilityLog.findOne({ facilityId }).sort({ timestamp: -1 }).lean();
    if (!latest) {
      // Default initial score response
      return res.json({
        success: true,
        reliability: {
          facilityId,
          fleetAverageScore: 90.3,
          scores: {
            drive_vibration: { sensorType: 'drive_vibration', reliabilityScore: 94, status: 'HEALTHY', weightForML: 1.0, metrics: { uptimeScore: 100, stuckScore: 100, rangeScore: 100, jitterScore: 88 } },
            belt_speed: { sensorType: 'belt_speed', reliabilityScore: 98, status: 'HEALTHY', weightForML: 1.0, metrics: { uptimeScore: 100, stuckScore: 100, rangeScore: 100, jitterScore: 96 } },
            dynamic_load: { sensorType: 'dynamic_load', reliabilityScore: 91, status: 'HEALTHY', weightForML: 1.0, metrics: { uptimeScore: 100, stuckScore: 100, rangeScore: 100, jitterScore: 78 } },
            joint_temperature: { sensorType: 'joint_temperature', reliabilityScore: 89, status: 'HEALTHY', weightForML: 1.0, metrics: { uptimeScore: 100, stuckScore: 100, rangeScore: 100, jitterScore: 82 } },
            ultrasonic_thickness: { sensorType: 'ultrasonic_thickness', reliabilityScore: 78, status: 'DEGRADED', weightForML: 0.78, metrics: { uptimeScore: 92, stuckScore: 100, rangeScore: 100, jitterScore: 65 } },
            acoustic_emission: { sensorType: 'acoustic_emission', reliabilityScore: 92, status: 'HEALTHY', weightForML: 1.0, metrics: { uptimeScore: 100, stuckScore: 100, rangeScore: 100, jitterScore: 84 } }
          },
          timestamp: new Date()
        }
      });
    }
    res.json({ success: true, reliability: latest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getReliabilityHistory(req, res) {
  try {
    const { facilityId = 'nmdc-kirandul-cv101', limit = 30 } = req.query;
    const history = await ReliabilityLog.find({ facilityId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10))
      .lean();
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function recordReliabilitySnapshot(req, res) {
  try {
    const { facilityId = 'nmdc-kirandul-cv101', scores, fleetAverageScore } = req.body;
    const log = await ReliabilityLog.create({
      facilityId,
      scores,
      fleetAverageScore: fleetAverageScore || 90.0,
      timestamp: new Date()
    });

    // If any sensor is degraded or faulty, log in Log collection
    Object.values(scores || {}).forEach(async s => {
      if (s.status === 'FAULTY' || s.status === 'DEGRADED') {
        await Log.create({
          facilityId,
          level: s.status === 'FAULTY' ? 'ERROR' : 'WARN',
          category: 'SENSOR',
          source: 'Sensor Reliability Engine',
          message: `[SENSOR ${s.status}] ${s.sensorType} reliability score is ${s.reliabilityScore}/100. Action required: ${s.actionRequired || 'Check sensor coupler and calibration.'}`,
          details: s,
          user: 'Reliability Daemon'
        });
      }
    });

    res.status(201).json({ success: true, log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
