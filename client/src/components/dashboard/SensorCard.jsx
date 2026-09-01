import React from 'react';
import { SENSOR_METADATA } from '../../../../shared/constants.js';
import { evaluateSensorStatus, formatSensorValue } from '../../utils/thresholds.js';
import {
  Activity,
  Gauge,
  Weight,
  Thermometer,
  Layers,
  Radio
} from 'lucide-react';
import clsx from 'clsx';

const ICONS = {
  drive_vibration: Activity,
  belt_speed: Gauge,
  dynamic_load: Weight,
  joint_temperature: Thermometer,
  ultrasonic_thickness: Layers,
  acoustic_emission: Radio
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

  const Icon = ICONS[sensorType] || Activity;
  const evaluation = evaluateSensorStatus(sensorType, currentValue);
  const formattedVal = formatSensorValue(sensorType, currentValue);

  // Build SVG Sparkline path
  const sparklineValues = history.map(h => (typeof h === 'object' ? h[sensorType] : h)).filter(v => v !== undefined && !isNaN(v));
  let sparklinePath = '';

  if (sparklineValues.length >= 2) {
    const minVal = Math.min(...sparklineValues);
    const maxVal = Math.max(...sparklineValues);
    const range = (maxVal - minVal) || 1;
    const width = 120;
    const height = 32;

    const points = sparklineValues.map((val, idx) => {
      const x = (idx / (sparklineValues.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    sparklinePath = `M ${points.join(' L ')}`;
  }

  const getBorderColor = () => {
    if (evaluation.status === 'CRITICAL') return 'border-red-500/50 bg-red-950/10 glow-border-red';
    if (evaluation.status === 'WARNING') return 'border-amber-500/50 bg-amber-950/10 glow-border-amber';
    return 'border-[#1f293d] bg-[#111726] hover:border-cyan-500/40';
  };

  return (
    <div className={clsx('rounded-xl p-4 border transition-all relative overflow-hidden flex flex-col justify-between', getBorderColor())}>
      
      {/* Top row: Name, Icon & Status Pill */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-cyan-400">
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-300 truncate max-w-[130px]" title={metadata.name}>
              {metadata.name}
            </span>
          </div>

          <span className={clsx(
            'text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase shrink-0',
            evaluation.status === 'CRITICAL' ? 'bg-red-950 text-red-400 border-red-500/50' :
            evaluation.status === 'WARNING' ? 'bg-amber-950 text-amber-400 border-amber-500/50' :
            'bg-emerald-950 text-emerald-400 border-emerald-500/50'
          )}>
            {evaluation.status}
          </span>
        </div>

        {/* Middle Value Display */}
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-extrabold font-mono tracking-tight text-white">
            {formattedVal}
          </span>
          <span className="text-xs font-mono font-medium text-slate-400">
            {metadata.unit}
          </span>
        </div>
      </div>

      {/* Bottom Sparkline & Data Quality */}
      <div className="mt-4 pt-3 border-t border-[#1f293d]/80 flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-slate-400">Reliability</span>
          <span className={clsx(
            'text-xs font-mono font-bold',
            reliabilityScore >= 85 ? 'text-emerald-400' :
            reliabilityScore >= 50 ? 'text-amber-400' : 'text-red-400'
          )}>
            {reliabilityScore}%
          </span>
        </div>

        {/* SVG Sparkline */}
        {sparklinePath ? (
          <svg className="w-24 h-8 overflow-visible" viewBox="0 0 120 32">
            <path
              d={sparklinePath}
              fill="none"
              stroke={evaluation.status === 'CRITICAL' ? '#ef4444' : evaluation.status === 'WARNING' ? '#f59e0b' : '#00e5ff'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <div className="text-[10px] text-slate-400 font-mono">Sampling...</div>
        )}
      </div>

    </div>
  );
}
