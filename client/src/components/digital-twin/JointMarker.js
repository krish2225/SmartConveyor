/**
 * SmartConveyor - 3D Moving Joint Markers along Closed Belt Loop
 * SIH Problem Statement 26008 (NMDC Iron Ore Mining)
 * File: client/src/components/digital-twin/JointMarker.js
 */

import * as THREE from 'three';
import { JOINT_STATUS } from '../../../../shared/constants.js';
import { getPointAlongBeltPath, TOTAL_LOOP_LENGTH, BELT_WIDTH } from './BeltMesh.js';

/**
 * Creates the permanent 3D joint markers group along the closed loop.
 */
export function createJointMarkersGroup(joints = []) {
  const group = new THREE.Group();
  group.name = 'JointMarkersGroup';
  const jointMarkers = [];

  const totalJoints = joints.length || 6;

  joints.forEach((joint, idx) => {
    // Initial distance distributed evenly along the total closed loop perimeter
    const initialBeltPosition = (idx / totalJoints) * TOTAL_LOOP_LENGTH;

    const isCritical = joint.healthStatus === JOINT_STATUS.CRITICAL_DELAMINATION;
    const isWarning = joint.healthStatus === JOINT_STATUS.ELEVATED_WEAR;

    let markerColor = 0x10b981; // Green
    if (isCritical) markerColor = 0xef4444; // Red
    else if (isWarning) markerColor = 0xf59e0b; // Amber

    const markerSubGroup = new THREE.Group();
    markerSubGroup.name = `JointMarker_${joint.jointId}`;
    markerSubGroup.userData = {
      jointId: joint.jointId,
      jointData: joint,
      beltPosition: initialBeltPosition
    };

    // 1. Joint Seam Indicator Bar across belt width (Physical vulcanized splice line)
    const seamGeo = new THREE.BoxGeometry(0.5, 0.28, BELT_WIDTH - 0.2);
    const seamMat = new THREE.MeshStandardMaterial({
      color: markerColor,
      emissive: markerColor,
      emissiveIntensity: isCritical ? 0.9 : (isWarning ? 0.6 : 0.3),
      roughness: 0.3,
      metalness: 0.2
    });
    const seamMesh = new THREE.Mesh(seamGeo, seamMat);
    seamMesh.name = 'SeamBar';
    seamMesh.userData = { jointId: joint.jointId, jointData: joint };
    markerSubGroup.add(seamMesh);

    // 2. High-Visibility HUD Floating Status Pin (Diamond / Cone pointing at joint)
    const pinGeo = new THREE.ConeGeometry(0.5, 1.2, 4);
    pinGeo.rotateX(Math.PI);
    const pinMat = new THREE.MeshStandardMaterial({
      color: markerColor,
      emissive: markerColor,
      emissiveIntensity: 0.8,
      metalness: 0.5,
      roughness: 0.2
    });
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    pinMesh.name = 'StatusPin';
    pinMesh.position.set(0, 1.0, 0);
    pinMesh.userData = { jointId: joint.jointId, jointData: joint };
    markerSubGroup.add(pinMesh);

    // 3. Pulsing Halo Ring for Degraded / Critical Joints
    const ringGeo = new THREE.RingGeometry(0.6, 1.2, 24);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: markerColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: isCritical || isWarning ? 0.8 : 0.0
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(0, 0.1, 0);
    ringMesh.name = 'PulseRing';
    markerSubGroup.add(ringMesh);

    // Set initial position & orientation along belt path
    const { pos, tangent, normal } = getPointAlongBeltPath(initialBeltPosition);
    markerSubGroup.position.copy(pos);

    const rotationMatrix = new THREE.Matrix4();
    const up = normal.clone();
    const forward = tangent.clone();
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();
    rotationMatrix.makeBasis(forward, up, right);
    markerSubGroup.quaternion.setFromRotationMatrix(rotationMatrix);

    group.add(markerSubGroup);
    jointMarkers.push(markerSubGroup);
  });

  return {
    group,
    jointMarkers
  };
}

/**
 * Updates existing joint markers in-place when new Firestore telemetry arrives WITHOUT resetting position!
 */
export function updateJointMarkersData(jointMarkers = [], updatedJoints = []) {
  if (!jointMarkers || !updatedJoints) return;

  jointMarkers.forEach(marker => {
    const updated = updatedJoints.find(j => j.jointId === marker.userData.jointId);
    if (!updated) return;

    marker.userData.jointData = updated;

    const isCritical = updated.healthStatus === JOINT_STATUS.CRITICAL_DELAMINATION;
    const isWarning = updated.healthStatus === JOINT_STATUS.ELEVATED_WEAR;

    let markerColor = 0x10b981; // Green
    if (isCritical) markerColor = 0xef4444; // Red
    else if (isWarning) markerColor = 0xf59e0b; // Amber

    // Update seam material
    const seam = marker.getObjectByName('SeamBar');
    if (seam && seam.material) {
      seam.material.color.setHex(markerColor);
      seam.material.emissive.setHex(markerColor);
      seam.material.emissiveIntensity = isCritical ? 0.9 : (isWarning ? 0.6 : 0.3);
    }

    // Update pin material
    const pin = marker.getObjectByName('StatusPin');
    if (pin && pin.material) {
      pin.material.color.setHex(markerColor);
      pin.material.emissive.setHex(markerColor);
    }

    // Update ring visibility
    const ring = marker.getObjectByName('PulseRing');
    if (ring && ring.material) {
      ring.material.color.setHex(markerColor);
      ring.material.opacity = isCritical || isWarning ? 0.8 : 0.0;
    }
  });
}

/**
 * Advances moving joint positions and orientations every frame smoothly with delta time.
 */
export function updateJointsPosition(jointMarkers = [], speedMps = 4.2, delta = 0.016, speedMultiplier = 1.0) {
  if (speedMps <= 0) return;

  // Calibrated world speed: ~2.5 units/s at 4.2 m/s (35-40s loop)
  const worldSpeed = (speedMps / 4.2) * 2.5 * speedMultiplier;
  const distanceAdvance = worldSpeed * delta;

  jointMarkers.forEach(marker => {
    let currentS = marker.userData.beltPosition || 0;
    currentS = (currentS + distanceAdvance) % TOTAL_LOOP_LENGTH;
    marker.userData.beltPosition = currentS;

    const { pos, tangent, normal } = getPointAlongBeltPath(currentS);
    marker.position.copy(pos);

    const rotationMatrix = new THREE.Matrix4();
    const up = normal.clone();
    const forward = tangent.clone();
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();
    rotationMatrix.makeBasis(forward, up, right);
    marker.quaternion.setFromRotationMatrix(rotationMatrix);
  });
}
