import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useThreeScene } from './useThreeScene.js';
import StatusBadge from '../shared/StatusBadge.jsx';
import { getJointStatusColor } from '../../utils/colorMapping.js';
import { getAllJointsHistoryApi } from '../../services/api.js';
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
  Crosshair,
  RotateCcw,
  FastForward,
  Rewind,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Calendar
} from 'lucide-react';
import clsx from 'clsx';

export default function ConveyorScene({
  joints = [],
  selectedJointId = 'Joint-05',
  onSelectJoint,
  beltSpeedMps = 4.2,
  dynamicLoadTph = 1850,
  activeJointId = 'Joint-01',
  facilityId = 'nmdc-kirandul-cv101'
}) {
  const containerRef = useRef(null);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [isPaused, setIsPaused] = useState(false);
  const [cameraMode, setCameraMode] = useState('ISOMETRIC'); // 'ISOMETRIC' | 'HEAD_DISCHARGE' | 'TAIL_FEED' | 'TOP_DOWN' | 'FOLLOW_JOINT'

  // --- Historical Playback State ---
  const [isPlaybackMode, setIsPlaybackMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(5); // 1x, 5x, 20x
  const [historyData, setHistoryData] = useState([]);
  const [timeRange, setTimeRange] = useState({ min: Date.now() - 72 * 3600 * 1000, max: Date.now() });
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(Date.now());
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load 72-hour historical snapshot records on mount
  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      setIsLoadingHistory(true);
      try {
        const res = await getAllJointsHistoryApi(facilityId);
        if (isMounted && res.success && Array.isArray(res.history) && res.history.length > 0) {
          setHistoryData(res.history);
          const minT = new Date(res.minTimestamp || res.history[0].timestamp).getTime();
          const maxT = new Date(res.maxTimestamp || res.history[res.history.length - 1].timestamp).getTime();
          setTimeRange({ min: minT, max: maxT });
          setCurrentPlaybackTime(minT);
        }
      } catch (err) {
        console.warn('[DigitalTwin] Could not fetch joint history:', err.message);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    }
    loadHistory();
    return () => { isMounted = false; };
  }, [facilityId]);

  // Group history records by jointId for instant $O(1)$ sparklines & lookup
  const historyByJoint = useMemo(() => {
    const map = {};
    historyData.forEach(item => {
      const jId = item.jointId;
      if (!map[jId]) map[jId] = [];
      map[jId].push({
        ...item,
        timeMs: new Date(item.timestamp).getTime()
      });
    });
    // Ensure chronological order
    Object.keys(map).forEach(jId => {
      map[jId].sort((a, b) => a.timeMs - b.timeMs);
    });
    return map;
  }, [historyData]);

  // Compute the 6 joints at the currently scrubbed timestamp from cached history
  const historicalJoints = useMemo(() => {
    if (!isPlaybackMode || historyData.length === 0) return joints;

    const jointIds = ['Joint-01', 'Joint-02', 'Joint-03', 'Joint-04', 'Joint-05', 'Joint-06'];
    return jointIds.map(jId => {
      const list = historyByJoint[jId];
      if (!list || list.length === 0) {
        return joints.find(j => j.jointId === jId) || { jointId: jId, healthStatus: 'OPTIMAL' };
      }

      // Binary search or closest timestamp lookup
      let closest = list[0];
      let minDiff = Math.abs(list[0].timeMs - currentPlaybackTime);

      for (let i = 1; i < list.length; i++) {
        const diff = Math.abs(list[i].timeMs - currentPlaybackTime);
        if (diff < minDiff) {
          minDiff = diff;
          closest = list[i];
        } else {
          break; // list is sorted, so differences will only grow
        }
      }

      return {
        jointId: closest.jointId,
        name: closest.name,
        positionMeters: joints.find(j => j.jointId === jId)?.positionMeters || 0,
        healthStatus: closest.status || 'OPTIMAL',
        riskScore: closest.riskScore,
        healthScore: closest.healthScore,
        estimatedTimeToFailureDays: closest.estimatedTimeToFailureDays,
        estimatedTimeToFailureHours: closest.estimatedTimeToFailureHours,
        ultrasonicThickness: closest.ultrasonicThickness,
        temperature: closest.temperature,
        vibrationRms: closest.vibrationRms,
        acousticEmission: closest.acousticEmission,
        recommendation: closest.status === 'CRITICAL_DELAMINATION'
          ? 'CRITICAL: Severe splice delamination detected. Schedule emergency ultrasonic scan.'
          : (closest.status === 'ELEVATED_WEAR'
            ? 'WARNING: Accelerated splice wear. Prepare cold vulcanization repair kit.'
            : 'Splice in prime condition. Normal continuous operation.')
      };
    });
  }, [isPlaybackMode, historyData, historyByJoint, currentPlaybackTime, joints]);

  // Active joints passed to Three.js scene (live vs playback)
  const activeDisplayJoints = isPlaybackMode ? historicalJoints : joints;

  // Selected joint for the right-hand inspection card
  const selectedJoint = activeDisplayJoints.find(j => j.jointId === selectedJointId) || activeDisplayJoints[0];
  const jointTheme = getJointStatusColor(selectedJoint?.healthStatus);

  // Compute trend (improving, degrading, stable) at current scrubbed position
  const selectedJointTrend = useMemo(() => {
    if (!selectedJoint || !historyByJoint[selectedJoint.jointId]) return { dir: 'stable', delta: 0 };
    const list = historyByJoint[selectedJoint.jointId];
    if (list.length < 2) return { dir: 'stable', delta: 0 };

    const idx = list.findIndex(item => item.timeMs >= currentPlaybackTime);
    const curr = idx >= 0 ? list[idx] : list[list.length - 1];
    const prevIdx = Math.max(0, (idx >= 0 ? idx : list.length - 1) - 4);
    const prev = list[prevIdx];

    const diff = (curr.healthScore || 100) - (prev.healthScore || 100);
    if (diff < -2) return { dir: 'worsening', delta: Math.abs(diff) };
    if (diff > 2) return { dir: 'improving', delta: diff };
    return { dir: 'stable', delta: 0 };
  }, [selectedJoint, historyByJoint, currentPlaybackTime]);

  // RequestAnimationFrame Continuous Playback Clock
  useEffect(() => {
    if (!isPlaybackMode || !isPlaying) return;

    let lastFrameTime = performance.now();
    let frameId;

    const tick = (nowTime) => {
      const deltaSec = (nowTime - lastFrameTime) / 1000;
      lastFrameTime = nowTime;

      // 72 hours (259,200 seconds). At 20x, play 72h in ~15-20s -> timeScale = 14400
      // At 5x -> ~60s, at 1x -> ~300s
      const timeScale = 14400 * (playbackSpeed / 20);
      const advanceMs = deltaSec * timeScale * 1000;

      setCurrentPlaybackTime(prev => {
        const nextTime = prev + advanceMs;
        if (nextTime >= timeRange.max) {
          setIsPlaying(false);
          return timeRange.max;
        }
        return nextTime;
      });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaybackMode, isPlaying, playbackSpeed, timeRange]);

  // Mount Three.js Viewport
  useThreeScene({
    containerRef,
    joints: activeDisplayJoints,
    selectedJointId,
    beltSpeedMps: isPaused ? 0 : beltSpeedMps,
    speedMultiplier,
    cameraMode,
    onSelectJoint
  });

  // Format timestamps
  const formatPlaybackTime = (timeMs) => {
    const d = new Date(timeMs);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const getRelativeHoursAgo = (timeMs) => {
    const diffHours = ((timeRange.max - timeMs) / (3600 * 1000)).toFixed(1);
    return diffHours === '0.0' ? 'NOW (Real-Time)' : `-${diffHours}h ago`;
  };

  // Sparkline generator for selected joint
  const sparklinePoints = useMemo(() => {
    if (!selectedJoint || !historyByJoint[selectedJoint.jointId]) return '';
    const list = historyByJoint[selectedJoint.jointId];
    if (list.length < 2) return '';

    const width = 260;
    const height = 40;
    const padding = 2;

    const pts = list.map((item, i) => {
      const x = padding + (i / (list.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((item.healthScore || 0) / 100) * (height - 2 * padding);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return pts.join(' ');
  }, [selectedJoint, historyByJoint]);

  // Scrubber needle position on sparkline (0% to 100%)
  const scrubberPercentage = useMemo(() => {
    const range = timeRange.max - timeRange.min;
    if (range <= 0) return 100;
    const clamped = Math.max(timeRange.min, Math.min(timeRange.max, currentPlaybackTime));
    return ((clamped - timeRange.min) / range) * 100;
  }, [currentPlaybackTime, timeRange]);

  return (
    <div className="space-y-3">
      
      {/* 1. Main 3D WebGL Viewport Container */}
      <div className="relative w-full h-[600px] bg-[#090c13] rounded-2xl border border-[#1f293d] overflow-hidden flex flex-col lg:flex-row shadow-2xl">
        
        {/* Left / Center 3D WebGL Canvas */}
        <div className="relative flex-1 h-full">
          <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Top Floating Bar: Live / Replay Banner + Joint Selectors */}
          <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
            
            {/* Live vs Replay Mode Indicator */}
            {isPlaybackMode ? (
              <div className="flex items-center gap-2 pointer-events-auto bg-[#1a1208]/95 backdrop-blur-md border border-amber-500/50 rounded-xl px-3.5 py-2 text-xs shadow-2xl animate-fade-in">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="font-bold text-amber-300 font-mono flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  REPLAY MODE
                </span>
                <span className="text-slate-600 font-mono">|</span>
                <span className="text-amber-200 font-mono text-[11px]">{getRelativeHoursAgo(currentPlaybackTime)}</span>
                <span className="text-slate-600 font-mono">|</span>
                <span className="text-slate-300 font-mono text-[11px]">{playbackSpeed}x Speed</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 pointer-events-auto bg-[#0c101a]/90 backdrop-blur-md border border-[#1f293d] rounded-xl px-3.5 py-2 text-xs shadow-xl">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white font-mono">LIVE MONITORING</span>
                <span className="text-slate-600 font-mono">|</span>
                <span className="text-cyan-300 font-mono text-[11px]">{beltSpeedMps} m/s</span>
                <span className="text-slate-600 font-mono">|</span>
                <span className="text-orange-400 font-mono text-[11px]">{dynamicLoadTph} t/h</span>
              </div>
            )}

            {/* Quick Joint Selector Bar */}
            <div className="flex items-center gap-1.5 pointer-events-auto bg-[#0c101a]/90 backdrop-blur-md border border-[#1f293d] rounded-xl p-1.5 shadow-xl">
              {activeDisplayJoints.map(joint => {
                const isSelected = joint.jointId === selectedJointId;
                const isCritical = joint.healthStatus === 'CRITICAL_DELAMINATION' || joint.healthStatus === 'critical';
                const isWarning = joint.healthStatus === 'ELEVATED_WEAR' || joint.healthStatus === 'warning';

                return (
                  <button
                    key={joint.jointId}
                    onClick={() => onSelectJoint(joint.jointId)}
                    className={clsx(
                      'px-2.5 py-1 text-xs font-mono font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
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

          {/* Camera Presets (Floating on Bottom Left) */}
          <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-[#0c101a]/90 backdrop-blur-md border border-[#1f293d] rounded-xl p-1.5 pointer-events-auto shadow-xl">
            <span className="text-[10px] font-mono text-slate-500 uppercase px-2 flex items-center gap-1">
              <Camera className="w-3 h-3 text-cyan-400" /> Views:
            </span>

            {[
              { id: 'ISOMETRIC', label: 'Orbit' },
              { id: 'FOLLOW_JOINT', label: '🎯 Follow Splice' },
              { id: 'HEAD_DISCHARGE', label: 'Head Chute' },
              { id: 'TAIL_FEED', label: 'Tail Hopper' },
              { id: 'TOP_DOWN', label: 'Top-Down' }
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setCameraMode(v.id)}
                className={clsx(
                  'px-2.5 py-1 text-xs font-mono rounded-lg transition-all cursor-pointer',
                  cameraMode === v.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                )}
              >
                {v.label}
              </button>
            ))}
          </div>

        </div>

        {/* Right Side: Splice Joint Inspector Panel */}
        {selectedJoint && (
          <div className="w-full lg:w-80 h-auto lg:h-full bg-[#0c101a]/95 border-t lg:border-t-0 lg:border-l border-[#1f293d] p-5 flex flex-col justify-between overflow-y-auto shrink-0 shadow-2xl">
            
            <div className="space-y-4">
              {/* Header with Live vs Playback Status */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    {isPlaybackMode ? 'Historical Diagnostic' : 'Splice Diagnostic'}
                  </span>
                  <StatusBadge status={selectedJoint.healthStatus} size="xs" />
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedJoint.name || selectedJoint.jointId}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Position: {selectedJoint.positionMeters}m / 1200m
                </p>
              </div>

              {/* RUL & Risk Score Card with Trend Arrow */}
              <div className={clsx('p-3.5 rounded-xl border space-y-2', jointTheme.bg, jointTheme.border)}>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Estimated RUL
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={clsx('font-bold', jointTheme.text)}>
                      {selectedJoint.estimatedTimeToFailureDays} Days
                    </span>
                    {/* Trend Arrow */}
                    {selectedJointTrend.dir === 'worsening' && (
                      <span className="text-rose-400 text-[10px] font-bold flex items-center" title={`Degrading (-${selectedJointTrend.delta}% in health)`}>
                        <TrendingDown className="w-3.5 h-3.5" /> ↘
                      </span>
                    )}
                    {selectedJointTrend.dir === 'improving' && (
                      <span className="text-emerald-400 text-[10px] font-bold flex items-center" title="Improving">
                        <TrendingUp className="w-3.5 h-3.5" /> ↗
                      </span>
                    )}
                    {selectedJointTrend.dir === 'stable' && (
                      <span className="text-slate-400 text-[10px]" title="Stable health">
                        →
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>Rupture Risk Index</span>
                    <span className="font-bold text-white">{selectedJoint.riskScore}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={clsx('h-full transition-all duration-300', selectedJoint.riskScore >= 70 ? 'bg-red-500' : (selectedJoint.riskScore >= 35 ? 'bg-amber-500' : 'bg-emerald-500'))}
                      style={{ width: `${selectedJoint.riskScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 72-Hour Health Degradation Sparkline */}
              {historyByJoint[selectedJoint.jointId] && (
                <div className="p-3 bg-[#111726] border border-[#1f293d] rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-cyan-400">
                      <Activity className="w-3 h-3 text-cyan-400" />
                      72h Health Trajectory
                    </span>
                    <span>Health: {selectedJoint.healthScore || Math.round(100 - (selectedJoint.riskScore || 0))}%</span>
                  </div>

                  <div className="relative h-10 w-full bg-[#0a0d14] rounded-lg border border-[#1f293d]/80 overflow-hidden flex items-center justify-center">
                    <svg className="w-full h-full p-1" viewBox="0 0 260 40" preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={sparklinePoints}
                      />
                    </svg>

                    {/* Timeline Scrubber Needle */}
                    {isPlaybackMode && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-400 shadow-md shadow-amber-400/50 transition-all duration-75"
                        style={{ left: `${scrubberPercentage}%` }}
                      >
                        <div className="w-2 h-2 rounded-full bg-amber-400 -translate-x-[3px] -translate-y-0.5 shadow-sm" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Physical Transducer Array */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                  Splice Transducer State
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
                    <div className="text-[10px] text-slate-400">&lt;18.5mm Critical</div>
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
                    <div className="text-[10px] text-slate-400">&gt;65°C Elevated</div>
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
                      {selectedJoint.acousticEmission} dB
                    </div>
                    <div className="text-[10px] text-slate-400">Delamination wave</div>
                  </div>

                </div>
              </div>

              {/* Maintenance Prescription */}
              <div className="p-3 bg-[#111726] border border-[#1f293d] rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[11px] font-semibold">
                  <Wrench className="w-3.5 h-3.5" />
                  Prescription Note
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {selectedJoint.recommendation}
                </p>
              </div>

            </div>

            {/* Footer Status */}
            <div className="mt-4 pt-3 border-t border-[#1f293d] flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>{isPlaybackMode ? 'Replay Snapshot' : 'Live Stream'}</span>
              <span className="text-cyan-400 font-bold">{selectedJoint.healthStatus}</span>
            </div>

          </div>
        )}

      </div>

      {/* 2. HISTORICAL PLAYBACK SCRUBBER CONTROL BAR (Attached directly below 3D viewport) */}
      <div className="p-4 bg-[#0c101a]/95 border border-[#1f293d] rounded-2xl shadow-xl space-y-3">
        
        {/* Top Header of Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Mode Switcher: LIVE vs PLAYBACK */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsPlaybackMode(false);
                setIsPlaying(false);
              }}
              className={clsx(
                'px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer',
                !isPlaybackMode
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                  : 'bg-[#111726] text-slate-400 hover:text-white border border-[#1f293d]'
              )}
            >
              <span className={clsx('w-2 h-2 rounded-full', !isPlaybackMode ? 'bg-slate-950' : 'bg-emerald-400 animate-pulse')} />
              LIVE MODE
            </button>

            <button
              onClick={() => {
                setIsPlaybackMode(true);
                setIsPlaying(false);
                if (currentPlaybackTime >= timeRange.max) {
                  setCurrentPlaybackTime(timeRange.min);
                }
              }}
              className={clsx(
                'px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer',
                isPlaybackMode
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                  : 'bg-[#111726] text-slate-400 hover:text-white border border-[#1f293d]'
              )}
            >
              <History className="w-3.5 h-3.5" />
              HISTORICAL PLAYBACK
            </button>
          </div>

          {/* Current Scrubber Timestamp Display */}
          <div className="flex items-center gap-2 font-mono text-xs bg-[#111726] border border-[#1f293d] px-3.5 py-1.5 rounded-xl text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-white font-bold">
              {formatPlaybackTime(isPlaybackMode ? currentPlaybackTime : Date.now())}
            </span>
            <span className="text-slate-500">|</span>
            <span className={clsx('font-semibold', isPlaybackMode ? 'text-amber-400' : 'text-emerald-400')}>
              {isPlaybackMode ? getRelativeHoursAgo(currentPlaybackTime) : 'Streaming 20Hz'}
            </span>
          </div>

          {/* Speed & Playback Controls */}
          {isPlaybackMode && (
            <div className="flex items-center gap-1.5">
              {/* Rewind to Start */}
              <button
                onClick={() => {
                  setCurrentPlaybackTime(timeRange.min);
                  setIsPlaying(false);
                }}
                className="p-2 bg-[#111726] hover:bg-slate-800 border border-[#1f293d] rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Rewind to 72 Hours Ago"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Step Back 2 hours */}
              <button
                onClick={() => {
                  setCurrentPlaybackTime(prev => Math.max(timeRange.min, prev - 2 * 3600 * 1000));
                  setIsPlaying(false);
                }}
                className="p-2 bg-[#111726] hover:bg-slate-800 border border-[#1f293d] rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Step Back 2h"
              >
                <Rewind className="w-3.5 h-3.5" />
              </button>

              {/* Play / Pause Toggle */}
              <button
                onClick={() => {
                  if (currentPlaybackTime >= timeRange.max) {
                    setCurrentPlaybackTime(timeRange.min);
                  }
                  setIsPlaying(!isPlaying);
                }}
                className={clsx(
                  'px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md',
                  isPlaying
                    ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                    : 'bg-cyan-500 text-slate-950 shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500'
                )}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
              </button>

              {/* Step Forward 2 hours */}
              <button
                onClick={() => {
                  setCurrentPlaybackTime(prev => Math.min(timeRange.max, prev + 2 * 3600 * 1000));
                  setIsPlaying(false);
                }}
                className="p-2 bg-[#111726] hover:bg-slate-800 border border-[#1f293d] rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Step Forward 2h"
              >
                <FastForward className="w-3.5 h-3.5" />
              </button>

              {/* Speed Multipliers */}
              <div className="flex items-center gap-1 bg-[#111726] border border-[#1f293d] rounded-xl p-1">
                {[1, 5, 20].map(sp => (
                  <button
                    key={sp}
                    onClick={() => setPlaybackSpeed(sp)}
                    className={clsx(
                      'px-2 py-0.5 text-xs font-mono rounded-lg font-bold transition-all cursor-pointer',
                      playbackSpeed === sp
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    )}
                  >
                    {sp}x
                  </button>
                ))}
              </div>

              {/* Snap to Now Button */}
              <button
                onClick={() => {
                  setCurrentPlaybackTime(timeRange.max);
                  setIsPlaying(false);
                  setIsPlaybackMode(false);
                }}
                className="px-2.5 py-1.5 bg-[#111726] hover:bg-emerald-950/60 border border-[#1f293d] hover:border-emerald-500/50 rounded-xl text-xs font-mono text-emerald-400 font-semibold transition-colors cursor-pointer"
                title="Snap to Current Live State"
              >
                Snap Live
              </button>
            </div>
          )}

        </div>

        {/* Horizontal Timeline Scrubber Slider */}
        <div className="space-y-1.5 pt-1">
          <div className="relative flex items-center">
            <input
              type="range"
              min={timeRange.min}
              max={timeRange.max}
              step={1000 * 60 * 15} // 15-minute resolution
              value={isPlaybackMode ? currentPlaybackTime : timeRange.max}
              disabled={!isPlaybackMode}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCurrentPlaybackTime(val);
                setIsPlaying(false);
              }}
              className={clsx(
                'w-full h-2 rounded-lg appearance-none cursor-pointer transition-all',
                isPlaybackMode
                  ? 'bg-slate-800 accent-amber-400 hover:accent-amber-300'
                  : 'bg-slate-800/50 accent-emerald-500 opacity-60 cursor-not-allowed'
              )}
            />
          </div>

          {/* Timeline Range Labels */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
            <span>72 Hours Ago ({formatPlaybackTime(timeRange.min).split(',')[0]})</span>
            <span>48h Ago</span>
            <span className="text-amber-400/80 font-semibold">24h Ago (Joint-05 Transition Zone)</span>
            <span>12h Ago</span>
            <span className="text-emerald-400 font-bold">Now (Live)</span>
          </div>
        </div>

      </div>

    </div>
  );
}
