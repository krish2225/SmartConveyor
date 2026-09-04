import { VisionEvent } from '../models/VisionEvent.js';
import { Log } from '../models/Log.js';

export async function getVisionEvents(req, res) {
  try {
    const { facilityId = 'nmdc-kirandul-cv101', limit = 50 } = req.query;
    const events = await VisionEvent.find({ facilityId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10))
      .lean();
    res.json({ success: true, events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createVisionEvent(req, res) {
  try {
    const {
      facilityId,
      cameraLocation,
      beltDisplacementMeters,
      nearestJointId,
      defectType,
      confidence,
      severity,
      boundingBox,
      imageUrl,
      notes
    } = req.body;

    const eventId = `VIS-${Date.now()}`;
    const event = await VisionEvent.create({
      id: eventId,
      facilityId: facilityId || 'nmdc-kirandul-cv101',
      timestamp: new Date(),
      cameraLocation: cameraLocation || 'Feeder Station Line-Scan #1',
      beltDisplacementMeters: beltDisplacementMeters || 0,
      nearestJointId: nearestJointId || 'Joint-01',
      defectType: defectType || 'Normal Belt Surface',
      confidence: confidence || 0.95,
      severity: severity || 'OPTIMAL',
      boundingBox: boundingBox || null,
      imageUrl: imageUrl || null,
      notes: notes || ''
    });

    // Record Log in MongoDB if defect detected
    if (severity && severity !== 'OPTIMAL') {
      await Log.create({
        facilityId: event.facilityId,
        level: severity === 'CRITICAL' ? 'CRITICAL' : 'WARN',
        category: 'VISION',
        source: 'Line-Scan Vision AI',
        message: `[VISION DEFECT DETECTED] ${defectType} at ${beltDisplacementMeters}m (${nearestJointId}), Confidence: ${(confidence * 100).toFixed(1)}%`,
        details: { eventId: event.id, defectType, severity, confidence, nearestJointId },
        jointId: nearestJointId,
        user: 'Computer Vision Model'
      });
    }

    res.status(201).json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
