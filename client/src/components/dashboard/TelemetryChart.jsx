import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Activity, Radio, BarChart2, Waves } from 'lucide-react';
import { Card } from '../ui/card.jsx';
import { Badge } from '../ui/badge.jsx';
import { Button } from '../ui/button.jsx';
import { cn } from '../../lib/utils.js';

export default function TelemetryChart({ telemetryHistory = [], isDumping = false }) {
  const [viewMode, setViewMode] = useState('line'); // 'line' | 'area' | 'oscilloscope'
  const [activeChannels, setActiveChannels] = useState({
    drive_vibration: true,
    dynamic_load: true,
    joint_temperature: true,
    ultrasonic_thickness: false,
    acoustic_emission: true
  });

  const toggleChannel = (channel) => {
    setActiveChannels(prev => ({
      ...prev,
      [channel]: !prev[channel]
    }));
  };

  const channelConfig = [
    { key: 'drive_vibration', name: 'Vibration', unit: 'mm/s', color: '#0284C7', yAxisId: 'left' },
    { key: 'dynamic_load', name: 'Load', unit: 't/h÷100', color: '#F97316', yAxisId: 'right' },
    { key: 'joint_temperature', name: 'Temp', unit: '°C', color: '#F59E0B', yAxisId: 'left' },
    { key: 'ultrasonic_thickness', name: 'Thickness', unit: 'mm', color: '#16A34A', yAxisId: 'left' },
    { key: 'acoustic_emission', name: 'Acoustic', unit: 'dB', color: '#EC4899', yAxisId: 'left' }
  ];

  // Clean time formatting helper (HH:mm:ss)
  const formatTimeLabel = (timestamp) => {
    if (!timestamp) return '';
    if (typeof timestamp === 'string') {
      // If contains time part
      if (timestamp.includes('T')) {
        const d = new Date(timestamp);
        return isNaN(d.getTime()) ? timestamp.slice(11, 19) : d.toLocaleTimeString('en-US', { hour12: false });
      }
      // If contains AM/PM
      if (timestamp.includes('AM') || timestamp.includes('PM')) {
        const parts = timestamp.split(' ');
        return parts[0] || timestamp;
      }
      return timestamp.slice(-8);
    }
    return String(timestamp);
  };

  // Process data for scaled visualization
  const chartData = telemetryHistory.map((pt, idx) => ({
    ...pt,
    formattedTime: formatTimeLabel(pt.timestamp || pt.time || `T-${30 - idx}s`),
    dynamic_load_scaled: pt.dynamic_load ? Number((pt.dynamic_load / 100).toFixed(1)) : 0
  }));

  // Frequency wave generation for Acoustic Oscilloscope mode
  const latestPt = chartData[chartData.length - 1] || {};
  const currentAcoustic = latestPt.acoustic_emission || 37;
  const currentVib = latestPt.drive_vibration || 2.3;

  return (
    <Card className="p-4 bg-surface border-border shadow-xs transition-colors select-none">
      
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-primary/10 border border-primary/20 text-primary">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground tracking-tight flex items-center gap-1.5">
              <span>Multi-Axis Transducer Telemetry Stream</span>
              <Badge variant="cyan" size="sm" className="font-mono text-[9px] py-0 px-1">
                20Hz LIVE
              </Badge>
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono">
              Synchronized 30-sample rolling buffer • Edge IoT Stream
            </p>
          </div>
        </div>

        {/* View Mode & Channel Toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center border border-border rounded-md p-0.5 bg-surface-sunken mr-1">
            <button
              onClick={() => setViewMode('line')}
              className={cn(
                "px-2 py-0.5 text-[10px] font-mono rounded transition-all",
                viewMode === 'line' ? "bg-surface font-bold text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Lines
            </button>
            <button
              onClick={() => setViewMode('area')}
              className={cn(
                "px-2 py-0.5 text-[10px] font-mono rounded transition-all",
                viewMode === 'area' ? "bg-surface font-bold text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Area
            </button>
            <button
              onClick={() => setViewMode('oscilloscope')}
              className={cn(
                "px-2 py-0.5 text-[10px] font-mono rounded transition-all flex items-center gap-1",
                viewMode === 'oscilloscope' ? "bg-surface font-bold text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Waves className="w-2.5 h-2.5" />
              <span>Oscilloscope</span>
            </button>
          </div>

          {viewMode !== 'oscilloscope' && channelConfig.map(ch => (
            <button
              key={ch.key}
              onClick={() => toggleChannel(ch.key)}
              className={cn(
                'px-2 py-0.5 text-[10px] font-mono rounded-md border transition-all flex items-center gap-1 cursor-pointer select-none',
                activeChannels[ch.key]
                  ? 'bg-surface-elevated text-foreground font-bold shadow-xs'
                  : 'bg-surface-sunken/60 text-muted-foreground border-border/70 hover:text-foreground opacity-60'
              )}
              style={{ borderColor: activeChannels[ch.key] ? ch.color : undefined }}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ch.color }} />
              <span>{ch.name}</span>
            </button>
          ))}

          {isDumping && (
            <Badge variant="warning" size="sm" className="font-mono animate-pulse">
              ● DUMP SURGE
            </Badge>
          )}
        </div>
      </div>

      {/* Main Graph Content */}
      {viewMode === 'oscilloscope' ? (
        /* Real-time Acoustic / Vibration Frequency Oscilloscope */
        <div className="h-60 w-full bg-slate-950 rounded-lg p-3 flex flex-col justify-between border border-slate-800 text-cyan-400 font-mono select-none">
          <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
              <span className="font-bold text-slate-200">Acoustic Emission Ultrasonic FFT Spectrum (Station #4)</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Center Freq: <span className="text-cyan-300 font-bold">128.4 kHz</span> | Stress: <span className="text-pink-400 font-bold">{currentAcoustic} dB</span>
            </div>
          </div>

          {/* SVG Animated Oscilloscope Waveform */}
          <div className="relative flex-1 flex items-center justify-center my-2">
            <svg className="w-full h-28 overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 100">
              {/* Grid lines */}
              <line x1="0" y1="50" x2="400" y2="50" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="100" y1="0" x2="100" y2="100" stroke="#1e293b" strokeWidth="1" />
              <line x1="200" y1="0" x2="200" y2="100" stroke="#1e293b" strokeWidth="1" />
              <line x1="300" y1="0" x2="300" y2="100" stroke="#1e293b" strokeWidth="1" />

              {/* Dynamic Waveform Path */}
              <path
                d={`M 0,50 Q 50,${50 - currentAcoustic * 0.8} 100,50 T 200,${50 + currentVib * 12} T 300,${50 - currentAcoustic * 0.6} T 400,50`}
                fill="none"
                stroke="#22D3EE"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="transition-all duration-300"
              />
              <path
                d={`M 0,50 Q 50,${50 + currentAcoustic * 0.5} 100,50 T 200,${50 - currentVib * 8} T 300,${50 + currentAcoustic * 0.4} T 400,50`}
                fill="none"
                stroke="#EC4899"
                strokeWidth="1.5"
                strokeOpacity="0.7"
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>

            {/* Glowing scan target */}
            <div className="absolute top-2 right-4 text-[10px] bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded text-cyan-300">
              ● PEAK HARMONIC: 4.8 kHz
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
            <span>Harmonic Resonance: 0.02 - 180.0 kHz</span>
            <span>Piezoelectric Transducer Calibrated</span>
          </div>
        </div>
      ) : (
        /* Recharts Time Series */
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVib" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                <XAxis
                  dataKey="formattedTime"
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  interval={Math.max(1, Math.floor(chartData.length / 5))}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#94A3B8"
                  fontSize={10}
                  domain={[0, 'auto']}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#F97316"
                  fontSize={10}
                  domain={[0, 35]}
                  tickLine={false}
                  axisLine={false}
                  hide={!activeChannels.dynamic_load}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface, #FFFFFF)',
                    borderColor: 'var(--border, #E2E8F0)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                  }}
                />
                {activeChannels.drive_vibration && (
                  <Area
                    type="monotone"
                    dataKey="drive_vibration"
                    name="Vibration (mm/s)"
                    stroke="#0284C7"
                    fillOpacity={1}
                    fill="url(#colorVib)"
                    strokeWidth={2}
                    yAxisId="left"
                    isAnimationActive={false}
                  />
                )}
                {activeChannels.joint_temperature && (
                  <Area
                    type="monotone"
                    dataKey="joint_temperature"
                    name="Temp (°C)"
                    stroke="#F59E0B"
                    fillOpacity={1}
                    fill="url(#colorTemp)"
                    strokeWidth={2}
                    yAxisId="left"
                    isAnimationActive={false}
                  />
                )}
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                <XAxis
                  dataKey="formattedTime"
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  interval={Math.max(1, Math.floor(chartData.length / 5))}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#94A3B8"
                  fontSize={10}
                  domain={[0, 'auto']}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#F97316"
                  fontSize={10}
                  domain={[0, 35]}
                  tickLine={false}
                  axisLine={false}
                  hide={!activeChannels.dynamic_load}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface, #FFFFFF)',
                    borderColor: 'var(--border, #E2E8F0)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                  }}
                />

                {activeChannels.drive_vibration && (
                  <Line
                    type="monotone"
                    dataKey="drive_vibration"
                    name="Vibration (mm/s)"
                    stroke="#0284C7"
                    strokeWidth={2}
                    dot={false}
                    yAxisId="left"
                    isAnimationActive={false}
                  />
                )}
                {activeChannels.dynamic_load && (
                  <Line
                    type="monotone"
                    dataKey="dynamic_load_scaled"
                    name="Load (t/h / 100)"
                    stroke="#F97316"
                    strokeWidth={2}
                    dot={false}
                    yAxisId="right"
                    isAnimationActive={false}
                  />
                )}
                {activeChannels.joint_temperature && (
                  <Line
                    type="monotone"
                    dataKey="joint_temperature"
                    name="Temp (°C)"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={false}
                    yAxisId="left"
                    isAnimationActive={false}
                  />
                )}
                {activeChannels.ultrasonic_thickness && (
                  <Line
                    type="monotone"
                    dataKey="ultrasonic_thickness"
                    name="Splice Thickness (mm)"
                    stroke="#16A34A"
                    strokeWidth={2}
                    dot={false}
                    yAxisId="left"
                    isAnimationActive={false}
                  />
                )}
                {activeChannels.acoustic_emission && (
                  <Line
                    type="monotone"
                    dataKey="acoustic_emission"
                    name="Acoustic Stress (dB)"
                    stroke="#EC4899"
                    strokeWidth={2}
                    dot={false}
                    yAxisId="left"
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Footer Meta */}
      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-2 pt-2 border-t border-border/70">
        <span>Continuous PIPE Buffer: {chartData.length} data points</span>
        <span className="flex items-center gap-1 text-primary">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Edge Transducer Synced
        </span>
      </div>

    </Card>
  );
}
