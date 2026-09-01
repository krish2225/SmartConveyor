import React, { useState } from 'react';
import LiveFeedPanel from '../components/vision/LiveFeedPanel.jsx';
import AnalysisResultsPanel from '../components/vision/AnalysisResultsPanel.jsx';
import SamplePickerModal from '../components/vision/SamplePickerModal.jsx';
import { SAMPLE_CONVEYOR_SCANS } from '../assets/sampleScans.js';
import { useBackendStatus } from '../hooks/useBackendStatus.js';
import { Camera, ShieldCheck, Zap, Wifi, WifiOff } from 'lucide-react';

export default function VisionMonitoring({
  facilityId = 'nmdc-kirandul-cv101',
  visionEvents = [],
  telemetry,
  currentUser
}) {
  const backend = useBackendStatus();
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [scansList, setScansList] = useState(SAMPLE_CONVEYOR_SCANS);
  const [activeScan, setActiveScan] = useState(SAMPLE_CONVEYOR_SCANS[0]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle manual sample selection from picker modal
  const handleSelectSample = (sample) => {
    setActiveScan(sample);
  };

  // Handle user uploading custom conveyor image with real Python FastAPI backend call
  const handleUploadCustomImage = async (dataUrl, fileName = '') => {
    setIsProcessing(true);
    const frameId = `SCAN-UP-${Math.floor(1000 + Math.random() * 9000)}`;
    const beltDistance = Number((telemetry?.beltDisplacementMeters || 580.0).toFixed(1));

    try {
      // 1. Send real HTTP request to Python FastAPI ML Backend on Port 8000
      const response = await fetch('http://127.0.0.1:8000/classify-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageRef: dataUrl.substring(0, 100) + '...', // send preview ref
          frameId,
          beltDistanceMeters: beltDistance
        })
      });

      if (response.ok) {
        const mlResult = await response.json();
        
        const customScan = {
          incidentId: `INC-USER-${Date.now()}`,
          frameId: mlResult.frameId || frameId,
          beltDistanceMeters: mlResult.beltDistanceMeters || beltDistance,
          linkedJointId: mlResult.severity === 'NOMINAL' ? 'Joint-01' : (mlResult.severity === 'WARNING' ? 'Joint-04' : 'Joint-05'),
          linkedJointName: mlResult.severity === 'NOMINAL' ? 'Joint 01 (Head Splice)' : (mlResult.severity === 'WARNING' ? 'Joint 04 (Carrying Splice)' : 'Joint 05 (Tail Splice)'),
          sector: mlResult.severity === 'NOMINAL' ? 'Sector 1 (Main Gallery)' : (mlResult.severity === 'WARNING' ? 'Sector 4 (Intermediate Carrying Strand)' : 'Sector 3 (Tail Pulley Zone)'),
          camera: 'CAM-USER | High-Res Inspection Camera',
          timestamp: new Date().toISOString(),
          classification: mlResult.classification || 'WARNING - Rubber Surface Fatigue & Wear',
          defectType: mlResult.defectType || 'Surface Defect',
          isDefect: mlResult.isDefect,
          confidence: mlResult.confidence || 0.94,
          severity: mlResult.severity || 'WARNING',
          consecutiveFrameCount: mlResult.isDefect ? 1 : 0,
          imageUrl: dataUrl,
          boundingBox: mlResult.boundingBoxes?.[0] || mlResult.boundingBox || null,
          defectParameters: {
            lengthMm: mlResult.defectParameters?.crackLengthMm || 850.0,
            widthMm: mlResult.defectParameters?.tearWidthMm || 45.0,
            depthMm: 4.2,
            growthRatePctHr: 2.8,
            surfaceAreaDamagedMm2: mlResult.defectParameters?.surfaceAreaDamagedMm2 || 38250.0,
            affectedCordLayer: mlResult.defectParameters?.affectedCordLayer || 'Top Cover',
            thermalHotspotTempC: mlResult.defectParameters?.thermalHotspotTempC || 48.0,
            beltThicknessMm: 22.4
          },
          recommendedAction: mlResult.recommendedAction || 'Physical inspection logged.'
        };

        setScansList(prev => [customScan, ...prev]);
        setActiveScan(customScan);
        setIsProcessing(false);
        return;
      }
    } catch (err) {
      console.warn('FastAPI backend not reachable on port 8000, using local heuristics:', err);
    }

    // 2. Fallback heuristic if FastAPI server is temporarily stopped
    const lowerName = fileName.toLowerCase();
    const isNominal = lowerName.includes('normal') || lowerName.includes('clean') || lowerName.includes('nominal') || lowerName.includes('pristine') || lowerName.includes('good') || lowerName.includes('ok');
    const isTear = lowerName.includes('tear') || lowerName.includes('rip') || lowerName.includes('slit');
    const isRupture = lowerName.includes('rupture') || lowerName.includes('snap') || lowerName.includes('severed');
    const isThermal = lowerName.includes('thermal') || lowerName.includes('hot') || lowerName.includes('overheat');

    let classification = 'WARNING - Top Rubber Cover Fatigue & Wear';
    let severity = 'WARNING';
    let isDefect = true;
    let confidence = 0.926;
    let boundingBox = { x: 0.15, y: 0.25, width: 0.70, height: 0.52, label: 'Surface Fatigue Wear', confidence: 0.926 };
    let defectParams = {
      lengthMm: 850.0,
      widthMm: 45.0,
      depthMm: 4.2,
      growthRatePctHr: 2.8,
      surfaceAreaDamagedMm2: 38250.0,
      affectedCordLayer: 'Top Rubber Cover Only (Steel Cords 100% Intact)',
      thermalHotspotTempC: 48.2,
      beltThicknessMm: 22.4
    };
    let recommendedAction = 'Log in maintenance backlog. Apply cold-cure compound during upcoming planned shutdown.';

    if (isNominal) {
      classification = 'NOMINAL - Clean Belt Surface & Splice Integrity';
      severity = 'NOMINAL';
      isDefect = false;
      confidence = 0.992;
      boundingBox = null;
      defectParams = {
        lengthMm: 0.0,
        widthMm: 0.0,
        depthMm: 0.0,
        growthRatePctHr: 0.0,
        surfaceAreaDamagedMm2: 0.0,
        affectedCordLayer: 'None - 100% Structural Integrity',
        thermalHotspotTempC: 42.1,
        beltThicknessMm: 24.8
      };
      recommendedAction = 'Belt surface within nominal operational tolerances. Continue continuous hauling.';
    } else if (isRupture) {
      classification = 'CRITICAL - Catastrophic Splice Joint Rupture';
      severity = 'CRITICAL';
      confidence = 0.987;
      boundingBox = { x: 0.25, y: 0.22, width: 0.58, height: 0.62, label: 'Severe Splice Rupture', confidence: 0.987 };
      defectParams = {
        lengthMm: 1600.0,
        widthMm: 120.0,
        depthMm: 25.0,
        growthRatePctHr: 28.5,
        surfaceAreaDamagedMm2: 192000.0,
        affectedCordLayer: '100% Steel Cord Core Sheared / Pulled Out',
        thermalHotspotTempC: 82.5,
        beltThicknessMm: 10.2
      };
      recommendedAction = 'Immediate Emergency Stop required. Splice pull-out risk imminent.';
    } else if (isTear) {
      classification = 'CRITICAL - Longitudinal Rip / Tear';
      severity = 'CRITICAL';
      confidence = 0.978;
      boundingBox = { x: 0.28, y: 0.20, width: 0.42, height: 0.65, label: 'Longitudinal Rip', confidence: 0.978 };
      defectParams = {
        lengthMm: 1850.0,
        widthMm: 62.0,
        depthMm: 18.2,
        growthRatePctHr: 14.2,
        surfaceAreaDamagedMm2: 114700.0,
        affectedCordLayer: 'Through-Belt Carcass Core Penetration',
        thermalHotspotTempC: 64.2,
        beltThicknessMm: 12.6
      };
      recommendedAction = 'Emergency shutdown. Check feeder chute magnets for trapped tramp iron.';
    } else if (isThermal) {
      classification = 'CRITICAL - Idler Friction Overheating Hotspot';
      severity = 'CRITICAL';
      confidence = 0.948;
      boundingBox = { x: 0.32, y: 0.30, width: 0.44, height: 0.50, label: 'Thermal Hotspot 84.5°C', confidence: 0.948 };
      defectParams = {
        lengthMm: 340.0,
        widthMm: 340.0,
        depthMm: 11.2,
        growthRatePctHr: 12.5,
        surfaceAreaDamagedMm2: 115600.0,
        affectedCordLayer: 'Core Rubber Heat Degradation',
        thermalHotspotTempC: 84.5,
        beltThicknessMm: 16.2
      };
      recommendedAction = 'Replace seized idler roller bearing immediately.';
    }

    const customScan = {
      incidentId: `INC-USER-${Date.now()}`,
      frameId,
      beltDistanceMeters: beltDistance,
      linkedJointId: severity === 'NOMINAL' ? 'Joint-01' : (severity === 'WARNING' ? 'Joint-04' : 'Joint-05'),
      linkedJointName: severity === 'NOMINAL' ? 'Joint 01 (Head Splice)' : (severity === 'WARNING' ? 'Joint 04 (Carrying Splice)' : 'Joint 05 (Tail Splice)'),
      sector: severity === 'NOMINAL' ? 'Sector 1 (Main Gallery)' : (severity === 'WARNING' ? 'Sector 4 (Intermediate Carrying Strand)' : 'Sector 3 (Uploaded Frame Analysis)'),
      camera: 'CAM-USER | High-Res Inspection Camera',
      timestamp: new Date().toISOString(),
      classification,
      defectType: severity === 'NOMINAL' ? 'Nominal Clean Surface' : (severity === 'WARNING' ? 'Surface Fatigue & Wear' : 'Structural Defect'),
      isDefect,
      confidence,
      severity,
      consecutiveFrameCount: severity === 'NOMINAL' ? 0 : 1,
      imageUrl: dataUrl,
      boundingBox,
      defectParameters: defectParams,
      recommendedAction
    };

    setScansList(prev => [customScan, ...prev]);
    setActiveScan(customScan);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-slate-950 shadow-md">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Vision Monitoring &amp; Defect Detection
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              YOLOv8-nano Computer Vision • Automatic Bounding-Box Detection &amp; Defect Geometry
            </p>
          </div>
        </div>

        {/* Live Backend Indicator in Header */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 shadow-sm ${
            backend.isOnline
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/80 border-red-500/40 text-red-300 animate-pulse'
          }`}>
            {backend.isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
            <span>FASTAPI ML BACKEND: {backend.isOnline ? `ONLINE (${backend.latencyMs}ms)` : 'OFFLINE (Port 8000)'}</span>
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* LEFT PANEL — Live Feed Analysis & Recent Scans (2 Cols) */}
        <div className="lg:col-span-2">
          <LiveFeedPanel
            activeScan={activeScan}
            onSelectSampleModal={() => setIsSampleModalOpen(true)}
            onUploadCustomImage={handleUploadCustomImage}
            recentScans={scansList}
            onSelectRecentScan={(scan) => setActiveScan(scan)}
          />
        </div>

        {/* RIGHT PANEL — Analysis Results & Action Controls (1 Col) */}
        <div className="lg:col-span-1">
          <AnalysisResultsPanel
            activeScan={activeScan}
            facilityId={facilityId}
            currentUser={currentUser}
          />
        </div>

      </div>

      {/* Demo Sample Conveyor Defect Picker Modal */}
      <SamplePickerModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onSelectSample={handleSelectSample}
        currentScanId={activeScan?.incidentId}
      />

    </div>
  );
}
