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
import { Card } from '../ui/card.jsx';
import { Badge } from '../ui/badge.jsx';
import { HeartPulse, ShieldCheck } from 'lucide-react';

export default function ReliabilityHistoryPanel({ selectedSensor = 'drive_vibration', scores = {}, scoreData }) {
  const currentItem = scoreData || scores[selectedSensor] || {};
  const meta = SENSOR_METADATA[selectedSensor] || { name: selectedSensor, unit: '' };

  const historyTrend = [
    { time: '00:00', score: 98, uptime: 100, stuck: 100, noise: 95 },
    { time: '04:00', score: 96, uptime: 100, stuck: 100, noise: 90 },
    { time: '08:00', score: 92, uptime: 95, stuck: 100, noise: 85 },
    { time: '12:00', score: selectedSensor === 'ultrasonic_thickness' ? 78 : 94, uptime: 95, stuck: 100, noise: 80 },
    { time: '16:00', score: selectedSensor === 'ultrasonic_thickness' ? 76 : 95, uptime: 95, stuck: 100, noise: 82 },
    { time: '20:00', score: currentItem.reliabilityScore || 94, uptime: 100, stuck: 100, noise: 88 }
  ];

  return (
    <Card className="p-4 bg-surface border-border shadow-xs space-y-4 transition-colors select-none">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 border border-primary/30 rounded-md text-primary">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">
              Reliability Trajectory: {meta.name}
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono">
              24-Hour Physics Data Quality Metric History
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">Channel Index:</span>
          <Badge
            variant={(currentItem.reliabilityScore || 94) >= 85 ? 'nominal' : ((currentItem.reliabilityScore || 94) >= 50 ? 'warning' : 'critical')}
            size="default"
            className="font-mono tabular-nums text-xs"
          >
            {currentItem.reliabilityScore || 94}% ({currentItem.status || 'HEALTHY'})
          </Badge>
        </div>
      </div>

      {/* Area Chart */}
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={historyTrend} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="relColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284C7" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
            <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }} />
            <YAxis stroke="#94A3B8" fontSize={10} domain={[40, 100]} tickLine={false} axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }} />
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
            <Area
              type="monotone"
              dataKey="score"
              name="Reliability Score (%)"
              stroke="#0284C7"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#relColor)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Exact SIH Formula Reference Box */}
      <div className="p-3.5 rounded-lg bg-surface-sunken/70 border border-border text-xs space-y-2 select-none">
        <div className="flex items-center gap-2 text-primary font-mono font-bold text-xs">
          <ShieldCheck className="w-4 h-4" />
          <span>Physics Reliability Formula Reference</span>
        </div>
        <div className="text-[11px] text-muted-foreground font-mono space-y-1">
          <div><code>Score = 0.35(Uptime) + 0.30(Stuck) + 0.25(Range) + 0.10(Noise)</code></div>
          <div className="text-[10px] text-muted-foreground">
            Down-weights faulty sensor inputs to protect ML models from bad telemetry.
          </div>
        </div>
      </div>

    </Card>
  );
}
