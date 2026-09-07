import React, { useRef, useState } from 'react';
import { Camera, Upload, FolderOpen, AlertOctagon, AlertTriangle, CheckCircle2, Crosshair, ZoomIn } from 'lucide-react';
import { Card } from '../ui/card.jsx';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import { cn } from '../../lib/utils.js';

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
    <Card className="p-4 bg-surface border-border shadow-xs flex flex-col justify-between space-y-3.5 select-none transition-colors">
      
      {/* 1. Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 border border-primary/30 rounded-md text-primary">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground tracking-tight">Live Optical Feed &amp; Anomaly Detection</h2>
              <Badge variant="cyan" size="sm" className="gap-1 font-mono text-[9px] py-0">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                OPTICAL 4096px
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              High-Speed Line-Scan Camera • YOLOv8 Defect Segmentation
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

          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="font-mono text-xs gap-1.5 h-8"
          >
            <Upload className="w-3.5 h-3.5 text-primary" />
            Upload Frame
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={onSelectSampleModal}
            className="font-mono text-xs gap-1.5 font-bold h-8"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Select Sample
          </Button>
        </div>
      </div>

      {/* 2. Main Image Display Area with HUD Overlay & Dynamic Bounding Box */}
      <div className={cn(
        'relative w-full h-80 sm:h-96 rounded-lg overflow-hidden border bg-slate-950 flex items-center justify-center transition-all select-none shadow-inner',
        isCritical ? 'border-red-500/60 shadow-red-500/10' : (isWarning ? 'border-amber-500/60 shadow-amber-500/10' : 'border-border')
      )}>
        
        {/* Conveyor Belt Capture Image */}
        <img
          src={activeScan?.imageUrl}
          alt="Conveyor Belt Optical Capture"
          className={cn(
            'w-full h-full object-cover transition-transform duration-300',
            imageZoom ? 'scale-125' : 'scale-100'
          )}
        />

        {/* HUD-Style Technical Overlay */}
        <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-700/80 rounded-lg p-2.5 backdrop-blur-md text-xs font-mono text-slate-300 space-y-1 z-20 shadow-xl pointer-events-none max-w-[250px]">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1">
            <span className="text-primary font-bold">CONVEYOR ID:</span>
            <span className="text-white font-bold">CV-101 (Dep-14)</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[10px]">
            <span className="text-slate-400">Sector:</span>
            <span className="text-slate-200 truncate">{activeScan?.sector || 'Sector 3 (Head Pulley)'}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[10px]">
            <span className="text-slate-400">Status:</span>
            <Badge variant={isCritical ? 'critical' : (isWarning ? 'warning' : 'nominal')} size="sm" className="px-1.5 py-0 text-[9px]">
              {activeScan?.severity || 'NOMINAL'}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-2 text-[10px]">
            <span className="text-slate-400">Thickness:</span>
            <span className="text-white font-bold tabular-nums">{params.beltThicknessMm || params.thicknessMm || 24.2} mm</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[10px]">
            <span className="text-slate-400">Defect Width:</span>
            <span className="text-amber-400 font-bold tabular-nums">{params.widthMm || params.tearWidthMm || 0} mm</span>
          </div>
        </div>

        {/* Zoom Toggle */}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setImageZoom(!imageZoom)}
          className="absolute top-3 right-3 z-20 bg-slate-900/80 hover:bg-slate-900 text-white border-slate-700 h-8 w-8"
          title="Toggle Zoom"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>

        {/* Corner Reticles */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400/70 pointer-events-none" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400/70 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400/70 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400/70 pointer-events-none" />

        {/* Dashed Bounding Box Drawn Directly ON the Image */}
        {bbox && isDefect && (
          <div
            className={cn(
              'absolute border-2 rounded-sm z-20 transition-all pointer-events-none',
              isCritical
                ? 'border-dashed border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : 'border-dashed border-amber-500 bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
            )}
            style={{
              left: `${bbox.x * 100}%`,
              top: `${bbox.y * 100}%`,
              width: `${bbox.width * 100}%`,
              height: `${bbox.height * 100}%`
            }}
          >
            {/* Anchored Defect Tag */}
            <div className={cn(
              'absolute -top-6 left-0 px-2 py-0.5 rounded shadow-lg font-mono text-[9px] font-bold whitespace-nowrap flex items-center gap-1 uppercase tracking-wider',
              isCritical ? 'bg-destructive text-white' : 'bg-amber-500 text-black'
            )}>
              <Crosshair className="w-2.5 h-2.5" />
              <span>DEFECT: {activeScan?.severity}</span>
              <span className="opacity-90 tabular-nums">({Math.round((bbox.confidence || activeScan.confidence || 0.95) * 100)}%)</span>
            </div>

            {/* Bottom Dimensions Tag */}
            <div className="absolute -bottom-5 right-0 bg-slate-900 border border-red-500/80 text-red-300 font-mono text-[9px] px-1.5 py-0.2 rounded whitespace-nowrap shadow-md tabular-nums">
              L: {params.lengthMm || params.crackLengthMm || 1180}mm × W: {params.widthMm || params.tearWidthMm || 54}mm
            </div>
          </div>
        )}

      </div>

      {/* 3. Footer Row Under Image */}
      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-muted-foreground px-0.5">
        <div className="flex items-center gap-2">
          <span className="text-primary font-semibold">{activeScan?.camera || 'CAM-04A | Optical Gantry (1200fps)'}</span>
          <span>•</span>
          <span>{activeScan?.sector || 'Sector 3 (Head Pulley)'}</span>
        </div>
        <div>
          UTC: <span className="tabular-nums font-semibold text-foreground">{activeScan?.timestamp ? new Date(activeScan.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* 4. Recent Scans Strip */}
      <div className="pt-2 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-muted-foreground font-bold uppercase tracking-wider">
            Recent Scans Buffer
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            Click frame to inspect
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {recentScans.slice(0, 4).map((scan) => {
            const isSelected = (scan.incidentId || scan.frameId) === (activeScan?.incidentId || activeScan?.frameId);
            const scanCrit = scan.severity === 'CRITICAL';
            const scanWarn = scan.severity === 'WARNING';

            return (
              <div
                key={scan.incidentId || scan.frameId}
                onClick={() => onSelectRecentScan(scan)}
                className={cn(
                  'group relative p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between overflow-hidden select-none',
                  isSelected
                    ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary'
                    : 'bg-surface-sunken/70 border-border hover:border-primary/40 hover:bg-surface'
                )}
              >
                {/* Mini Image Preview */}
                <div className="relative w-full h-14 rounded-md overflow-hidden bg-slate-900 border border-border/80 mb-1">
                  <img
                    src={scan.imageUrl}
                    alt={scan.classification}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute top-1 right-1">
                    <Badge
                      variant={scanCrit ? 'critical' : (scanWarn ? 'warning' : 'nominal')}
                      size="sm"
                      className="px-1 py-0 text-[8px]"
                    >
                      {scan.severity}
                    </Badge>
                  </div>
                </div>

                {/* Caption & Timestamp */}
                <div className="space-y-0.2">
                  <div className="text-[10px] font-bold text-foreground truncate font-mono">
                    {scan.frameId}
                  </div>
                  <div className="text-[9px] text-muted-foreground truncate">
                    {scan.classification.replace('CRITICAL - ', '').replace('WARNING - ', '').replace('NOMINAL - ', '')}
                  </div>
                  <div className="text-[9px] font-mono text-primary pt-0.5 tabular-nums font-semibold">
                    Conf: {Math.round((scan.confidence || 0.95) * 100)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </Card>
  );
}
