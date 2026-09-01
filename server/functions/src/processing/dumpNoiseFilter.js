/**
 * SmartConveyor - SIH Problem Statement 26008 (NMDC Iron Ore Mining)
 * Module: Dump-Vibration False Positive Filter
 * File: server/functions/src/processing/dumpNoiseFilter.js
 * 
 * Logic & SIH Context:
 * In heavy iron ore mining (NMDC Kirandul / Bacheli), 80-ton haul dump trucks and primary crushers
 * discharge large boulders into the conveyor feed chute, causing massive transient mechanical shock waves.
 * Standard vibration monitors trigger false rupture alarms during dumping.
 * 
 * This filter:
 * 1. Tracks rate-of-change of dynamic belt load (dLoad/dt).
 * 2. Flags `isDumping = true` for an impact suppression window (4.5 seconds) upon load surge.
 * 3. Suppresses transient vibration spikes occurring within the active dump window.
 * 4. Verifies whether candidate defect vibration peaks repeat cyclically at the belt joint harmonic frequency:
 *    f_joint = beltSpeed / beltLength
 */

export class DumpNoiseFilter {
  constructor({
    loadSurgeThresholdTph = 350,  // Surge >= 350 t/h in < 1.5s indicates ore chute discharge
    dumpWindowDurationMs = 4500,  // Active suppression window
    beltLengthMeters = 1200,      // Belt loop circumference
    jointHarmonicTolerance = 0.15 // Frequency tolerance window
  } = {}) {
    this.loadSurgeThresholdTph = loadSurgeThresholdTph;
    this.dumpWindowDurationMs = dumpWindowDurationMs;
    this.beltLengthMeters = beltLengthMeters;
    this.jointHarmonicTolerance = jointHarmonicTolerance;

    this.lastLoadReading = null;
    this.lastLoadTimestamp = 0;
    this.dumpWindowExpiresAt = 0;
    this.vibrationPeakHistory = []; // Timestamps of recent vibration spikes
  }

  /**
   * Evaluates incoming load and vibration telemetry to filter false dump shocks.
   * 
   * @param {Object} params
   * @param {number} params.currentLoadTph - Dynamic belt load in tons/hour
   * @param {number} params.currentVibrationRms - Vibration in mm/s
   * @param {number} params.beltSpeedMps - Linear belt speed in m/s
   * @param {number} [params.timestamp] - Unix epoch in ms
   * @returns {Object} Filter assessment result
   */
  evaluate({
    currentLoadTph,
    currentVibrationRms,
    beltSpeedMps = 4.2,
    timestamp = Date.now()
  }) {
    // 1. Detect dynamic load surge (Ore Dumping Event from Chute / Feeder)
    let loadDelta = 0;
    let timeDeltaSec = 1.0;

    if (this.lastLoadReading !== null && this.lastLoadTimestamp > 0) {
      timeDeltaSec = Math.max(0.1, (timestamp - this.lastLoadTimestamp) / 1000.0);
      loadDelta = currentLoadTph - this.lastLoadReading;
      const rateOfLoadIncrease = loadDelta / timeDeltaSec; // t/h per second

      // If load rate increases rapidly (hopper chute discharge impact)
      if (loadDelta >= this.loadSurgeThresholdTph || rateOfLoadIncrease > 250) {
        this.dumpWindowExpiresAt = timestamp + this.dumpWindowDurationMs;
      }
    }

    this.lastLoadReading = currentLoadTph;
    this.lastLoadTimestamp = timestamp;

    const isDumping = timestamp < this.dumpWindowExpiresAt;
    const isVibrationHigh = currentVibrationRms >= 5.5; // Candidate vibration spike

    // 2. Multi-Cycle Joint Passing Harmonic Verification
    // Calculate expected joint passing cycle period T = L / v
    const expectedCycleSeconds = beltSpeedMps > 0 ? (this.beltLengthMeters / beltSpeedMps) : 300;
    let isHarmonicRepeating = false;
    let cycleCorrelationScore = 0.0;

    if (isVibrationHigh) {
      this.vibrationPeakHistory.push(timestamp);
      // Retain last 20 peaks
      if (this.vibrationPeakHistory.length > 20) {
        this.vibrationPeakHistory.shift();
      }

      // Check time intervals between consecutive vibration peaks
      if (this.vibrationPeakHistory.length >= 2) {
        const intervals = [];
        for (let i = 1; i < this.vibrationPeakHistory.length; i++) {
          intervals.push((this.vibrationPeakHistory[i] - this.vibrationPeakHistory[i - 1]) / 1000.0);
        }

        // Check if any interval aligns with expected joint passing period T or T/N
        const matchingIntervals = intervals.filter(dt => {
          const ratio = dt / expectedCycleSeconds;
          const nearestInteger = Math.round(ratio);
          if (nearestInteger < 1) return false;
          const diff = Math.abs(ratio - nearestInteger);
          return diff <= this.jointHarmonicTolerance;
        });

        if (matchingIntervals.length >= 1) {
          isHarmonicRepeating = true;
          cycleCorrelationScore = Math.min(1.0, 0.4 + matchingIntervals.length * 0.2);
        }
      }
    }

    // 3. Forwarding Decision Logic (SIH PS 26008 Specification)
    // Only forward vibration spike to ML anomaly model if:
    // a) NOT inside dump-flagged window
    // b) Repeated across multiple belt rotations OR exceeds extreme physical danger limit (> 12 mm/s)
    let shouldForwardToML = false;
    let filterReason = 'Normal telemetry stream.';

    if (isVibrationHigh) {
      if (isDumping) {
        shouldForwardToML = false;
        filterReason = 'VIBRATION_SPIKE_SUPPRESSED: Transient chute ore impact shock wave detected during active dump window.';
      } else if (isHarmonicRepeating || currentVibrationRms > 9.5) {
        shouldForwardToML = true;
        filterReason = 'TRUE_DEFECT_CANDIDATE: Persistent periodic joint-harmonic vibration detected outside dump window.';
      } else {
        // Single isolated non-repeating bump outside dump window
        shouldForwardToML = false;
        filterReason = 'ISOLATED_TRANSIENT_FILTERED: Non-repeating stochastic noise spike suppressed.';
      }
    }

    return {
      isDumping,
      dumpWindowRemainingMs: Math.max(0, this.dumpWindowExpiresAt - timestamp),
      isVibrationHigh,
      isHarmonicRepeating,
      cycleCorrelationScore,
      shouldForwardToML,
      filterReason,
      expectedCycleSeconds: Math.round(expectedCycleSeconds)
    };
  }
}
