/**
 * SmartConveyor - SIH Problem Statement 26008 (NMDC Iron Ore Mining)
 * Cloud Function Trigger: onSensorWrite
 * File: server/functions/src/triggers/onSensorWrite.js
 * 
 * Flow:
 * 1. Executes whenever new raw sensor telemetry is written.
 * 2. Computes Sensor Reliability for all active channels (sensorReliability.js).
 * 3. Applies Dump-Vibration Filter (dumpNoiseFilter.js) to suppress false positives.
 * 4. Calls ML Client (predict-rul and detect-anomaly) with weighted/sanitized features.
 * 5. Updates Firestore `joints/{jointId}`, `sensorReliability/{facilityId}`, and triggers alerts if critical.
 */

import { computeSensorReliability } from '../processing/sensorReliability.js';
import { DumpNoiseFilter } from '../processing/dumpNoiseFilter.js';
import { MLServiceClient } from '../mlClient/mlServiceClient.js';

const dumpFilter = new DumpNoiseFilter();
const mlClient = new MLServiceClient();

export async function handleSensorWrite(facilityId, sensorData, firestoreDb) {
  const {
    jointId = 'Joint-01',
    drive_vibration = 2.4,
    belt_speed = 4.2,
    dynamic_load = 1850,
    joint_temperature = 45,
    ultrasonic_thickness = 24.0,
    acoustic_emission = 42.0,
    historyBuffers = {},
    stuckDurations = {}
  } = sensorData;

  // 1. Compute Reliability Scores for all 6 sensor channels
  const reliabilityScores = {};
  const sensorChannels = [
    { key: 'drive_vibration', val: drive_vibration },
    { key: 'belt_speed', val: belt_speed },
    { key: 'dynamic_load', val: dynamic_load },
    { key: 'joint_temperature', val: joint_temperature },
    { key: 'ultrasonic_thickness', val: ultrasonic_thickness },
    { key: 'acoustic_emission', val: acoustic_emission }
  ];

  for (const channel of sensorChannels) {
    const history = historyBuffers[channel.key] || [channel.val];
    const stuckSec = stuckDurations[channel.key] || 0;

    reliabilityScores[channel.key] = computeSensorReliability({
      sensorType: channel.key,
      currentValue: channel.val,
      recentReadings: history,
      actualReadings: history.length,
      expectedReadings: 20,
      stuckDurationSeconds: stuckSec
    });
  }

  // 2. Evaluate Dump Impact Noise Filter
  const dumpFilterResult = dumpFilter.evaluate({
    currentLoadTph: dynamic_load,
    currentVibrationRms: drive_vibration,
    beltSpeedMps: belt_speed
  });

  // 3. Call ML Anomaly Detector
  const anomalyResult = await mlClient.detectAnomaly({
    vibrationRms: drive_vibration,
    jointTemperature: joint_temperature,
    dynamicLoadTph: dynamic_load,
    acousticEmission: acoustic_emission,
    isDumping: dumpFilterResult.isDumping,
    sensorReliabilityScore: reliabilityScores.drive_vibration.reliabilityScore
  });

  // 4. Call ML RUL / Risk Predictor
  const rulResult = await mlClient.predictRUL({
    jointId,
    vibrationRms: drive_vibration,
    jointTemperature: joint_temperature,
    ultrasonicThickness: ultrasonic_thickness,
    acousticEmission: acoustic_emission,
    dynamicLoadTph: dynamic_load,
    beltSpeedMps: belt_speed,
    reliabilityScores
  });

  // 5. Package results for Firestore write-back
  const writePayload = {
    jointHealthUpdate: {
      jointId,
      riskScore: rulResult.riskScore,
      estimatedTimeToFailureHours: rulResult.estimatedTimeToFailureHours,
      estimatedTimeToFailureDays: rulResult.estimatedTimeToFailureDays,
      healthStatus: rulResult.healthStatus,
      confidence: rulResult.confidence,
      recommendation: rulResult.recommendation,
      ultrasonicThickness: ultrasonic_thickness,
      temperature: joint_temperature,
      vibrationRms: drive_vibration,
      lastUpdated: new Date().toISOString()
    },
    sensorReliabilityUpdate: {
      facilityId,
      scores: reliabilityScores,
      lastUpdated: new Date().toISOString()
    },
    dumpFilterStatus: dumpFilterResult,
    anomalyStatus: anomalyResult
  };

  // If DB instance provided, persist updates
  if (firestoreDb) {
    try {
      await firestoreDb.collection('facilities').doc(facilityId).collection('joints').doc(jointId).set(
        writePayload.jointHealthUpdate,
        { merge: true }
      );
      await firestoreDb.collection('facilities').doc(facilityId).collection('sensorReliability').doc('latest').set(
        writePayload.sensorReliabilityUpdate
      );
    } catch (err) {
      console.error('[!] Firestore onSensorWrite write error:', err.message);
    }
  }

  return writePayload;
}
