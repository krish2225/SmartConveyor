import React, { useState } from 'react';
import LiveFeedPanel from '../components/vision/LiveFeedPanel.jsx';
import AnalysisResultsPanel from '../components/vision/AnalysisResultsPanel.jsx';
import SamplePickerModal from '../components/vision/SamplePickerModal.jsx';
import { SAMPLE_CONVEYOR_SCANS } from '../assets/sampleScans.js';
import { Camera, ShieldCheck, Zap } from 'lucide-react';

export default function VisionMonitoring({
  facilityId = 'nmdc-kirandul-cv101',
  visionEvents = [],
  telemetry,
  currentUser
}) {
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [scansList, setScansList] = useState(SAMPLE_CONVEYOR_SCANS);
  const [activeScan, setActiveScan] = useState(SAMPLE_CONVEYOR_SCANS[0]);

  // Handle manual sample selection
  const handleSelectSample = (sample) => {
    setActiveScan(sample);
  };

  // Handle user uploading custom conveyor image
  const handleUploadCustomImage = (dataUrl, fileName) => {
    const customScan = {
      incidentId: `INC-USER-${Date.now()}`,
      frameId: `SCAN-UP-${Math.floor(1000 + Math.random() * 9000)}`,
      beltDistanceMeters: Number((telemetry?.beltDisplacementMeters || 802.4).toFixed(1)),
      linkedJointId: 'Joint-05',
      linkedJointName: 'Joint 05 (Tail Pulley Transition Splice)',
      sector: 'Sector 3 (Uploaded Frame Analysis)',
      camera: 'CAM-USER | High-Res Manual Inspection',
      timestamp: new Date().toISOString(),
      classification: 'CRITICAL - Surface Defect Detected',
      defectType: 'Custom Uploaded Defect',
      isDefect: true,
      confidence: 0.942,
      severity: 'CRITICAL',
      consecutiveFrameCount: 1,
      imageUrl: dataUrl,
      boundingBox: {
        x: 0.25,
        y: 0.28,
        width: 0.50,
        height: 0.35,
        label: 'Detected Surface Defect',
        confidence: 0.942
      },
      defectParameters: {
        lengthMm: 940.0,
        widthMm: 48.0,
        depthMm: 12.5,
        growthRatePctHr: 6.2,
        surfaceAreaDamagedMm2: 45120.0,
        affectedCordLayer: 'Splice Step Vulcanized Bond',
        thermalHotspotTempC: 72.5,
        beltThicknessMm: 15.6
      },
      recommendedAction: 'Splice inspection recommended before resuming high-speed hauling.'
    };

    setScansList(prev => [customScan, ...prev]);
    setActiveScan(customScan);
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

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-[#111726] border border-cyan-500/40 text-xs font-mono text-cyan-400 font-semibold shadow-sm">
            YOLOv8 Optical Model: ACTIVE
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
