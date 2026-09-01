import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { Activity, Play, Pause, RefreshCw, Eye } from 'lucide-react';
import clsx from 'clsx';

export default function TelemetryChart({ telemetryHistory = [], isDumping = false }) {
  const [isPaused, setIsPaused] = useState(false);
  const [activeChannels, setActiveChannels] = useState({
    drive_vibration: true,
    dynamic_load: false,
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
    { key: 'drive_vibration', name: 'Vibration (mm/s)', color: '#00e5ff', yAxisId: 'left' },
    { key: 'dynamic_load', name: 'Load (t/h / 100)', color: '#ea580c', yAxisId: 'right', transform: v => (v / 100).toFixed(1) },
    { key: 'joint_temperature', name: 'Temp (°C)', color: '#f59e0b', yAxisId: 'left' },
    { key: 'ultrasonic_thickness', name: 'Splice Thickness (mm)', color: '#10b981', yAxisId: 'left' },
    { key: 'acoustic_emission', name: 'Acoustic Stress (dB)', color: '#ec4899', yAxisId: 'left' }
  ];

  // Process data for scaled visualization
  const chartData = telemetryHistory.map(pt => ({
    ...pt,
    dynamic_load_scaled: pt.dynamic_load ? pt.dynamic_load / 100 : 0
  }));

  return (
    <div className="bg-[#111726] border border-[#1f293d] rounded-2xl p-5">

      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-950/80 border border-cyan-500/40 rounded-lg text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">System Telemetry Stream</h3>
            <p className="text-[11px] text-slate-400 font-mono">Multi-axis transducer response</p>
          </div>
        </div>

        {/* Channel Toggles & Pause Button */}
        <div className="flex flex-wrap items-center gap-2">
          {channelConfig.map(ch => (
            <button
              key={ch.key}
              onClick={() => toggleChannel(ch.key)}
              className={clsx(
                'px-2.5 py-1 text-[11px] font-mono rounded-lg border transition-all flex items-center gap-1.5',
                activeChannels[ch.key]
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'bg-[#0a0d14] text-slate-500 border-slate-800 hover:text-slate-300'
              )}
              style={{ borderColor: activeChannels[ch.key] ? ch.color : undefined }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ch.color }} />
              {ch.name.split(' (')[0]}
            </button>
          ))}

          {isDumping && (
            <span className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-orange-950 border border-orange-500/50 text-orange-400 font-bold animate-pulse">
              ● DUMP WINDOW ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
            <XAxis
              dataKey="timestamp"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#1f293d' }}
            />
            <YAxis
              yAxisId="left"
              stroke="#64748b"
              fontSize={10}
              domain={[0, 'auto']}
              tickLine={false}
              axisLine={{ stroke: '#1f293d' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#ea580c"
              fontSize={10}
              domain={[0, 35]}
              tickLine={false}
              axisLine={false}
              hide={!activeChannels.dynamic_load}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0c101a',
                borderColor: '#1f293d',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'monospace'
              }}
              labelStyle={{ color: '#00e5ff', fontWeight: 'bold' }}
            />

            {activeChannels.drive_vibration && (
              <Line
                type="monotone"
                dataKey="drive_vibration"
                name="Vibration (mm/s)"
                stroke="#00e5ff"
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
                stroke="#ea580c"
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
                name="Temperature (°C)"
                stroke="#f59e0b"
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
                stroke="#10b981"
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
                name="Acoustic (dB)"
                stroke="#ec4899"
                strokeWidth={2}
                dot={false}
                yAxisId="left"
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Continuous rolling buffer: last 30 readings (1.5s sampling rate)</span>
        <span className="text-cyan-400"> IoT Edge Telemetry</span>
      </div>

    </div>
  );
}
