import { JointHealth } from '../models/JointHealth.js';
import { JointHealthHistory } from '../models/JointHealthHistory.js';

const FACILITY_ID = 'nmdc-kirandul-cv101';

/**
 * Seeds a realistic 72-hour historical degradation timeline for all 6 splice joints.
 * This turns static data into an engaging 3D animated visual story.
 */
export async function seedInitialHistory(facilityId = FACILITY_ID) {
  try {
    const existingCount = await JointHealthHistory.countDocuments({ facilityId });
    if (existingCount >= 100) {
      console.log(`[JointHealthHistory] Found ${existingCount} historical snapshots. Skipping seed.`);
      return;
    }

    console.log(`[JointHealthHistory] Seeding 72-hour historical timeline for facility ${facilityId}...`);

    const now = Date.now();
    const totalHours = 72;
    const intervalMinutes = 30; // snapshot every 30 mins -> 144 points per joint
    const totalPoints = (totalHours * 60) / intervalMinutes;

    const jointDefinitions = [
      { id: 'Joint-01', name: 'Head Discharge Splice', pos: 0 },
      { id: 'Joint-02', name: 'Take-Up Bend Splice', pos: 200 },
      { id: 'Joint-03', name: 'Loading Chute Splice', pos: 400 },
      { id: 'Joint-04', name: 'Return Strand Splice', pos: 600 },
      { id: 'Joint-05', name: 'High Tension Curve Splice', pos: 800 },
      { id: 'Joint-06', name: 'Drive Drum Splice', pos: 1000 }
    ];

    const historyDocs = [];

    for (let step = 0; step <= totalPoints; step++) {
      // Progress from 0 (72h ago) to 1 (Now)
      const progress = step / totalPoints;
      const timestamp = new Date(now - (totalHours * 3600 * 1000) * (1 - progress));

      for (const joint of jointDefinitions) {
        let healthScore = 95;
        let status = 'OPTIMAL';
        let riskScore = 5;
        let rulDays = 150;
        let thickness = 22.0;
        let temp = 40.0;
        let vib = 2.0;
        let acoustic = 35.0;

        if (joint.id === 'Joint-01') {
          // Normal aging
          healthScore = Math.round(96 - progress * 2);
          status = 'OPTIMAL';
          riskScore = +(3.0 + progress * 1.2).toFixed(1);
          rulDays = +(145 - progress * 3).toFixed(1);
          thickness = +(22.0 - progress * 0.2).toFixed(1);
          temp = +(39.5 + Math.sin(step * 0.2) * 1.2).toFixed(1);
          vib = +(1.9 + progress * 0.2 + Math.cos(step * 0.1) * 0.1).toFixed(2);
          acoustic = +(34.0 + progress * 1.5).toFixed(1);
        } else if (joint.id === 'Joint-02') {
          // Normal aging
          healthScore = Math.round(93 - progress * 3);
          status = 'OPTIMAL';
          riskScore = +(6.5 + progress * 2.2).toFixed(1);
          rulDays = +(122 - progress * 3.5).toFixed(1);
          thickness = +(21.6 - progress * 0.4).toFixed(1);
          temp = +(41.0 + Math.sin(step * 0.2) * 1.5).toFixed(1);
          vib = +(2.1 + progress * 0.2 + Math.cos(step * 0.2) * 0.15).toFixed(2);
          acoustic = +(36.0 + progress * 2.0).toFixed(1);
        } else if (joint.id === 'Joint-03') {
          // Elevated wear from loading impact
          if (progress < 0.45) {
            status = 'OPTIMAL';
            healthScore = Math.round(82 - progress * 20);
            riskScore = +(18.0 + progress * 25).toFixed(1);
            rulDays = +(72 - progress * 30).toFixed(1);
            thickness = +(21.0 - progress * 1.8).toFixed(1);
            vib = +(3.2 + progress * 1.8).toFixed(2);
            temp = +(48.0 + progress * 8).toFixed(1);
            acoustic = +(42.0 + progress * 12).toFixed(1);
          } else {
            status = 'ELEVATED_WEAR';
            healthScore = Math.round(72 - (progress - 0.45) * 22);
            riskScore = +(30.0 + (progress - 0.45) * 20).toFixed(1);
            rulDays = +(58 - (progress - 0.45) * 24).toFixed(1);
            thickness = +(20.0 - (progress - 0.45) * 1.1).toFixed(1);
            vib = +(4.2 + (progress - 0.45) * 1.2).toFixed(2);
            temp = +(52.0 + (progress - 0.45) * 6).toFixed(1);
            acoustic = +(48.0 + (progress - 0.45) * 10).toFixed(1);
          }
        } else if (joint.id === 'Joint-04') {
          // Return strand nominal
          healthScore = Math.round(91 - progress * 3);
          status = 'OPTIMAL';
          riskScore = +(9.0 + progress * 3.5).toFixed(1);
          rulDays = +(104 - progress * 6).toFixed(1);
          thickness = +(21.2 - progress * 0.3).toFixed(1);
          temp = +(38.0 + Math.sin(step * 0.15) * 1.0).toFixed(1);
          vib = +(2.0 + progress * 0.4).toFixed(2);
          acoustic = +(35.0 + progress * 1.8).toFixed(1);
        } else if (joint.id === 'Joint-05') {
          // Dynamic Multi-Stage Degradation: Optimal -> Warning -> Critical!
          if (progress < 0.38) {
            // Stage 1: Optimal (72h to ~45h ago)
            status = 'OPTIMAL';
            healthScore = Math.round(90 - (progress / 0.38) * 16);
            riskScore = +(12.0 + (progress / 0.38) * 20).toFixed(1);
            rulDays = +(48 - (progress / 0.38) * 20).toFixed(1);
            thickness = +(21.0 - (progress / 0.38) * 1.8).toFixed(1);
            temp = +(44.0 + (progress / 0.38) * 8).toFixed(1);
            vib = +(2.8 + (progress / 0.38) * 1.6).toFixed(2);
            acoustic = +(38.0 + (progress / 0.38) * 12).toFixed(1);
          } else if (progress < 0.78) {
            // Stage 2: Elevated Wear & Cord Microcracking (45h to ~16h ago)
            status = 'ELEVATED_WEAR';
            const sub = (progress - 0.38) / 0.40;
            healthScore = Math.round(74 - sub * 34);
            riskScore = +(32.0 + sub * 38).toFixed(1);
            rulDays = +(28 - sub * 17).toFixed(1);
            thickness = +(19.2 - sub * 1.8).toFixed(1);
            temp = +(52.0 + sub * 14).toFixed(1);
            vib = +(4.4 + sub * 2.0).toFixed(2);
            acoustic = +(50.0 + sub * 18).toFixed(1);
          } else {
            // Stage 3: Critical Delamination (Last 16h to Present)
            status = 'CRITICAL_DELAMINATION';
            const sub = (progress - 0.78) / 0.22;
            healthScore = Math.round(39 - sub * 23);
            riskScore = +(70.0 + sub * 19.2).toFixed(1);
            rulDays = +(11.0 - sub * 5.0).toFixed(1);
            thickness = +(17.4 - sub * 1.2).toFixed(1);
            temp = +(66.0 + sub * 8.5).toFixed(1);
            vib = +(6.4 + sub * 1.5).toFixed(2);
            acoustic = +(68.0 + sub * 10.4).toFixed(1);
          }
        } else if (joint.id === 'Joint-06') {
          // Drive drum pristine
          healthScore = Math.round(98 - progress * 1);
          status = 'OPTIMAL';
          riskScore = +(2.0 + progress * 1.1).toFixed(1);
          rulDays = +(168 - progress * 8).toFixed(1);
          thickness = +(22.8 - progress * 0.4).toFixed(1);
          temp = +(42.0 + Math.cos(step * 0.2) * 1.2).toFixed(1);
          vib = +(1.8 + progress * 0.1).toFixed(2);
          acoustic = +(33.0 + progress * 1.2).toFixed(1);
        }

        historyDocs.push({
          facilityId,
          jointId: joint.id,
          name: joint.name,
          timestamp,
          healthScore,
          status,
          riskScore,
          estimatedTimeToFailureDays: rulDays,
          estimatedTimeToFailureHours: Math.round(rulDays * 24),
          ultrasonicThickness: thickness,
          temperature: temp,
          vibrationRms: vib,
          acousticEmission: acoustic,
          wearProgress: +(1.0 - healthScore / 100).toFixed(3)
        });
      }
    }

    await JointHealthHistory.insertMany(historyDocs, { ordered: false });
    console.log(`[JointHealthHistory] Successfully seeded ${historyDocs.length} historical playback snapshots!`);
  } catch (err) {
    console.error('[JointHealthHistory Seed Error]:', err.message);
  }
}

/**
 * Periodically records current computed JointHealth documents into history every 10 minutes.
 */
export function startHistoryRecorder(facilityId = FACILITY_ID, intervalMs = 10 * 60 * 1000) {
  // Run initial seed check
  seedInitialHistory(facilityId);

  // Periodic sampling timer
  const timer = setInterval(async () => {
    try {
      const joints = await JointHealth.find({ facilityId }).lean();
      if (!joints || joints.length === 0) return;

      const now = new Date();
      const docs = joints.map(j => ({
        facilityId,
        jointId: j.jointId,
        name: j.name,
        timestamp: now,
        healthScore: Math.max(0, Math.min(100, Math.round(100 - (j.riskScore || 0)))),
        status: j.healthStatus || 'OPTIMAL',
        riskScore: j.riskScore || 0,
        estimatedTimeToFailureDays: j.estimatedTimeToFailureDays || 100,
        estimatedTimeToFailureHours: j.estimatedTimeToFailureHours || 2400,
        ultrasonicThickness: j.ultrasonicThickness || 22.0,
        temperature: j.temperature || 40.0,
        vibrationRms: j.vibrationRms || 2.0,
        acousticEmission: j.acousticEmission || 35.0,
        wearProgress: j.wearProgress || 0.1
      }));

      await JointHealthHistory.insertMany(docs, { ordered: false });
      console.log(`[JointHealthHistory] Recorded periodic snapshot for ${docs.length} joints at ${now.toISOString()}`);
    } catch (err) {
      console.warn('[JointHealthHistory] Periodic recording failed:', err.message);
    }
  }, intervalMs);

  return () => clearInterval(timer);
}
