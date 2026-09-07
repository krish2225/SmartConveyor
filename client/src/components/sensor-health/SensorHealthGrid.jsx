import React from 'react';
import { SENSOR_METADATA } from '../../../../shared/constants.js';
import StatusBadge from '../shared/StatusBadge.jsx';
import { getReliabilityStatusColor } from '../../utils/colorMapping.js';
import { Card } from '../ui/card.jsx';
import { Badge } from '../ui/badge.jsx';
import { Progress } from '../ui/progress.jsx';
import {
  Activity,
  Gauge,
  Weight,
  Thermometer,
  Layers,
  Radio
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {sensorEntries.map(([sensorType, item]) => {
        const meta = SENSOR_METADATA[sensorType] || { name: sensorType, unit: '' };
        const Icon = ICONS[sensorType] || Activity;
        const colorTheme = getReliabilityStatusColor(item.status);
        const isSelected = selectedSensor === sensorType;
        const metrics = item.metrics || {};

        return (
          <Card
            key={sensorType}
            onClick={() => onSelectSensor && onSelectSensor(sensorType)}
            className={cn(
              'p-4 transition-all cursor-pointer bg-surface border shadow-xs select-none flex flex-col justify-between rounded-lg',
              isSelected
                ? 'border-primary ring-1 ring-primary bg-primary/5'
                : 'border-border hover:border-primary/40'
            )}
          >
            <div>
              {/* Header: Icon, Name & Status */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20 text-primary shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-foreground leading-tight truncate">
                      {meta.name}
                    </h4>
                    <span className="text-[10px] font-mono text-muted-foreground truncate">
                      ID: {sensorType}
                    </span>
                  </div>
                </div>

                <StatusBadge status={item.status} size="xs" />
              </div>

              {/* Composite Score & Weight */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-sunken/70 border border-border/80 mb-3">
                <div>
                  <div className="text-[10px] font-mono text-muted-foreground uppercase">
                    Reliability Index
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className={cn('text-xl font-black font-mono tabular-nums', colorTheme.text)}>
                      {item.reliabilityScore}%
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      (Weight: {item.weightForML?.toFixed(2) || '1.00'})
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase">
                    ML Weighting
                  </div>
                  <Badge variant={item.reliabilityScore >= 85 ? 'nominal' : (item.reliabilityScore >= 50 ? 'warning' : 'critical')} size="sm" className="mt-0.5 font-mono text-[9px] px-1.5 py-0">
                    {item.reliabilityScore >= 85 ? '1.0x Full' : item.reliabilityScore >= 50 ? 'Down-weighted' : 'EXCLUDED'}
                  </Badge>
                </div>
              </div>

              {/* 4-Factor Mathematical Formula Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="text-[10px] font-mono uppercase text-muted-foreground font-bold tracking-wider">
                  Formula Factor Contribution
                </div>

                {/* Uptime (35%) */}
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-muted-foreground">1. Uptime Score (35% w):</span>
                  <span className="font-semibold text-foreground tabular-nums">{metrics.uptimeScore || 100}%</span>
                </div>

                {/* Stuck (30%) */}
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-muted-foreground">2. Stuck-at-Fault (30% w):</span>
                  <span className="font-semibold text-foreground tabular-nums">{metrics.stuckScore || 100}%</span>
                </div>

                {/* Range (25%) */}
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-muted-foreground">3. Physical Range (25% w):</span>
                  <span className="font-semibold text-foreground tabular-nums">{metrics.rangeScore || 100}%</span>
                </div>

                {/* Jitter (10%) */}
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-muted-foreground">4. Noise / Jitter (10% w):</span>
                  <span className="font-semibold text-foreground tabular-nums">{metrics.jitterScore || 90}%</span>
                </div>
              </div>
            </div>

            {/* Diagnostic Action Footer */}
            <div className="mt-3 pt-2.5 border-t border-border/80 text-[11px] text-muted-foreground font-mono">
              <p className="line-clamp-2 leading-tight">
                {item.actionRequired || 'Operating nominally.'}
              </p>
            </div>

          </Card>
        );
      })}
    </div>
  );
}
