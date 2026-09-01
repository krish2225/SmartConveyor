import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { SENSOR_METADATA } from '../../../../shared/constants.js';
import { HeartPulse, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';

export default function ReliabilityHistoryPanel({ selectedSensor = 'drive_vibration', scores = {} }) {
  const currentItem = scores[selectedSensor] || {};
  const meta = SENSOR_METADATA[selectedSensor] || { name: selectedSensor, unit: '' };

  // Simulated 24-hour reliability degradation and recovery trend
  const historyTrend = [
    { time: '00:00', score: 98, uptime: 100, stuck: 100, noise: 95 },
    { time: '04:00', score: 96, uptime: 100, stuck: 100, noise: 90 },
    { time: '08:00', score: 92, uptime: 95, stuck: 100, noise: 85 },
    { time: '12:00', score: selectedSensor === 'ultrasonic_thickness' ? 78 : 94, uptime: 95, stuck: 100, noise: 80 },
    { time: '16:00', score: selectedSensor === 'ultrasonic_thickness' ? 76 : 95, uptime: 95, stuck: 100, noise: 82 },
    { time: '20:00', score: currentItem.reliabilityScore || 94, uptime: 100, stuck: 100, noise: 88 }
  ];

  return (
    <div className="bg-[#111726] border border-[#1f293d] rounded-2xl p-5 space-y-5">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-950/80 border border-cyan-500/40 rounded-lg text-cyan-400">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Reliability Trend: {meta.name}
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              24-Hour Physics Data Quality Metric
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Current Health:</span>
          <span className={clsx(
            'px-2.5 py-0.5 text-xs font-mono font-bold rounded-full border',
            (currentItem.reliabilityScore || 94) >= 85 ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50' :
            (currentItem.reliabilityScore || 94) >= 50 ? 'bg-amber-950 text-amber-400 border-amber-500/50' :
            'bg-red-950 text-red-400 border-red-500/50'
          )}>
            {currentItem.reliabilityScore || 94}% ({currentItem.status || 'HEALTHY'})
          </span>
        </div>
      </div>

      {/* Area Chart */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={historyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="relColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#00e5ff" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
            <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={{ stroke: '#1f293d' }} />
            <YAxis stroke="#64748b" fontSize={10} domain={[40, 100]} tickLine={false} axisLine={{ stroke: '#1f293d' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0c101a',
                borderColor: '#1f293d',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'monospace'
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              name="Reliability Score (%)"
              stroke="#00e5ff"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#relColor)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Exact SIH Formula Reference Box */}
      <div className="p-4 rounded-xl bg-[#0a0d14] border border-[#1f293d] text-xs space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>SIH PS 26008 Sensor Reliability Formula Reference</span>
        </div>
        <div className="font-mono text-[11px] bg-slate-900/90 p-2.5 rounded border border-slate-800 text-slate-200 overflow-x-auto">
          reliabilityScore = 0.35 × uptimeScore + 0.30 × stuckScore + 0.25 × rangeScore + 0.10 × jitterScore
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400 pt-1">
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
            <span className="text-emerald-400 font-bold block font-mono">≥ 85 (HEALTHY)</span>
            Full 1.0x weighting used in ML RUL &amp; anomaly detection.
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
            <span className="text-amber-400 font-bold block font-mono">50 - 84 (DEGRADED)</span>
            Down-weighted by (score / 100) before ML ingestion.
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
            <span className="text-red-400 font-bold block font-mono">&lt; 50 (FAULTY)</span>
            Excluded from inference to prevent false emergency stops.
          </div>
        </div>
      </div>

    </div>
  );
}
