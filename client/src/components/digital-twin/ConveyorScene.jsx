import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useThreeScene } from './useThreeScene.js';
import StatusBadge from '../shared/StatusBadge.jsx';
import { getJointStatusColor } from '../../utils/colorMapping.js';
import { getAllJointsHistoryApi } from '../../services/api.js';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card.jsx';
import { Badge } from '../ui/badge.jsx';
import { Button } from '../ui/button.jsx';
import { Slider } from '../ui/slider.jsx';
import { Progress } from '../ui/progress.jsx';
import { Separator } from '../ui/separator.jsx';
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
  RotateCcw,
  FastForward,
  Rewind,
  History,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Calendar
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

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

  // Group history records by jointId for instant $O(1)$ lookup
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

      let closest = list[0];
      let minDiff = Math.abs(list[0].timeMs - currentPlaybackTime);

      for (let i = 1; i < list.length; i++) {
        const diff = Math.abs(list[i].timeMs - currentPlaybackTime);
        if (diff < minDiff) {
          minDiff = diff;
          closest = list[i];
        } else {
          break;
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

  // Compute trend at current scrubbed position
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
    return diffHours === '0.0' ? 'NOW (Live)' : `-${diffHours}h ago`;
  };

  // Sparkline generator for selected joint
  const sparklinePoints = useMemo(() => {
    if (!selectedJoint || !historyByJoint[selectedJoint.jointId]) return '';
    const list = historyByJoint[selectedJoint.jointId];
    if (list.length < 2) return '';

    const width = 260;
    const height = 36;
    const padding = 2;

    const pts = list.map((item, i) => {
      const x = padding + (i / (list.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((item.healthScore || 0) / 100) * (height - 2 * padding);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return pts.join(' ');
  }, [selectedJoint, historyByJoint]);

  const scrubberPercentage = useMemo(() => {
    const range = timeRange.max - timeRange.min;
    if (range <= 0) return 100;
    const clamped = Math.max(timeRange.min, Math.min(timeRange.max, currentPlaybackTime));
    return ((clamped - timeRange.min) / range) * 100;
  }, [currentPlaybackTime, timeRange]);

  return (
    <div className="space-y-3">
      
      {/* 1. Main 3D WebGL Viewport Container */}
      <div className="relative w-full h-[560px] bg-[#090D12] rounded-md border border-border overflow-hidden flex flex-col lg:flex-row shadow-2xl">
        
        {/* Left / Center 3D WebGL Canvas */}
        <div className="relative flex-1 h-full">
          <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Top Floating Bar: Live / Replay Banner + Joint Selectors */}
          <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
            
            {/* Live vs Replay Mode Indicator */}
            {isPlaybackMode ? (
              <div className="flex items-center gap-2 pointer-events-auto bg-surface-elevated/95 backdrop-blur-md border border-amber-500/50 rounded-md px-3 py-1.5 text-xs shadow-xl animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="font-bold text-amber-300 font-mono flex items-center gap-1">
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  REPLAY MODE
                </span>
                <span className="text-border">|</span>
                <span className="text-amber-200 font-mono text-[11px] tabular-nums">{getRelativeHoursAgo(currentPlaybackTime)}</span>
                <span className="text-border">|</span>
                <span className="text-muted-foreground font-mono text-[11px]">{playbackSpeed}x Speed</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 pointer-events-auto bg-surface/90 backdrop-blur-md border border-border rounded-md px-3 py-1.5 text-xs shadow-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-foreground font-mono">LIVE MONITORING</span>
                <span className="text-border">|</span>
                <span className="text-cyan-300 font-mono text-[11px] tabular-nums">{beltSpeedMps} m/s</span>
                <span className="text-border">|</span>
                <span className="text-orange-400 font-mono text-[11px] tabular-nums">{dynamicLoadTph} t/h</span>
              </div>
            )}

            {/* Quick Joint Selector Bar */}
            <div className="flex items-center gap-1 pointer-events-auto bg-surface/90 backdrop-blur-md border border-border rounded-md p-1 shadow-xl">
              {activeDisplayJoints.map(joint => {
                const isSelected = joint.jointId === selectedJointId;
                const isCritical = joint.healthStatus === 'CRITICAL_DELAMINATION' || joint.healthStatus === 'critical';
                const isWarning = joint.healthStatus === 'ELEVATED_WEAR' || joint.healthStatus === 'warning';

                return (
                  <button
                    key={joint.jointId}
                    onClick={() => onSelectJoint(joint.jointId)}
                    className={cn(
                      'px-2 py-0.5 text-xs font-mono font-semibold rounded transition-all flex items-center gap-1 cursor-pointer select-none',
                      isSelected
                        ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                        : 'bg-surface-sunken text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      isCritical ? 'bg-red-400 animate-ping' : (isWarning ? 'bg-amber-400' : 'bg-emerald-400')
                    )} />
                    <span>{joint.jointId.replace('Joint-', 'J-')}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Camera Presets (Floating on Bottom Left) */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-surface/90 backdrop-blur-md border border-border rounded-md p-1 pointer-events-auto shadow-xl">
            <span className="text-[10px] font-mono text-muted-foreground uppercase px-1.5 flex items-center gap-1">
              <Camera className="w-3 h-3 text-primary" /> View:
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
                className={cn(
                  'px-2 py-0.5 text-[11px] font-mono rounded transition-all cursor-pointer select-none',
                  cameraMode === v.id
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                {v.label}
              </button>
            ))}
          </div>

        </div>

        {/* Right Side: Splice Joint Inspector Panel */}
        {selectedJoint && (
          <div className="w-full lg:w-80 h-auto lg:h-full bg-surface border-t lg:border-t-0 lg:border-l border-border p-4 flex flex-col justify-between overflow-y-auto shrink-0 shadow-2xl">
            
            <div className="space-y-3">
              {/* Header with Diagnostic Status */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-primary uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    {isPlaybackMode ? 'Historical Diagnostic' : 'Splice Diagnostic'}
                  </span>
                  <StatusBadge status={selectedJoint.healthStatus} size="xs" />
                </div>
                <h3 className="text-sm font-bold text-foreground mt-1">
                  {selectedJoint.name || selectedJoint.jointId}
                </h3>
                <p className="text-[11px] text-muted-foreground font-mono">
                  Location: <strong className="text-foreground">{selectedJoint.positionMeters}m</strong> / 1200m Belt Loop
                </p>
              </div>

              {/* RUL & Risk Score Card with Trend Arrow */}
              <div className="p-3 rounded-md bg-surface-sunken border border-border space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    Estimated RUL
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground tabular-nums">
                      {selectedJoint.estimatedTimeToFailureDays} Days ({Math.round((selectedJoint.estimatedTimeToFailureDays || 6) * 24)}h)
                    </span>
                    {selectedJointTrend.dir === 'worsening' && (
                      <span className="text-red-400 text-[10px] font-bold flex items-center" title="Degrading">
                        <TrendingDown className="w-3 h-3" />
                      </span>
                    )}
                    {selectedJointTrend.dir === 'improving' && (
                      <span className="text-emerald-400 text-[10px] font-bold flex items-center" title="Improving">
                        <TrendingUp className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
                    <span>Rupture Risk Index</span>
                    <span className="font-bold text-foreground tabular-nums">{selectedJoint.riskScore}%</span>
                  </div>
                  <Progress
                    value={selectedJoint.riskScore}
                    indicatorClassName={selectedJoint.riskScore >= 70 ? 'bg-red-500' : (selectedJoint.riskScore >= 35 ? 'bg-amber-500' : 'bg-emerald-500')}
                  />
                </div>
              </div>

              {/* 72-Hour Health Degradation Sparkline */}
              {historyByJoint[selectedJoint.jointId] && (
                <div className="p-2.5 bg-surface-sunken border border-border rounded-md space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1 font-semibold text-primary">
                      <Activity className="w-3 h-3 text-primary" />
                      72h Health Curve
                    </span>
                    <span className="tabular-nums">Health: {selectedJoint.healthScore || Math.round(100 - (selectedJoint.riskScore || 0))}%</span>
                  </div>

                  <div className="relative h-9 w-full bg-background rounded border border-border/80 overflow-hidden flex items-center justify-center">
                    <svg className="w-full h-full p-1" viewBox="0 0 260 36" preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke="#22D3EE"
                        strokeWidth="1.5"
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
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 -translate-x-[2px] -translate-y-0.5" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Physical Transducer Array */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-bold">
                  Splice Transducer State
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  
                  {/* Ultrasonic Thickness */}
                  <div className="p-2 bg-surface-sunken border border-border rounded">
                    <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-mono">
                      <Layers className="w-3 h-3 text-primary" />
                      Thickness
                    </div>
                    <div className="text-xs font-bold font-mono text-foreground mt-0.5 tabular-nums">
                      {selectedJoint.ultrasonicThickness} mm
                    </div>
                    <div className="text-[9px] text-muted-foreground font-mono">&lt;18.5mm Limit</div>
                  </div>

                  {/* Thermal Core */}
                  <div className="p-2 bg-surface-sunken border border-border rounded">
                    <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-mono">
                      <Thermometer className="w-3 h-3 text-amber-400" />
                      Thermal Core
                    </div>
                    <div className="text-xs font-bold font-mono text-foreground mt-0.5 tabular-nums">
                      {selectedJoint.temperature} °C
                    </div>
                    <div className="text-[9px] text-muted-foreground font-mono">&gt;65°C Elevated</div>
                  </div>

                  {/* Vibration */}
                  <div className="p-2 bg-surface-sunken border border-border rounded">
                    <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-mono">
                      <Activity className="w-3 h-3 text-primary" />
                      Vibration
                    </div>
                    <div className="text-xs font-bold font-mono text-foreground mt-0.5 tabular-nums">
                      {selectedJoint.vibrationRms} mm/s
                    </div>
                    <div className="text-[9px] text-muted-foreground font-mono">ISO 10816 Zone</div>
                  </div>

                  {/* Acoustic Stress */}
                  <div className="p-2 bg-surface-sunken border border-border rounded">
                    <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-mono">
                      <Radio className="w-3 h-3 text-pink-400" />
                      Acoustic
                    </div>
                    <div className="text-xs font-bold font-mono text-foreground mt-0.5 tabular-nums">
                      {selectedJoint.acousticEmission} dB
                    </div>
                    <div className="text-[9px] text-muted-foreground font-mono">Delam. Wave</div>
                  </div>

                </div>
              </div>

              {/* Maintenance Prescription */}
              <div className="p-2.5 bg-surface-sunken border border-border rounded-md text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-primary font-mono text-[10px] font-bold">
                  <Wrench className="w-3 h-3" />
                  Prescription Note
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {selectedJoint.recommendation}
                </p>
              </div>

            </div>

            {/* Footer Status */}
            <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>{isPlaybackMode ? 'Replay Snapshot' : 'Live Transducer Stream'}</span>
              <span className="text-primary font-bold">{selectedJoint.healthStatus}</span>
            </div>

          </div>
        )}

      </div>

      {/* 2. HISTORICAL PLAYBACK SCRUBBER CONTROL BAR */}
      <div className="p-3.5 bg-surface border border-border rounded-md shadow-xl space-y-2.5 select-none">
        
        {/* Top Header of Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Mode Switcher: LIVE vs PLAYBACK */}
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={!isPlaybackMode ? "nominal" : "outline"}
              onClick={() => {
                setIsPlaybackMode(false);
                setIsPlaying(false);
              }}
              className="font-mono text-[11px] gap-1.5 font-bold"
            >
              <span className={cn('w-2 h-2 rounded-full', !isPlaybackMode ? 'bg-white' : 'bg-emerald-400 animate-pulse')} />
              LIVE STREAM
            </Button>

            <Button
              size="sm"
              variant={isPlaybackMode ? "warning" : "outline"}
              onClick={() => {
                setIsPlaybackMode(true);
                setIsPlaying(false);
                if (currentPlaybackTime >= timeRange.max) {
                  setCurrentPlaybackTime(timeRange.min);
                }
              }}
              className="font-mono text-[11px] gap-1.5 font-bold"
            >
              <History className="w-3.5 h-3.5" />
              HISTORICAL PLAYBACK
            </Button>
          </div>

          {/* Current Scrubber Timestamp Display */}
          <div className="flex items-center gap-2 font-mono text-xs bg-surface-sunken border border-border px-3 py-1 rounded text-foreground">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="font-bold tabular-nums">
              {formatPlaybackTime(isPlaybackMode ? currentPlaybackTime : Date.now())}
            </span>
            <span className="text-border">|</span>
            <span className={cn('font-semibold text-[11px]', isPlaybackMode ? 'text-amber-400' : 'text-emerald-400')}>
              {isPlaybackMode ? getRelativeHoursAgo(currentPlaybackTime) : 'Streaming 20Hz'}
            </span>
          </div>

          {/* Speed & Playback Controls */}
          {isPlaybackMode && (
            <div className="flex items-center gap-1">
              {/* Rewind to Start */}
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => {
                  setCurrentPlaybackTime(timeRange.min);
                  setIsPlaying(false);
                }}
                title="Rewind to 72 Hours Ago"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>

              {/* Step Back 2 hours */}
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => {
                  setCurrentPlaybackTime(prev => Math.max(timeRange.min, prev - 2 * 3600 * 1000));
                  setIsPlaying(false);
                }}
                title="Step Back 2h"
              >
                <Rewind className="w-3.5 h-3.5" />
              </Button>

              {/* Play / Pause Toggle */}
              <Button
                variant={isPlaying ? "warning" : "default"}
                size="sm"
                onClick={() => {
                  if (currentPlaybackTime >= timeRange.max) {
                    setCurrentPlaybackTime(timeRange.min);
                  }
                  setIsPlaying(!isPlaying);
                }}
                className="font-mono text-xs font-bold gap-1.5"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
              </Button>

              {/* Step Forward 2 hours */}
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => {
                  setCurrentPlaybackTime(prev => Math.min(timeRange.max, prev + 2 * 3600 * 1000));
                  setIsPlaying(false);
                }}
                title="Step Forward 2h"
              >
                <FastForward className="w-3.5 h-3.5" />
              </Button>

              {/* Speed Multipliers */}
              <div className="flex items-center gap-0.5 bg-surface-sunken border border-border rounded p-0.5">
                {[1, 5, 20].map(sp => (
                  <button
                    key={sp}
                    onClick={() => setPlaybackSpeed(sp)}
                    className={cn(
                      'px-1.5 py-0.5 text-[10px] font-mono rounded font-bold transition-all cursor-pointer',
                      playbackSpeed === sp
                        ? 'bg-amber-500 text-black shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {sp}x
                  </button>
                ))}
              </div>

              {/* Snap to Now Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentPlaybackTime(timeRange.max);
                  setIsPlaying(false);
                  setIsPlaybackMode(false);
                }}
                className="text-emerald-400 font-mono text-[11px] border-emerald-500/30 hover:border-emerald-500/60"
              >
                Snap Live
              </Button>
            </div>
          )}

        </div>

        {/* Horizontal Timeline Scrubber Slider */}
        <div className="space-y-1 pt-1">
          <input
            type="range"
            min={timeRange.min}
            max={timeRange.max}
            step={1000 * 60 * 15}
            value={isPlaybackMode ? currentPlaybackTime : timeRange.max}
            disabled={!isPlaybackMode}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCurrentPlaybackTime(val);
              setIsPlaying(false);
            }}
            className={cn(
              'w-full h-2 rounded-lg appearance-none cursor-pointer transition-all',
              isPlaybackMode
                ? 'bg-surface-sunken accent-amber-400 hover:accent-amber-300'
                : 'bg-surface-sunken accent-emerald-500 opacity-60 cursor-not-allowed'
            )}
          />

          {/* Timeline Range Labels */}
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground px-0.5">
            <span>72 Hours Ago ({formatPlaybackTime(timeRange.min).split(',')[0]})</span>
            <span>48h Ago</span>
            <span className="text-amber-400 font-semibold">24h Ago (Joint-05 Degradation Zone)</span>
            <span>12h Ago</span>
            <span className="text-emerald-400 font-bold">Now (Live)</span>
          </div>
        </div>

      </div>

    </div>
  );
}
