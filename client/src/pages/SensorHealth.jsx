import React, { useState } from 'react';
import SensorHealthGrid from '../components/sensor-health/SensorHealthGrid.jsx';
import ReliabilityHistoryPanel from '../components/sensor-health/ReliabilityHistoryPanel.jsx';
import { HeartPulse, ShieldCheck, Filter, Cpu } from 'lucide-react';

export default function SensorHealth({
  scores = {},
  fleetAverageScore = 92,
  healthyCount = 5,
  degradedCount = 1,
  faultyCount = 0
}) {
  const [selectedSensor, setSelectedSensor] = useState('ultrasonic_thickness');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredScores = {};
  Object.entries(scores).forEach(([k, v]) => {
    if (statusFilter === 'ALL' || v.status === statusFilter) {
      filteredScores[k] = v;
    }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-slate-950 shadow-md">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Sensor Fleet Reliability &amp; Data Quality
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              SIH PS 26008 Physics Quality Index • Uptime, Stuck, Range &amp; Jitter Evaluation
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#111726] border border-[#1f293d] rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Sensors (6 Channels)</option>
            <option value="HEALTHY">Healthy (≥85% Score)</option>
            <option value="DEGRADED">Degraded (50-84% Score)</option>
            <option value="FAULTY">Faulty (&lt;50% Score)</option>
          </select>
        </div>
      </div>

      {/* Fleet Summary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-[#111726] border border-[#1f293d]">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Fleet Average Quality</span>
          <div className="text-2xl font-extrabold font-mono text-cyan-400 mt-1">
            {fleetAverageScore}%
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Nominal Telemetry Integrity</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#111726] border border-[#1f293d]">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Healthy Transducers</span>
          <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
            {healthyCount} / 6
          </div>
          <span className="text-[10px] text-slate-400 font-mono">1.0x Full Weighting in ML</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#111726] border border-[#1f293d]">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Degraded Channels</span>
          <div className="text-2xl font-extrabold font-mono text-amber-400 mt-1">
            {degradedCount}
          </div>
          <span className="text-[10px] text-amber-400 font-mono">Ultrasonic Coupler (0.78x Weight)</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#111726] border border-[#1f293d]">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Faulty (Excluded)</span>
          <div className="text-2xl font-extrabold font-mono text-slate-300 mt-1">
            {faultyCount}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Zero Signal Corruption</span>
        </div>

      </div>

      {/* Grid of All 6 Sensor Reliability Cards */}
      <SensorHealthGrid
        scores={filteredScores}
        selectedSensor={selectedSensor}
        onSelectSensor={(sensor) => setSelectedSensor(sensor)}
      />

      {/* History and Mathematical Formula Explainer */}
      <ReliabilityHistoryPanel
        selectedSensor={selectedSensor}
        scores={scores}
      />

    </div>
  );
}
