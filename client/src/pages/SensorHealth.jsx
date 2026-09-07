import React, { useState } from 'react';
import SensorHealthGrid from '../components/sensor-health/SensorHealthGrid.jsx';
import ReliabilityHistoryPanel from '../components/sensor-health/ReliabilityHistoryPanel.jsx';
import { Card } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.jsx';
import { HeartPulse, Filter } from 'lucide-react';

const DEFAULT_FALLBACK_SCORES = {
  drive_vibration: { sensorType: 'drive_vibration', reliabilityScore: 94, status: 'HEALTHY', weightForML: 1.0, metrics: { uptimeScore: 100, stuckScore: 100, rangeScore: 100, jitterScore: 88 }, actionRequired: 'Signal cross-validated. Operating nominally.' },
  belt_speed: { sensorType: 'belt_speed', reliabilityScore: 98, status: 'HEALTHY', weightForML: 1.0, metrics: { uptimeScore: 100, stuckScore: 100, rangeScore: 100, jitterScore: 96 }, actionRequired: 'Encoder pulses clean and calibrated.' },
  dynamic_load: { sensorType: 'dynamic_load', reliabilityScore: 91, status: 'HEALTHY', weightForML: 1.0, metrics: { uptimeScore: 100, stuckScore: 100, rangeScore: 100, jitterScore: 78 }, actionRequired: 'Load cell strain gauges verified within tolerance.' },
  joint_temperature: { sensorType: 'joint_temperature', reliabilityScore: 89, status: 'HEALTHY', weightForML: 1.0, metrics: { uptimeScore: 100, stuckScore: 100, rangeScore: 100, jitterScore: 82 }, actionRequired: 'Infrared pyrometer calibrated (45°C nominal).' },
  ultrasonic_thickness: { sensorType: 'ultrasonic_thickness', reliabilityScore: 78, status: 'DEGRADED', weightForML: 0.78, metrics: { uptimeScore: 92, stuckScore: 100, rangeScore: 100, jitterScore: 65 }, actionRequired: 'Coupling gel degraded; ML down-weights this input.' },
  acoustic_emission: { sensorType: 'acoustic_emission', reliabilityScore: 92, status: 'HEALTHY', weightForML: 1.0, metrics: { uptimeScore: 100, stuckScore: 100, rangeScore: 100, jitterScore: 84 }, actionRequired: 'Piezoelectric transducer verified.' }
};

export default function SensorHealth({
  scores = {},
  fleetAverageScore = 92,
  healthyCount = 5,
  degradedCount = 1,
  faultyCount = 0
}) {
  const [selectedSensor, setSelectedSensor] = useState('ultrasonic_thickness');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const effectiveScores = Object.keys(scores || {}).length > 0 ? scores : DEFAULT_FALLBACK_SCORES;
  const filteredScores = {};
  Object.entries(effectiveScores).forEach(([k, v]) => {
    if (statusFilter === 'ALL' || v.status === statusFilter) {
      filteredScores[k] = v;
    }
  });

  return (
    <div className="space-y-4 animate-fade-in select-none">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-primary/10 border border-primary/30 rounded-lg text-primary shadow-xs">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              Sensor Fleet Reliability &amp; Data Quality
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              Physics Quality Index • Uptime, Drift, Range &amp; Jitter Evaluation
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px] h-8 bg-surface border-border text-xs font-mono">
              <SelectValue placeholder="Filter Sensors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Sensors (6 Channels)</SelectItem>
              <SelectItem value="HEALTHY">Healthy (≥85% Score)</SelectItem>
              <SelectItem value="DEGRADED">Degraded (50-84% Score)</SelectItem>
              <SelectItem value="FAULTY">Faulty (&lt;50% Score)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fleet Summary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        <Card className="p-3.5 bg-surface border-border shadow-xs transition-colors">
          <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Fleet Average Quality</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-primary mt-1 tabular-nums">
            {fleetAverageScore}%
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">● Nominal Telemetry Integrity</span>
        </Card>

        <Card className="p-3.5 bg-surface border-border shadow-xs transition-colors">
          <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Healthy Transducers</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {healthyCount} / 6
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">1.0x Full Weight in ML</span>
        </Card>

        <Card className="p-3.5 bg-surface border-border shadow-xs transition-colors">
          <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Degraded Channels</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {degradedCount}
          </div>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-medium">▲ Down-weighted (0.78x)</span>
        </Card>

        <Card className="p-3.5 bg-surface border-border shadow-xs transition-colors">
          <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Faulty (Excluded)</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-foreground mt-1 tabular-nums">
            {faultyCount}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">● Zero Signal Corruption</span>
        </Card>

      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        
        {/* Left: 6 Sensors Health Matrix (2 Cols) */}
        <div className="lg:col-span-2">
          <SensorHealthGrid
            scores={filteredScores}
            selectedSensor={selectedSensor}
            onSelectSensor={setSelectedSensor}
          />
        </div>

        {/* Right: Selected Sensor Reliability Breakdown & Degradation Trend (1 Col) */}
        <div className="lg:col-span-1">
          <ReliabilityHistoryPanel
            selectedSensor={selectedSensor}
            scoreData={effectiveScores[selectedSensor]}
            scores={effectiveScores}
          />
        </div>

      </div>

    </div>
  );
}
