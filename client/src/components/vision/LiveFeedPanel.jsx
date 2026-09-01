import React, { useRef, useState } from 'react';
import { Camera, Upload, FolderOpen, AlertOctagon, AlertTriangle, CheckCircle2, Crosshair, ZoomIn } from 'lucide-react';
import clsx from 'clsx';

export default function LiveFeedPanel({
  activeScan,
  onSelectSampleModal,
  onUploadCustomImage,
  recentScans = [],
  onSelectRecentScan
}) {
  const fileInputRef = useRef(null);
  const [imageZoom, setImageZoom] = useState(false);

  const isDefect = activeScan?.isDefect;
  const isCritical = activeScan?.severity === 'CRITICAL';
  const isWarning = activeScan?.severity === 'WARNING';
  const bbox = activeScan?.boundingBox || activeScan?.boundingBoxes?.[0];
  const params = activeScan?.defectParameters || {};

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (onUploadCustomImage) {
        onUploadCustomImage(event.target.result, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-[#111726] border border-[#1f293d] rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl">
      
      {/* 1. Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-slate-950 shadow-md">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Live Feed Analysis</h2>
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-red-950/80 text-red-400 border border-red-500/50 rounded-full font-bold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                LIVE 4096px
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              High-Speed Optical Defect Detection • YOLOv8-nano Vision Model
            </p>
          </div>
        </div>

        {/* Action Buttons: Upload & Select */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-[#0a0d14] hover:bg-slate-800 text-slate-200 hover:text-white border border-[#1f293d] rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            Upload
          </button>

          <button
            onClick={onSelectSampleModal}
            className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-cyan-500/10"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Select Sample
          </button>
        </div>
      </div>

      {/* 2. Main Image Display Area with HUD Overlay & Dynamic Bounding Box */}
      <div className={clsx(
        'relative w-full h-96 rounded-xl overflow-hidden border bg-[#090c13] flex items-center justify-center transition-all',
        isCritical ? 'border-red-500/60 shadow-lg shadow-red-950/50' : (isWarning ? 'border-amber-500/60' : 'border-[#1f293d]')
      )}>
        
        {/* The Real Conveyor Belt Image */}
        <img
          src={activeScan?.imageUrl}
          alt="Conveyor Belt Optical Capture"
          className={clsx(
            'w-full h-full object-cover transition-transform duration-300',
            imageZoom ? 'scale-125' : 'scale-100'
          )}
        />

        {/* HUD-Style Text Overlay (Top-Left Semi-Transparent Dark Box) */}
        <div className="absolute top-3 left-3 bg-[#0a0d14]/90 border border-cyan-500/30 rounded-xl p-3 backdrop-blur-md text-xs font-mono text-slate-300 space-y-1 z-20 shadow-2xl pointer-events-none max-w-[260px]">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1">
            <span className="text-cyan-400 font-bold">CONVEYOR ID:</span>
            <span className="text-white font-bold">CV-101 (Dep-14)</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="text-slate-400">Location:</span>
            <span className="text-slate-200 truncate">{activeScan?.sector || 'Sector 3 (Head Pulley)'}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="text-slate-400">Status:</span>
            <span className={clsx('font-bold px-1.5 py-0.2 rounded text-[10px]', isCritical ? 'bg-red-950 text-red-400' : (isWarning ? 'bg-amber-950 text-amber-400' : 'bg-emerald-950 text-emerald-400'))}>
              {activeScan?.severity || 'NOMINAL'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="text-slate-400">Belt Thickness:</span>
            <span className="text-white font-bold">{params.beltThicknessMm || params.thicknessMm || 24.2} mm</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="text-slate-400">Defect Width:</span>
            <span className="text-orange-400 font-bold">{params.widthMm || params.tearWidthMm || 0} mm</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 pt-0.5 border-t border-slate-800/80">
            <span>Timestamp:</span>
            <span>{new Date(activeScan?.timestamp || Date.now()).toLocaleTimeString()} UTC</span>
          </div>
        </div>

        {/* Zoom Toggle Button in top-right */}
        <button
          onClick={() => setImageZoom(!imageZoom)}
          className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black/90 border border-slate-700 rounded-lg text-slate-300 hover:text-white z-20 backdrop-blur-sm transition-all"
          title="Toggle Zoom"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Dashed Bounding Box Drawn Directly ON the Image */}
        {bbox && isDefect && (
          <div
            className={clsx(
              'absolute border-2 rounded z-20 transition-all pointer-events-none',
              isCritical
                ? 'border-dashed border-red-500 bg-red-500/15 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : 'border-dashed border-amber-500 bg-amber-500/15'
            )}
            style={{
              left: `${bbox.x * 100}%`,
              top: `${bbox.y * 100}%`,
              width: `${bbox.width * 100}%`,
              height: `${bbox.height * 100}%`
            }}
          >
            {/* Anchored Defect Tag */}
            <div className={clsx(
              'absolute -top-7 left-0 px-2.5 py-0.5 rounded shadow-lg font-mono text-[10px] font-extrabold whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wider',
              isCritical ? 'bg-red-600 text-white' : 'bg-amber-600 text-slate-950'
            )}>
              <Crosshair className="w-3 h-3" />
              <span>DEFECT DETECTED — SEVERITY: {activeScan?.severity}</span>
              <span className="opacity-90">({Math.round((bbox.confidence || activeScan.confidence || 0.95) * 100)}%)</span>
            </div>

            {/* Bottom-right Dimensions Tag */}
            <div className="absolute -bottom-6 right-0 bg-[#0a0d14]/95 border border-red-500/80 text-red-300 font-mono text-[10px] px-2 py-0.5 rounded whitespace-nowrap shadow-md">
              L: {params.lengthMm || params.crackLengthMm || 1180}mm × W: {params.widthMm || params.tearWidthMm || 54}mm
            </div>
          </div>
        )}

      </div>

      {/* 3. Footer Row Under Image */}
      <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-semibold">{activeScan?.camera || 'CAM-04A | Optical Gantry (1200fps)'}</span>
          <span>•</span>
          <span>{activeScan?.sector || 'Sector 3 (Head Pulley Transition)'}</span>
        </div>
        <div className="text-slate-400">
          Capture UTC: {activeScan?.timestamp ? new Date(activeScan.timestamp).toISOString() : new Date().toISOString()}
        </div>
      </div>

      {/* 4. Recent Scans Strip (Last 4 Analyzed Images) */}
      <div className="pt-2 border-t border-[#1f293d]">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
            Recent Scans
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Click thumbnail to inspect
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {recentScans.slice(0, 4).map((scan) => {
            const isSelected = (scan.incidentId || scan.frameId) === (activeScan?.incidentId || activeScan?.frameId);
            const scanCrit = scan.severity === 'CRITICAL';
            const scanWarn = scan.severity === 'WARNING';

            return (
              <div
                key={scan.incidentId || scan.frameId}
                onClick={() => onSelectRecentScan(scan)}
                className={clsx(
                  'group relative p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden',
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400'
                    : 'bg-[#0a0d14] border-[#1f293d] hover:border-slate-600 hover:bg-[#0f1422]'
                )}
              >
                {/* Mini Image Preview */}
                <div className="relative w-full h-16 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 mb-1.5">
                  <img
                    src={scan.imageUrl}
                    alt={scan.classification}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1 right-1">
                    <span className={clsx(
                      'px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase',
                      scanCrit ? 'bg-red-600 text-white' : (scanWarn ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white')
                    )}>
                      {scan.severity}
                    </span>
                  </div>
                </div>

                {/* Caption & Timestamp */}
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold text-white truncate font-mono">
                    {scan.frameId}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {scan.classification.replace('CRITICAL - ', '').replace('WARNING - ', '').replace('NOMINAL - ', '')}
                  </div>
                  <div className="text-[9px] font-mono text-cyan-400 pt-0.5">
                    Conf: {Math.round((scan.confidence || 0.95) * 100)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
