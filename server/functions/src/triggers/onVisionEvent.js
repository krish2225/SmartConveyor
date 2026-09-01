/**
 * SmartConveyor - SIH Problem Statement 26008 (NMDC Iron Ore Mining)
 * Cloud Function Trigger: onVisionEvent
 * File: server/functions/src/triggers/onVisionEvent.js
 * 
 * Flow:
 * 1. Triggered on distance-synchronized line-scan camera capture.
 * 2. Calls ML vision classification service (/classify-image).
 * 3. Applies consecutive frame merge logic (visionCaptureTrigger.js).
 * 4. Writes enriched vision incident document to Firestore `visionEvents/*`.
 * 5. Dispatches critical alarm if severe longitudinal tear or splice pull-out is detected.
 */

import { MLServiceClient } from '../mlClient/mlServiceClient.js';
import { VisionCaptureTrigger } from '../processing/visionCaptureTrigger.js';

const mlClient = new MLServiceClient();
const visionTrigger = new VisionCaptureTrigger();

export async function handleVisionCapture(facilityId, captureData, firestoreDb) {
  const {
    frameId = 'SCAN-001',
    beltDistanceMeters = 0,
    syntheticFeatures = null,
    imageRef = null
  } = captureData;

  // 1. Call ML Vision Classification Microservice
  const classificationResult = await mlClient.classifyImage({
    imageRef,
    frameId,
    beltDistanceMeters,
    syntheticFeatures
  });

  // 2. Apply consecutive frame merger logic
  const processedEvent = visionTrigger.processClassificationResult(classificationResult);

  // 3. Write back to Firestore
  if (firestoreDb && processedEvent.eventDoc) {
    try {
      const docId = processedEvent.incidentId || frameId;
      await firestoreDb.collection('facilities').doc(facilityId).collection('visionEvents').doc(docId).set(
        processedEvent.eventDoc,
        { merge: true }
      );
    } catch (err) {
      console.error('[!] Firestore onVisionEvent write error:', err.message);
    }
  }

  return processedEvent;
}
