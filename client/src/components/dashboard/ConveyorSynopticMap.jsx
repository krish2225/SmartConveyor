import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card.jsx';
import { Badge } from '../ui/badge.jsx';
import { Button } from '../ui/button.jsx';
import {
  Activity,
  Radio,
  AlertTriangle,
  Zap,
  Gauge,
  Layers,
  Thermometer,
  ShieldAlert,
  ChevronRight,
  Maximize2,
  Info
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

export default function ConveyorSynopticMap({
  beltSpeed = 4.15,
  activeJointId = 'Joint-05',
  joints = [],
  onInvestigateJoint
}) {
  const navigate = useNavigate();
  const [selectedJoint, setSelectedJoint] = useState('Joint-05');
  const [cycleProgress, setCycleProgress] = useState(0.42);

  // Animate circulating splice position
  useEffect(() => {
    let animationFrame;
    let lastTime = performance.now();

    const animate = (now) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      // 1200m loop at beltSpeed m/s -> loop time = 1200 / beltSpeed seconds
      const loopTimeSec = 1200 / Math.max(0.5, beltSpeed);
      setCycleProgress((prev) => (prev + delta / loopTimeSec) % 1);
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [beltSpeed]);

  // Joint definitions along the 1200m loop
  const jointNodes = [
    { id: 'Joint-01', offset: 0.00, name: 'Joint 01 (Head Splice)', status: 'HEALTHY', thickness: 24.8, temp: 42.1, color: '#10B981' },
    { id: 'Joint-02', offset: 0.16, name: 'Joint 02 (Carry Zone)', status: 'HEALTHY', thickness: 24.5, temp: 41.8, color: '#10B981' },
    { id: 'Joint-03', offset: 0.33, name: 'Joint 03 (Middle Span)', status: 'HEALTHY', thickness: 24.2, temp: 43.0, color: '#10B981' },
    { id: 'Joint-04', offset: 0.50, name: 'Joint 04 (Tail Transition)', status: 'WARNING', thickness: 20.8, temp: 58.4, color: '#F59E0B' },
    { id: 'Joint-05', offset: 0.67, name: 'Joint 05 (Critical Core)', status: 'CRITICAL', thickness: 14.8, temp: 76.2, color: '#EF4444' },
    { id: 'Joint-06', offset: 0.83, name: 'Joint 06 (Return Strand)', status: 'HEALTHY', thickness: 24.1, temp: 42.5, color: '#10B981' },
  ];

  const activeJointData = jointNodes.find(j => j.id === selectedJoint) || jointNodes[4];

  // Helper to calculate X/Y coordinates on stadium conveyor path
  // SVG Stadium: Left turn at x=100, Right turn at x=650, Top y=60, Bottom y=140
  const getCoordinatesAlongConveyor = (progress) => {
    const p = (progress % 1 + 1) % 1;
    // Lengths: top = 550, right curve = 125, bottom = 550, left curve = 125. Total ~1350 units
    if (p < 0.40) {
      // Top carry strand moving left-to-right
      const fraction = p / 0.40;
      return { x: 100 + fraction * 550, y: 60, strand: 'Top Carry Deck' };
    } else if (p < 0.50) {
      // Right curve around head drive pulley
      const angle = -Math.PI / 2 + ((p - 0.40) / 0.10) * Math.PI;
      return { x: 650 + Math.cos(angle) * 40, y: 100 + Math.sin(angle) * 40, strand: 'Head Pulley Wrap' };
    } else if (p < 0.90) {
      // Bottom return strand moving right-to-left
      const fraction = (p - 0.50) / 0.40;
      return { x: 650 - fraction * 550, y: 140, strand: 'Bottom Return Strand' };
    } else {
      // Left curve around tail take-up pulley
      const angle = Math.PI / 2 + ((p - 0.90) / 0.10) * Math.PI;
      return { x: 100 + Math.cos(angle) * 40, y: 100 + Math.sin(angle) * 40, strand: 'Tail Take-Up Wrap' };
    }
  };

  return (
    <Card className="p-4 bg-surface border-border shadow-xs space-y-3.5 select-none transition-colors">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                <span>SCADA Synoptic Mimic: CV-101 (1,200m Loop)</span>
                <Badge variant="cyan" size="sm" className="font-mono text-[9px] py-0">
                  REAL-TIME SYNOPTIC
                </Badge>
              </CardTitle>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              Circulating Splice Joints • Transducer Stations #1-#4 • Live Strand Kinematics
            </p>
          </div>
        </div>

        {/* Speed & Digital Twin Shortcut */}
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded bg-surface-sunken border border-border text-[11px] font-mono text-muted-foreground hidden sm:flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>Velocity:</span>
            <span className="font-bold text-cyan-300 tabular-nums">{beltSpeed} m/s</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/digital-twin')}
            className="text-[11px] font-mono gap-1 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10 h-7"
          >
            <Maximize2 className="w-3 h-3" />
            <span className="hidden sm:inline">3D Raycaster</span>
          </Button>
        </div>
      </div>

      {/* Synoptic Conveyor Loop SVG Schematic */}
      <div className="relative w-full bg-surface-sunken rounded-lg p-3 border border-border overflow-hidden">
        
        {/* Top-Right Ore Flow & Tension Tag */}
        <div className="absolute top-2.5 right-3 flex items-center gap-3 text-[10px] font-mono text-muted-foreground z-10">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Ore Feed: <strong className="text-amber-300">1,636 t/h</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Tension: <strong className="text-cyan-300">420 kN</strong></span>
          </div>
        </div>

        {/* SVG Synoptic Canvas */}
        <svg
          viewBox="0 0 760 200"
          className="w-full h-44 sm:h-48 overflow-visible"
        >
          {/* Conveyor Structural Guide Line */}
          <path
            d="M 100 60 L 650 60 A 40 40 0 0 1 650 140 L 100 140 A 40 40 0 0 1 100 60"
            fill="none"
            stroke="#253347"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Active Conveyor Rubber Belt Track */}
          <path
            d="M 100 60 L 650 60 A 40 40 0 0 1 650 140 L 100 140 A 40 40 0 0 1 100 60"
            fill="none"
            stroke="#38495E"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Directional Moving Chevrons (Top Strand Left-to-Right) */}
          <line x1="220" y1="60" x2="240" y2="60" stroke="#22D3EE" strokeWidth="2.5" strokeDasharray="6 12" strokeLinecap="round" />
          <line x1="380" y1="60" x2="400" y2="60" stroke="#22D3EE" strokeWidth="2.5" strokeDasharray="6 12" strokeLinecap="round" />
          <line x1="520" y1="60" x2="540" y2="60" stroke="#22D3EE" strokeWidth="2.5" strokeDasharray="6 12" strokeLinecap="round" />

          {/* Directional Moving Chevrons (Bottom Strand Right-to-Left) */}
          <line x1="540" y1="140" x2="520" y2="140" stroke="#64748B" strokeWidth="2.5" strokeDasharray="6 12" strokeLinecap="round" />
          <line x1="380" y1="140" x2="360" y2="140" stroke="#64748B" strokeWidth="2.5" strokeDasharray="6 12" strokeLinecap="round" />
          <line x1="240" y1="140" x2="220" y2="140" stroke="#64748B" strokeWidth="2.5" strokeDasharray="6 12" strokeLinecap="round" />

          {/* Tail Take-Up Pulley (Left) */}
          <circle cx="100" cy="100" r="32" fill="#1A2433" stroke="#0284C7" strokeWidth="3" />
          <circle cx="100" cy="100" r="8" fill="#38BDF8" />
          <text x="100" y="104" textAnchor="middle" fill="#94A3B8" fontSize="8" fontFamily="monospace" fontWeight="bold">TAIL</text>

          {/* Head Drive Pulley (Right) */}
          <circle cx="650" cy="100" r="34" fill="#1A2433" stroke="#F59E0B" strokeWidth="3.5" />
          <circle cx="650" cy="100" r="10" fill="#F59E0B" />
          <text x="650" y="104" textAnchor="middle" fill="#F8FAFC" fontSize="8" fontFamily="monospace" fontWeight="bold">DRIVE</text>

          {/* Station #1 Callout (Head Drive Vibration/Temp) */}
          <g transform="translate(650, 160)">
            <rect x="-48" y="0" width="96" height="26" rx="4" fill="#1E293B" stroke="#38495E" />
            <text x="0" y="11" textAnchor="middle" fill="#38BDF8" fontSize="8" fontFamily="monospace" fontWeight="bold">STATION #1 (Head)</text>
            <text x="0" y="21" textAnchor="middle" fill="#94A3B8" fontSize="7" fontFamily="monospace">Vib: 2.29 • 44.2°C</text>
          </g>

          {/* Station #2 Callout (Optical AI Camera) */}
          <g transform="translate(480, 15)">
            <rect x="-42" y="0" width="84" height="24" rx="4" fill="#1E293B" stroke="#22D3EE" />
            <text x="0" y="10" textAnchor="middle" fill="#22D3EE" fontSize="8" fontFamily="monospace" fontWeight="bold">STATION #2 (Vision)</text>
            <text x="0" y="19" textAnchor="middle" fill="#94A3B8" fontSize="7" fontFamily="monospace">CAM-04A Line Scan</text>
          </g>

          {/* Station #3 Callout (Weightometer) */}
          <g transform="translate(320, 15)">
            <rect x="-42" y="0" width="84" height="24" rx="4" fill="#1E293B" stroke="#F59E0B" />
            <text x="0" y="10" textAnchor="middle" fill="#F59E0B" fontSize="8" fontFamily="monospace" fontWeight="bold">STATION #3 (Load)</text>
            <text x="0" y="19" textAnchor="middle" fill="#94A3B8" fontSize="7" fontFamily="monospace">1,636 t/h Dynamic</text>
          </g>

          {/* Station #4 Callout (Ultrasonic & Acoustic Array) */}
          <g transform="translate(100, 160)">
            <rect x="-52" y="0" width="104" height="26" rx="4" fill="#1E293B" stroke="#EF4444" />
            <text x="0" y="11" textAnchor="middle" fill="#EF4444" fontSize="8" fontFamily="monospace" fontWeight="bold">STATION #4 (Array)</text>
            <text x="0" y="21" textAnchor="middle" fill="#94A3B8" fontSize="7" fontFamily="monospace">Ultrasonic + Acoustic</text>
          </g>

          {/* Material Loading Chute Indicator (Left Top) */}
          <polygon points="170,25 190,25 180,50" fill="#A16207" stroke="#F59E0B" strokeWidth="1" />
          <text x="180" y="20" textAnchor="middle" fill="#F59E0B" fontSize="7" fontFamily="monospace">ORE INFEED</text>

          {/* 6 Vulcanized Splice Joints Moving Along the Path */}
          {jointNodes.map((joint) => {
            const jointProg = (cycleProgress + joint.offset) % 1;
            const pos = getCoordinatesAlongConveyor(jointProg);
            const isSelected = selectedJoint === joint.id;
            const isCrit = joint.status === 'CRITICAL';
            const isWarn = joint.status === 'WARNING';

            return (
              <g
                key={joint.id}
                onClick={() => setSelectedJoint(joint.id)}
                className="cursor-pointer transition-transform group"
                transform={`translate(${pos.x}, ${pos.y})`}
              >
                {/* Glowing Pulse Ring on Critical Splice */}
                {isCrit && (
                  <circle
                    r="14"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="2"
                    className="animate-ping opacity-75"
                  />
                )}

                {/* Splice Marker Node */}
                <circle
                  r={isSelected ? "9" : "7"}
                  fill={joint.color}
                  stroke="#0F1724"
                  strokeWidth="2"
                  className={cn(
                    "transition-all",
                    isSelected ? "ring-2 ring-white" : ""
                  )}
                />

                {/* Splice Label Tag */}
                <rect
                  x="-20"
                  y="-18"
                  width="40"
                  height="12"
                  rx="2"
                  fill="#0F1724"
                  stroke={joint.color}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="-9"
                  textAnchor="middle"
                  fill={joint.color}
                  fontSize="7"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {joint.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Bottom Synoptic Legend & Quick Inspector Card */}
        <div className="mt-2 pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Splice Status:</span>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Nominal (4)</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-amber-400">Warning (1)</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 font-bold">Critical (Joint-05)</span>
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground">
            🖱️ Click any moving splice node to inspect diagnostics
          </div>
        </div>

      </div>

      {/* Selected Joint Telemetry Drilldown Card */}
      <div className="p-3 bg-surface-elevated/70 border border-border rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-md border",
            activeJointData.status === 'CRITICAL' ? "bg-red-500/10 border-red-500/40 text-red-400" :
            activeJointData.status === 'WARNING' ? "bg-amber-500/10 border-amber-500/40 text-amber-400" :
            "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
          )}>
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-sm">{activeJointData.name}</span>
              <Badge
                variant={activeJointData.status === 'CRITICAL' ? 'critical' : (activeJointData.status === 'WARNING' ? 'warning' : 'nominal')}
                size="sm"
                className="font-mono text-[9px] px-1.5"
              >
                {activeJointData.status}
              </Badge>
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-3 mt-0.5">
              <span>Residual Thickness: <strong className={activeJointData.status === 'CRITICAL' ? 'text-red-400' : 'text-foreground'}>{activeJointData.thickness} mm</strong></span>
              <span>•</span>
              <span>Splice Temp: <strong className={activeJointData.status === 'CRITICAL' ? 'text-red-400' : 'text-foreground'}>{activeJointData.temp} °C</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onInvestigateJoint && (
            <Button
              variant={activeJointData.status === 'CRITICAL' ? 'destructive' : 'default'}
              size="sm"
              onClick={() => onInvestigateJoint(activeJointData.id)}
              className="text-xs font-mono font-bold h-7 gap-1"
            >
              <span>Inspect {activeJointData.id}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

    </Card>
  );
}
