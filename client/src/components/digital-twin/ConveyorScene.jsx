import React, { useRef, useState } from 'react';
import { useThreeScene } from './useThreeScene.js';
import StatusBadge from '../shared/StatusBadge.jsx';
import { getJointStatusColor } from '../../utils/colorMapping.js';
import {
  Layers,
  Activity,
  Thermometer,
  Radio,
  Clock,
  Wrench,
  Play,
  Pause,
  Camera,
  Eye,
  Crosshair
} from 'lucide-react';
import clsx from 'clsx';

export default function ConveyorScene({
  joints = [],
  selectedJointId = 'Joint-05',
  onSelectJoint,
  beltSpeedMps = 4.2,
  dynamicLoadTph = 1850,
  activeJointId = 'Joint-01'
}) {
  const containerRef = useRef(null);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [isPaused, setIsPaused] = useState(false);
  const [cameraMode, setCameraMode] = useState('ISOMETRIC'); // 'ISOMETRIC' | 'HEAD_DISCHARGE' | 'TAIL_FEED' | 'TOP_DOWN' | 'FOLLOW_JOINT'

  useThreeScene({
    containerRef,
    joints,
    selectedJointId,
    beltSpeedMps: isPaused ? 0 : beltSpeedMps,
    speedMultiplier,
    cameraMode,
    onSelectJoint
  });

  const selectedJoint = joints.find(j => j.jointId === selectedJointId) || joints[0];
  const jointTheme = getJointStatusColor(selectedJoint?.healthStatus);

  return (
    <div className="relative w-full h-[640px] bg-[#090c13] rounded-2xl border border-[#1f293d] overflow-hidden flex flex-col lg:flex-row shadow-2xl">
      
      {/* Left / Center 3D WebGL Viewport */}
      <div className="relative flex-1 h-full">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Top Overlay: Live Telemetry & Quick Joint Badges */}
        <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          
          {/* Live Telemetry Pill */}
          <div className="flex items-center gap-2 pointer-events-auto bg-[#0c101a]/90 backdrop-blur-md border border-[#1f293d] rounded-xl px-3.5 py-2 text-xs shadow-xl">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-white font-mono">CV-101 3D DIGITAL TWIN</span>
            <span className="text-slate-500 font-mono">|</span>
            <span className="text-cyan-300 font-mono text-[11px]">{beltSpeedMps} m/s</span>
            <span className="text-slate-500 font-mono">|</span>
            <span className="text-orange-400 font-mono text-[11px]">{dynamicLoadTph} t/h</span>
          </div>

          {/* Quick Joint Selector Bar */}
          <div className="flex items-center gap-1.5 pointer-events-auto bg-[#0c101a]/90 backdrop-blur-md border border-[#1f293d] rounded-xl p-1.5 shadow-xl">
            {joints.map(joint => {
              const isSelected = joint.jointId === selectedJointId;
              const isCritical = joint.healthStatus === 'CRITICAL_DELAMINATION';
              const isWarning = joint.healthStatus === 'ELEVATED_WEAR';

              return (
                <button
                  key={joint.jointId}
                  onClick={() => onSelectJoint(joint.jointId)}
                  className={clsx(
                    'px-2.5 py-1 text-xs font-mono font-semibold rounded-lg transition-all flex items-center gap-1.5',
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                  )}
                >
                  <span className={clsx(
                    'w-1.5 h-1.5 rounded-full',
                    isCritical ? 'bg-red-400 animate-ping' : (isWarning ? 'bg-amber-400' : 'bg-emerald-400')
                  )} />
                  {joint.jointId.replace('Joint-', 'J-')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Camera Views & Pacing Bar (Floating on Bottom) */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          
          {/* Camera Presets */}
          <div className="flex items-center gap-1 bg-[#0c101a]/90 backdrop-blur-md border border-[#1f293d] rounded-xl p-1.5 pointer-events-auto shadow-xl">
            <span className="text-[10px] font-mono text-slate-500 uppercase px-2 flex items-center gap-1">
              <Camera className="w-3 h-3 text-cyan-400" /> Views:
            </span>

            {[
              { id: 'ISOMETRIC', label: 'Orbit' },
              { id: 'FOLLOW_JOINT', label: '🎯 Follow Splice' },
              { id: 'HEAD_DISCHARGE', label: 'Head & Vision' },
              { id: 'TAIL_FEED', label: 'Tail Hopper' },
              { id: 'TOP_DOWN', label: 'Top-Down' }
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setCameraMode(v.id)}
                className={clsx(
                  'px-2.5 py-1 text-xs font-mono rounded-lg transition-all',
                  cameraMode === v.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                )}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Speed & Pause Controls */}
          <div className="flex items-center gap-1 bg-[#0c101a]/90 backdrop-blur-md border border-[#1f293d] rounded-xl p-1.5 pointer-events-auto shadow-xl">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={clsx(
                'px-2.5 py-1 text-xs font-mono rounded-lg flex items-center gap-1 font-semibold transition-all',
                isPaused ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:text-white'
              )}
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>

            {[
              { label: '0.5x', value: 0.5 },
              { label: '1.0x', value: 1.0 },
              { label: '1.5x', value: 1.5 }
            ].map(p => (
              <button
                key={p.label}
                onClick={() => {
                  setSpeedMultiplier(p.value);
                  setIsPaused(false);
                }}
                className={clsx(
                  'px-2 py-1 text-xs font-mono rounded-lg transition-all',
                  speedMultiplier === p.value && !isPaused
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Right Side: Splice Joint Inspector Panel */}
      {selectedJoint && (
        <div className="w-full lg:w-80 h-auto lg:h-full bg-[#0c101a]/95 border-t lg:border-t-0 lg:border-l border-[#1f293d] p-5 flex flex-col justify-between overflow-y-auto shrink-0 shadow-2xl">
          
          <div className="space-y-4">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                  Splice Joint Diagnostic
                </span>
                <StatusBadge status={selectedJoint.healthStatus} size="xs" />
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                {selectedJoint.name || selectedJoint.jointId}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Belt Position: {selectedJoint.positionMeters}m / 1200m
              </p>
            </div>

            {/* RUL & Risk Score Card */}
            <div className={clsx('p-3.5 rounded-xl border space-y-2', jointTheme.bg, jointTheme.border)}>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Estimated RUL
                </span>
                <span className={clsx('font-bold', jointTheme.text)}>
                  {selectedJoint.estimatedTimeToFailureDays} Days ({selectedJoint.estimatedTimeToFailureHours}h)
                </span>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>Rupture Risk Index</span>
                  <span className="font-bold text-white">{selectedJoint.riskScore}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={clsx('h-full transition-all duration-500', selectedJoint.riskScore >= 70 ? 'bg-red-500' : (selectedJoint.riskScore >= 35 ? 'bg-amber-500' : 'bg-emerald-500'))}
                    style={{ width: `${selectedJoint.riskScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Physical Transducer Array */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                Splice Transducer Array
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                
                {/* Ultrasonic Splice Thickness */}
                <div className="p-2.5 bg-[#111726] border border-[#1f293d] rounded-lg">
                  <div className="flex items-center gap-1 text-slate-400 text-[10px] font-mono">
                    <Layers className="w-3 h-3 text-cyan-400" />
                    Thickness
                  </div>
                  <div className="text-sm font-bold font-mono text-white mt-1">
                    {selectedJoint.ultrasonicThickness} mm
                  </div>
                  <div className="text-[10px] text-slate-400">Nominal &gt;22mm</div>
                </div>

                {/* Thermal Core */}
                <div className="p-2.5 bg-[#111726] border border-[#1f293d] rounded-lg">
                  <div className="flex items-center gap-1 text-slate-400 text-[10px] font-mono">
                    <Thermometer className="w-3 h-3 text-amber-400" />
                    Thermal Core
                  </div>
                  <div className="text-sm font-bold font-mono text-white mt-1">
                    {selectedJoint.temperature} °C
                  </div>
                  <div className="text-[10px] text-slate-400">Limit &lt;70°C</div>
                </div>

                {/* Vibration */}
                <div className="p-2.5 bg-[#111726] border border-[#1f293d] rounded-lg">
                  <div className="flex items-center gap-1 text-slate-400 text-[10px] font-mono">
                    <Activity className="w-3 h-3 text-cyan-400" />
                    Vibration
                  </div>
                  <div className="text-sm font-bold font-mono text-white mt-1">
                    {selectedJoint.vibrationRms} mm/s
                  </div>
                  <div className="text-[10px] text-slate-400">ISO 10816 Limit</div>
                </div>

                {/* Acoustic Stress */}
                <div className="p-2.5 bg-[#111726] border border-[#1f293d] rounded-lg">
                  <div className="flex items-center gap-1 text-slate-400 text-[10px] font-mono">
                    <Radio className="w-3 h-3 text-pink-400" />
                    Acoustic Stress
                  </div>
                  <div className="text-sm font-bold font-mono text-white mt-1">
                    {selectedJoint.acousticEmission || 38.5} dB
                  </div>
                  <div className="text-[10px] text-slate-400">Micro-crack wave</div>
                </div>

              </div>
            </div>

            {/* AI Recommendation */}
            <div className="p-3 bg-[#111726] border border-[#1f293d] rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[11px] font-semibold">
                <Wrench className="w-3.5 h-3.5" />
                AI Maintenance Prescription
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {selectedJoint.recommendation}
              </p>
            </div>

          </div>

          {/* Footer Stats */}
          <div className="mt-4 pt-3 border-t border-[#1f293d] flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Cumulative Cycles: {selectedJoint.cycleCount || 14800}</span>
            <span className="text-cyan-400">AI Confidence: {Math.round((selectedJoint.confidence || 0.94) * 100)}%</span>
          </div>

        </div>
      )}

    </div>
  );
}
