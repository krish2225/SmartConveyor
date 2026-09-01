import React from 'react';
import { SENSOR_METADATA } from '../../../../shared/constants.js';
import StatusBadge from '../shared/StatusBadge.jsx';
import { getReliabilityStatusColor } from '../../utils/colorMapping.js';
import {
  Activity,
  Gauge,
  Weight,
  Thermometer,
  Layers,
  Radio,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle
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

export default function SensorHealthGrid({ scores = {}, selectedSensor, onSelectSensor }) {
  const sensorEntries = Object.entries(scores);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sensorEntries.map(([sensorType, item]) => {
        const meta = SENSOR_METADATA[sensorType] || { name: sensorType, unit: '' };
        const Icon = ICONS[sensorType] || Activity;
        const colorTheme = getReliabilityStatusColor(item.status);
        const isSelected = selectedSensor === sensorType;
        const metrics = item.metrics || {};

        return (
          <div
            key={sensorType}
            onClick={() => onSelectSensor && onSelectSensor(sensorType)}
            className={clsx(
              'rounded-2xl border p-5 transition-all cursor-pointer bg-[#111726]',
              isSelected
                ? 'border-cyan-400 shadow-lg shadow-cyan-500/20 bg-cyan-950/20'
                : 'border-[#1f293d] hover:border-slate-600'
            )}
          >
            {/* Header: Icon, Name & Status */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">
                    {meta.name}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    ID: {sensorType}
                  </span>
                </div>
              </div>

              <StatusBadge status={item.status} size="xs" />
            </div>

            {/* Composite Score Circle & Weight */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0a0d14] border border-[#1f293d] mb-4">
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase">
                  Reliability Score
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className={clsx('text-2xl font-extrabold font-mono', colorTheme.text)}>
                    {item.reliabilityScore}%
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    (Weight: {item.weightForML?.toFixed(2) || '1.00'})
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400 uppercase">
                  ML Action
                </div>
                <div className="text-xs font-bold font-mono text-cyan-300 mt-0.5">
                  {item.reliabilityScore >= 85 ? 'Full 1.0x Weight' : item.reliabilityScore >= 50 ? 'Down-weighted' : 'EXCLUDED'}
                </div>
              </div>
            </div>

            {/* 4-Factor Mathematical Formula Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
                SIH Formula Factor Contribution
              </div>

              {/* Uptime (35%) */}
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-400">1. Uptime Score (35% w):</span>
                <span className="font-semibold text-slate-200">{metrics.uptimeScore || 100}%</span>
              </div>

              {/* Stuck (30%) */}
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-400">2. Stuck-at-Fault (30% w):</span>
                <span className="font-semibold text-slate-200">{metrics.stuckScore || 100}%</span>
              </div>

              {/* Range (25%) */}
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-400">3. Physical Range (25% w):</span>
                <span className="font-semibold text-slate-200">{metrics.rangeScore || 100}%</span>
              </div>

              {/* Jitter (10%) */}
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-400">4. Noise / Jitter (10% w):</span>
                <span className="font-semibold text-slate-200">{metrics.jitterScore || 90}%</span>
              </div>
            </div>

            {/* Diagnostic Action Footer */}
            <div className="mt-4 pt-3 border-t border-[#1f293d] text-[11px] text-slate-300">
              <p className="line-clamp-2 leading-relaxed">
                {item.actionRequired || 'Operating nominally.'}
              </p>
            </div>

          </div>
        );
      })}
    </div>
  );
}
