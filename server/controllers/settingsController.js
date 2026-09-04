import { FacilityConfig } from '../models/FacilityConfig.js';
import { Log } from '../models/Log.js';

export async function getFacilitySettings(req, res) {
  try {
    const { facilityId = 'nmdc-kirandul-cv101' } = req.query;
    let config = await FacilityConfig.findOne({ facilityId }).lean();
    if (!config) {
      config = await FacilityConfig.create({
        facilityId,
        name: 'NMDC Kirandul Complex - Deposit 14 (CV-101)',
        location: 'Bailadila Iron Ore Mine, Chhattisgarh',
        beltLengthMeters: 1200,
        beltWidthMm: 1600,
        beltRating: 'ST-5400 (Steel Cord)',
        nominalSpeedMps: 4.2,
        ratedCapacityTph: 2400,
        totalJoints: 6,
        thresholds: {
          maxVibration: 8.5,
          maxTemp: 85.0,
          minThickness: 15.0,
          dumpSurge: 350
        }
      });
    }
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateFacilitySettings(req, res) {
  try {
    const { facilityId = 'nmdc-kirandul-cv101', thresholds, user } = req.body;

    const config = await FacilityConfig.findOneAndUpdate(
      { facilityId },
      { thresholds },
      { new: true, upsert: true }
    );

    // Record AUDIT log in MongoDB
    await Log.create({
      facilityId,
      level: 'INFO',
      category: 'AUDIT',
      source: 'Calibration & Settings Console',
      message: `[CALIBRATION UPDATED] Sensor thresholds updated by ${user?.displayName || 'Admin'}. VibMax: ${thresholds?.maxVibration} mm/s, TempMax: ${thresholds?.maxTemp} °C, ThickMin: ${thresholds?.minThickness} mm`,
      details: { thresholds, updatedBy: user?.displayName || 'Admin' },
      user: user?.displayName || 'Admin'
    });

    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
