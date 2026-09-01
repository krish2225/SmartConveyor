/**
 * SmartConveyor - Real Industrial Conveyor Defect Photographs & Ground Truth YOLO Bounding Boxes
 * File: client/src/assets/sampleScans.js
 */

import surfaceWearWarningImg from './vision-samples/surface_wear_warning.jpg';
import criticalRuptureImg from './vision-samples/critical_rupture.jpg';
import spliceDelamImg from './vision-samples/splice_delamination.jpg';
import longTearImg from './vision-samples/longitudinal_tear.jpg';
import surfaceCrackImg from './vision-samples/surface_crack.jpg';
import normalBeltImg from './vision-samples/normal_belt.jpg';
import thermalHotspotImg from './vision-samples/thermal_hotspot.jpg';

export const SAMPLE_CONVEYOR_SCANS = [
  {
    incidentId: 'INC-WARN-01',
    frameId: 'SCAN-FRM-1090',
    beltDistanceMeters: 580.0,
    linkedJointId: 'Joint-04',
    linkedJointName: 'Joint 04 (Main Carrying Mid-Span Splice)',
    sector: 'Sector 4 (Intermediate Carrying Strand)',
    camera: 'CAM-04A | Surface Profile Imager',
    timestamp: new Date().toISOString(),
    classification: 'WARNING - Top Rubber Cover Fatigue & Crazing',
    defectType: 'Surface Fatigue & Crazing',
    isDefect: true,
    confidence: 0.926,
    severity: 'WARNING',
    consecutiveFrameCount: 2,
    imageUrl: surfaceWearWarningImg,
    boundingBox: {
      x: 0.15,
      y: 0.25,
      width: 0.70,
      height: 0.52,
      label: 'Surface Fatigue Wear',
      confidence: 0.926
    },
    defectParameters: {
      lengthMm: 850.0,
      widthMm: 45.0,
      depthMm: 4.2,
      growthRatePctHr: 2.8,
      surfaceAreaDamagedMm2: 38250.0,
      affectedCordLayer: 'Top Rubber Cover Only (Steel Cords 100% Intact)',
      thermalHotspotTempC: 48.2,
      beltThicknessMm: 22.4
    },
    recommendedAction: 'Log in maintenance backlog. Apply cold-cure compound during upcoming planned shutdown.'
  },
  {
    incidentId: 'INC-CRIT-01',
    frameId: 'SCAN-FRM-1204',
    beltDistanceMeters: 780.5,
    linkedJointId: 'Joint-05',
    linkedJointName: 'Joint 05 (Tail Pulley Transition Splice)',
    sector: 'Sector 3 (Tail Pulley Transition Zone)',
    camera: 'CAM-03A | High-Speed Impact Scanner',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    classification: 'CRITICAL - Catastrophic Splice Joint Rupture',
    defectType: 'Splice Joint Rupture',
    isDefect: true,
    confidence: 0.987,
    severity: 'CRITICAL',
    consecutiveFrameCount: 4,
    imageUrl: criticalRuptureImg,
    boundingBox: {
      x: 0.25,
      y: 0.22,
      width: 0.58,
      height: 0.62,
      label: 'Severe Splice Rupture',
      confidence: 0.987
    },
    defectParameters: {
      lengthMm: 1600.0,
      widthMm: 120.0,
      depthMm: 25.0,
      growthRatePctHr: 28.5,
      surfaceAreaDamagedMm2: 192000.0,
      affectedCordLayer: '100% Steel Cord Core Sheared / Pulled Out',
      thermalHotspotTempC: 82.5,
      beltThicknessMm: 10.2
    },
    recommendedAction: 'Immediate Emergency Stop required. Splice pull-out risk imminent.'
  },
  {
    incidentId: 'INC-CRIT-02',
    frameId: 'SCAN-FRM-1042',
    beltDistanceMeters: 802.4,
    linkedJointId: 'Joint-05',
    linkedJointName: 'Joint 05 (Tail Pulley Transition Splice)',
    sector: 'Sector 3 (Tail Pulley Transition Zone)',
    camera: 'CAM-04A | Optical Gantry (1200fps)',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    classification: 'CRITICAL - Splice Joint Delamination',
    defectType: 'Splice Delamination',
    isDefect: true,
    confidence: 0.964,
    severity: 'CRITICAL',
    consecutiveFrameCount: 4,
    imageUrl: spliceDelamImg,
    boundingBox: {
      x: 0.28,
      y: 0.28,
      width: 0.46,
      height: 0.58,
      label: 'Splice Delamination',
      confidence: 0.964
    },
    defectParameters: {
      lengthMm: 1180.0,
      widthMm: 54.0,
      depthMm: 14.8,
      growthRatePctHr: 8.4,
      surfaceAreaDamagedMm2: 63720.0,
      affectedCordLayer: 'Splice Step Vulcanized Bond & Cord Plies',
      thermalHotspotTempC: 78.4,
      beltThicknessMm: 14.2
    },
    recommendedAction: 'Immediate Emergency Stop required. Splice pull-out risk imminent.'
  },
  {
    incidentId: 'INC-CRIT-03',
    frameId: 'SCAN-FRM-1088',
    beltDistanceMeters: 412.0,
    linkedJointId: 'Joint-03',
    linkedJointName: 'Joint 03 (Feeder Chute Impact Splice)',
    sector: 'Sector 2 (Feeder Chute Impact Zone)',
    camera: 'CAM-02B | High-Speed Impact Scanner',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    classification: 'CRITICAL - Longitudinal Rip / Tear',
    defectType: 'Longitudinal Rip',
    isDefect: true,
    confidence: 0.978,
    severity: 'CRITICAL',
    consecutiveFrameCount: 3,
    imageUrl: longTearImg,
    boundingBox: {
      x: 0.28,
      y: 0.20,
      width: 0.42,
      height: 0.65,
      label: 'Longitudinal Rip',
      confidence: 0.978
    },
    defectParameters: {
      lengthMm: 1850.0,
      widthMm: 62.0,
      depthMm: 18.2,
      growthRatePctHr: 14.2,
      surfaceAreaDamagedMm2: 114700.0,
      affectedCordLayer: 'Through-Belt Carcass Core Penetration',
      thermalHotspotTempC: 64.2,
      beltThicknessMm: 12.6
    },
    recommendedAction: 'Emergency shutdown. Check feeder chute magnets for trapped tramp iron.'
  },
  {
    incidentId: 'INC-NOM-01',
    frameId: 'SCAN-FRM-1002',
    beltDistanceMeters: 180.0,
    linkedJointId: 'Joint-01',
    linkedJointName: 'Joint 01 (Head Vulcanized Splice)',
    sector: 'Sector 1 (Main Transfer Gallery)',
    camera: 'CAM-01A | Main Line Optical Scanner',
    timestamp: new Date(Date.now() - 2400000).toISOString(),
    classification: 'NOMINAL - Clean Belt Surface & Splice Integrity',
    defectType: 'Nominal Surface',
    isDefect: false,
    confidence: 0.992,
    severity: 'NOMINAL',
    consecutiveFrameCount: 0,
    imageUrl: normalBeltImg,
    boundingBox: null, // NO BOUNDING BOX FOR NOMINAL CLEAN BELT
    defectParameters: {
      lengthMm: 0.0,
      widthMm: 0.0,
      depthMm: 0.0,
      growthRatePctHr: 0.0,
      surfaceAreaDamagedMm2: 0.0,
      affectedCordLayer: 'None - Structural Integrity 100%',
      thermalHotspotTempC: 42.1,
      beltThicknessMm: 24.8
    },
    recommendedAction: 'Belt surface and splice alignment within nominal tolerances. Continue continuous hauling.'
  },
  {
    incidentId: 'INC-WARN-02',
    frameId: 'SCAN-FRM-1014',
    beltDistanceMeters: 620.0,
    linkedJointId: 'Joint-04',
    linkedJointName: 'Joint 04 (Main Carrying Mid-Span Splice)',
    sector: 'Sector 4 (Intermediate Carrying Strand)',
    camera: 'CAM-03A | Mid-Span Profile Scanner',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    classification: 'WARNING - Transverse Rubber Surface Crack',
    defectType: 'Transverse Crack',
    isDefect: true,
    confidence: 0.915,
    severity: 'WARNING',
    consecutiveFrameCount: 2,
    imageUrl: surfaceCrackImg,
    boundingBox: {
      x: 0.18,
      y: 0.22,
      width: 0.62,
      height: 0.48,
      label: 'Transverse Surface Crack',
      confidence: 0.915
    },
    defectParameters: {
      lengthMm: 480.0,
      widthMm: 18.0,
      depthMm: 6.5,
      growthRatePctHr: 3.1,
      surfaceAreaDamagedMm2: 8640.0,
      affectedCordLayer: 'Top Rubber Cover (Steel Cords Intact)',
      thermalHotspotTempC: 49.5,
      beltThicknessMm: 21.4
    },
    recommendedAction: 'Log in maintenance backlog. Apply cold-cure rubber compound during next scheduled lull.'
  },
  {
    incidentId: 'INC-CRIT-04',
    frameId: 'SCAN-FRM-1120',
    beltDistanceMeters: 950.0,
    linkedJointId: 'Joint-06',
    linkedJointName: 'Joint 06 (Return Strand Cleanout Splice)',
    sector: 'Sector 5 (Return Strand Gravity Take-Up)',
    camera: 'CAM-05B | Radiometric Infrared Imager',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    classification: 'CRITICAL - Idler Friction Overheating Hotspot',
    defectType: 'Overheating Hotspot',
    isDefect: true,
    confidence: 0.948,
    severity: 'CRITICAL',
    consecutiveFrameCount: 3,
    imageUrl: thermalHotspotImg,
    boundingBox: {
      x: 0.32,
      y: 0.30,
      width: 0.44,
      height: 0.50,
      label: 'Thermal Hotspot 84.5°C',
      confidence: 0.948
    },
    defectParameters: {
      lengthMm: 340.0,
      widthMm: 340.0,
      depthMm: 11.2,
      growthRatePctHr: 12.5,
      surfaceAreaDamagedMm2: 115600.0,
      affectedCordLayer: 'Core Rubber Heat Degradation',
      thermalHotspotTempC: 84.5,
      beltThicknessMm: 16.2
    },
    recommendedAction: 'Seized return idler bearing causing severe friction heating. Replace bearing immediately.'
  }
];
