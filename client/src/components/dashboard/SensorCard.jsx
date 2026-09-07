import React from 'react';
import { SENSOR_METADATA } from '../../../../shared/constants.js';
import { evaluateSensorStatus, formatSensorValue } from '../../utils/thresholds.js';
import { Card } from '../ui/card.jsx';
import { Badge } from '../ui/badge.jsx';
import {
  Activity,
  Gauge,
  Weight,
  Thermometer,
  Layers,
  Radio,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

const SENSOR_STYLING = {
  drive_vibration: {
    icon: Activity,
    color: '#38BDF8',
    bgLight: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    accentText: 'text-sky-400',
    sparkline: '#38BDF8'
  },
  belt_speed: {
    icon: Gauge,
    color: '#22D3EE',
    bgLight: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    accentText: 'text-cyan-400',
    sparkline: '#22D3EE'
  },
  dynamic_load: {
    icon: Weight,
    color: '#F59E0B',
    bgLight: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    accentText: 'text-amber-400',
    sparkline: '#F59E0B'
  },
  joint_temperature: {
    icon: Thermometer,
    color: '#F43F5E',
    bgLight: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    accentText: 'text-rose-400',
    sparkline: '#F43F5E'
  },
  ultrasonic_thickness: {
    icon: Layers,
    color: '#10B981',
    bgLight: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    accentText: 'text-emerald-400',
    sparkline: '#10B981'
  },
  acoustic_emission: {
    icon: Radio,
    color: '#A855F7',
    bgLight: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    accentText: 'text-purple-400',
    sparkline: '#A855F7'
  }
};

export default function SensorCard({
  sensorType,
  currentValue,
  history = [],
  reliabilityScore = 95
}) {
  const metadata = SENSOR_METADATA[sensorType] || {
    name: sensorType,
    unit: '',
    nominalRange: [0, 100]
  };

  const style = SENSOR_STYLING[sensorType] || SENSOR_STYLING.drive_vibration;
  const Icon = style.icon;
  const evaluation = evaluateSensorStatus(sensorType, currentValue);
  const formattedVal = formatSensorValue(sensorType, currentValue);

  // Build SVG Sparkline path
  const sparklineValues = history.map(h => (typeof h === 'object' ? h[sensorType] : h)).filter(v => v !== undefined && !isNaN(v));
  let sparklinePath = '';

  if (sparklineValues.length >= 2) {
    const minVal = Math.min(...sparklineValues);
    const maxVal = Math.max(...sparklineValues);
    const range = (maxVal - minVal) || 1;
    const width = 100;
    const height = 24;

    const points = sparklineValues.map((val, idx) => {
      const x = (idx / (sparklineValues.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    sparklinePath = `M ${points.join(' L ')}`;
  }

  // Trend detection from history
  const trend = (() => {
    if (sparklineValues.length < 4) return { dir: 'stable', icon: Minus };
    const first = sparklineValues[0];
    const last = sparklineValues[sparklineValues.length - 1];
    const diff = last - first;
    if (Math.abs(diff) < 0.05) return { dir: 'stable', icon: Minus };
    if (diff > 0) return { dir: 'up', icon: TrendingUp };
    return { dir: 'down', icon: TrendingDown };
  })();
  const TrendIcon = trend.icon;

  const getBorderColor = () => {
    if (evaluation.status === 'CRITICAL') return 'border-red-500/60 bg-red-950/20 shadow-red-500/10';
    if (evaluation.status === 'WARNING') return 'border-amber-500/60 bg-amber-950/20 shadow-amber-500/10';
    return 'border-border bg-surface hover:border-border/90 shadow-xs';
  };

  const getBadgeVariant = () => {
    if (evaluation.status === 'CRITICAL') return 'critical';
    if (evaluation.status === 'WARNING') return 'warning';
    return 'nominal';
  };

  return (
    <Card className={cn('p-3.5 flex flex-col justify-between transition-all select-none border rounded-lg', getBorderColor())}>
      
      {/* Top row: Distinct Sensor Icon, Full Name & Status Badge */}
      <div>
        <div className="flex items-start justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className={cn('p-1 rounded border shrink-0', style.bgLight)}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-foreground leading-tight" title={metadata.name}>
              {metadata.name}
            </span>
          </div>

          <Badge variant={getBadgeVariant()} size="sm" className="shrink-0 font-mono text-[9px] px-1.5 py-0">
            {evaluation.status}
          </Badge>
        </div>

        {/* Middle Value Display with Unit & Trend */}
        <div className="flex items-baseline justify-between gap-2 mt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono tracking-tight text-foreground tabular-nums">
              {formattedVal}
            </span>
            <span className="text-[11px] font-mono font-semibold text-muted-foreground">
              {metadata.unit}
            </span>
          </div>

          <div className="flex items-center gap-0.5 text-[10px] font-mono text-muted-foreground" title="Signal Trend">
            <TrendIcon className={cn(
              "w-3.5 h-3.5",
              trend.dir === 'up' ? (evaluation.status === 'CRITICAL' ? 'text-red-400' : style.accentText) :
              trend.dir === 'down' ? 'text-slate-400' : 'text-slate-500'
            )} />
          </div>
        </div>

        {/* Normal Operating Range Tag */}
        {metadata.nominalRange && (
          <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
            Nominal: {metadata.nominalRange[0]} - {metadata.nominalRange[1]} {metadata.unit}
          </div>
        )}
      </div>

      {/* Bottom Sparkline & Reliability Quality Score */}
      <div className="mt-3 pt-2 border-t border-border flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[9px] font-mono text-muted-foreground uppercase">Reliability</span>
          <span className={cn(
            'text-xs font-mono font-bold tabular-nums',
            reliabilityScore >= 85 ? 'text-emerald-400' :
            reliabilityScore >= 50 ? 'text-amber-400' : 'text-red-400'
          )}>
            {reliabilityScore}%
          </span>
        </div>

        {/* SVG Sparkline */}
        {sparklinePath ? (
          <svg className="w-20 h-6 overflow-visible" viewBox="0 0 100 24">
            <path
              d={sparklinePath}
              fill="none"
              stroke={evaluation.status === 'CRITICAL' ? '#EF4444' : (evaluation.status === 'WARNING' ? '#F59E0B' : style.sparkline)}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <div className="text-[10px] text-muted-foreground font-mono">Live Sync...</div>
        )}
      </div>

    </Card>
  );
}
