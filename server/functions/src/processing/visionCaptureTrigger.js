/**
 * SmartConveyor - SIH Problem Statement 26008 (NMDC Iron Ore Mining)
 * Module: Belt-Distance-Triggered Computer Vision Capture & Consecutive Frame Merger
 * File: server/functions/src/processing/visionCaptureTrigger.js
 * 
 * Logic & SIH Context:
 * Line-scan inspection cameras must be synchronized with conveyor linear displacement (meters traversed),
 * rather than fixed time intervals, because belt speed varies continuously under variable motor torque & ore loads.
 * 
 * Features:
 * 1. Integrates live belt speed (v) over time interval (dt) to update cumulative belt position:
 *    Δd = v * Δt
 * 2. Triggers a camera capture frame whenever distance traversed exceeds `captureDistanceIntervalMeters` (e.g. 50m).
 * 3. De-duplication / Consecutive-frame merger:
 *    If the same defect classification is detected in 2+ consecutive frames on the same belt section,
 *    merges them into a single ongoing incident document with expanded bounding box & updated severity,
 *    preventing operator alert fatigue.
 */

export class VisionCaptureTrigger {
  constructor({
    captureDistanceIntervalMeters = 50.0, // Camera line-scan trigger interval
    beltLengthMeters = 1200.0,
    consecutiveMergeDistanceThresholdMeters = 25.0
  } = {}) {
    this.captureDistanceIntervalMeters = captureDistanceIntervalMeters;
    this.beltLengthMeters = beltLengthMeters;
    this.consecutiveMergeDistanceThresholdMeters = consecutiveMergeDistanceThresholdMeters;

    this.currentBeltDistanceMeters = 0.0;
    this.lastCaptureDistanceMeters = 0.0;
    this.lastTimestamp = 0;
    this.frameSequenceCounter = 1000;

    // Track active defect incidents for consecutive frame merging
    this.activeDefectIncidents = new Map(); // key: defectType_approxLocation -> incidentObj
    this.lastFrameClassification = null;
  }

  /**
   * Updates displacement with live speed and determines if a line-scan capture should fire.
   * 
   * @param {Object} params
   * @param {number} params.beltSpeedMps - Current linear speed from tachometer / speed encoder (m/s)
   * @param {number} [params.timestamp] - Current timestamp
   * @returns {Object} Trigger evaluation
   */
  updateAndEvaluate({
    beltSpeedMps = 4.2,
    timestamp = Date.now()
  }) {
    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp;
      return { shouldCapture: false, currentBeltDistanceMeters: 0.0 };
    }

    const dtSeconds = Math.max(0.001, (timestamp - this.lastTimestamp) / 1000.0);
    this.lastTimestamp = timestamp;

    // Distance integration: Δd = v * Δt
    const deltaDistance = beltSpeedMps * dtSeconds;
    this.currentBeltDistanceMeters = (this.currentBeltDistanceMeters + deltaDistance) % this.beltLengthMeters;

    const distanceSinceLastCapture = Math.abs(this.currentBeltDistanceMeters - this.lastCaptureDistanceMeters);
    const shouldCapture = distanceSinceLastCapture >= this.captureDistanceIntervalMeters;

    let captureEvent = null;
    if (shouldCapture) {
      this.frameSequenceCounter++;
      this.lastCaptureDistanceMeters = this.currentBeltDistanceMeters;

      captureEvent = {
        frameId: `SCAN-FRM-${this.frameSequenceCounter}`,
        beltDistanceMeters: Number(this.currentBeltDistanceMeters.toFixed(2)),
        timestamp: new Date(timestamp).toISOString(),
        beltSpeedAtCaptureMps: Number(beltSpeedMps.toFixed(2)),
        resolution: '4096x2048 LineScan RAW',
        inspectionMode: 'BELT_DISTANCE_ENCODER_TRIGGERED'
      };
    }

    return {
      shouldCapture,
      currentBeltDistanceMeters: Number(this.currentBeltDistanceMeters.toFixed(2)),
      captureEvent
    };
  }

  /**
   * Processes vision ML classification result, handling consecutive frame merging.
   * 
   * @param {Object} classificationResult - Result from ML vision service
   * @returns {Object} Merged or newly created vision event
   */
  processClassificationResult(classificationResult) {
    const {
      frameId,
      beltDistanceMeters,
      classification,
      isDefect,
      confidence,
      severity,
      boundingBoxes = [],
      defectParameters = {},
      recommendedAction
    } = classificationResult;

    if (!isDefect || classification === 'Normal Belt Surface') {
      this.lastFrameClassification = null;
      return {
        actionType: 'NORMAL_FRAME',
        eventDoc: {
          frameId,
          beltDistanceMeters,
          classification: 'Normal Belt Surface',
          isDefect: false,
          confidence,
          severity: 'NOMINAL',
          timestamp: new Date().toISOString()
        }
      };
    }

    // Check for consecutive frame match
    let isConsecutiveMerge = false;
    let targetIncidentId = null;

    for (const [incidentKey, incident] of this.activeDefectIncidents.entries()) {
      const distanceDiff = Math.abs(beltDistanceMeters - incident.beltDistanceMeters);
      const isSameDefect = incident.classification === classification;

      if (isSameDefect && distanceDiff <= this.consecutiveMergeDistanceThresholdMeters) {
        isConsecutiveMerge = true;
        targetIncidentId = incidentKey;
        break;
      }
    }

    const now = new Date().toISOString();

    if (isConsecutiveMerge && targetIncidentId) {
      // MERGE with existing ongoing incident document
      const existing = this.activeDefectIncidents.get(targetIncidentId);
      existing.consecutiveFrameCount += 1;
      existing.lastUpdated = now;
      existing.maxConfidence = Math.max(existing.maxConfidence, confidence);
      existing.associatedFrames.push(frameId);

      // Expand defect dimensions if larger in second frame
      existing.defectParameters.crackLengthMm = Math.max(
        existing.defectParameters.crackLengthMm || 0,
        defectParameters.crackLengthMm || 0
      );
      existing.defectParameters.tearWidthMm = Math.max(
        existing.defectParameters.tearWidthMm || 0,
        defectParameters.tearWidthMm || 0
      );
      existing.defectParameters.surfaceAreaDamagedMm2 = Math.max(
        existing.defectParameters.surfaceAreaDamagedMm2 || 0,
        defectParameters.surfaceAreaDamagedMm2 || 0
      );

      return {
        actionType: 'CONSECUTIVE_MERGE',
        incidentId: targetIncidentId,
        consecutiveFrameCount: existing.consecutiveFrameCount,
        eventDoc: existing
      };
    } else {
      // CREATE new incident document
      const newIncidentKey = `INC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newIncidentDoc = {
        incidentId: newIncidentKey,
        frameId,
        associatedFrames: [frameId],
        consecutiveFrameCount: 1,
        beltDistanceMeters,
        classification,
        isDefect: true,
        confidence,
        maxConfidence: confidence,
        severity,
        boundingBoxes,
        defectParameters,
        recommendedAction,
        firstDetected: now,
        lastUpdated: now,
        status: 'ACTIVE'
      };

      this.activeDefectIncidents.set(newIncidentKey, newIncidentDoc);
      // Clean up older incidents if map grows large
      if (this.activeDefectIncidents.size > 50) {
        const oldestKey = this.activeDefectIncidents.keys().next().value;
        this.activeDefectIncidents.delete(oldestKey);
      }

      return {
        actionType: 'NEW_INCIDENT',
        incidentId: newIncidentKey,
        eventDoc: newIncidentDoc
      };
    }
  }
}
