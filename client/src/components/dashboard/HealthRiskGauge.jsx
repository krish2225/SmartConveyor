import React from 'react';
import { ShieldAlert, ShieldCheck, Clock, AlertTriangle, Cpu } from 'lucide-react';
import clsx from 'clsx';

export default function HealthRiskGauge({
  riskScore = 84.6,
  estimatedTimeToFailureDays = 6.0,
  criticalCount = 1,
  warningCount = 1,
  healthyCount = 4,
  activeJointId = 'Joint-05'
}) {
  // SVG circular progress math
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, riskScore)) / 100) * circumference;

  const getRiskTheme = (score) => {
    if (score >= 70) {
      return {
        color: '#ef4444',
        glow: 'glow-border-red',
        textColor: 'text-red-400',
        bgPill: 'bg-red-950/80 border-red-500/50 text-red-300',
        title: 'CRITICAL RUPTURE RISK',
        desc: 'Immediate vulcanization splice maintenance mandated on Joint-05.'
      };
    }
    if (score >= 35) {
      return {
        color: '#f59e0b',
        glow: 'glow-border-amber',
        textColor: 'text-amber-400',
        bgPill: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
        title: 'ELEVATED JOINT WEAR',
        desc: 'Splice thinning detected. Plan maintenance in next scheduled overhaul.'
      };
    }
    return {
      color: '#10b981',
      glow: 'glow-border-cyan',
      textColor: 'text-emerald-400',
      bgPill: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300',
      title: 'OPTIMAL JOINT INTEGRITY',
      desc: 'All 6 vulcanized splices within normal operational parameters.'
    };
  };

  const theme = getRiskTheme(riskScore);

  return (
    <div className={clsx(
      'bg-[#111726] border border-[#1f293d] rounded-2xl p-6 relative overflow-hidden transition-all',
      theme.glow
    )}>
      {/* Background radial gradient accent */}
      <div
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: theme.color }}
      />

      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">

        {/* Left: Gauge Circle */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-48 h-48 transform -rotate-90">
            {/* Background track */}
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke="#1e293b"
              strokeWidth="12"
              fill="transparent"
            />
            {/* Dynamic progress track */}
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke={theme.color}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center text in circle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
              {riskScore}%
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Rupture Risk
            </span>
            <span className={clsx('text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full border', theme.bgPill)}>
              {riskScore >= 70 ? 'CRITICAL' : (riskScore >= 35 ? 'WARNING' : 'HEALTHY')}
            </span>
          </div>
        </div>

        {/* Center: Risk Summary & ETTF Metrics */}
        <div className="flex-1 space-y-4 text-center lg:text-left">
          <div>
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <span className={clsx('text-xs font-mono font-bold uppercase tracking-wider', theme.textColor)}>
                ● ML Predictive Intelligence
              </span>
              <span className="text-xs text-slate-500 font-mono">|</span>

            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              {theme.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              {theme.desc}
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

            {/* ETTF Card */}
            <div className="bg-[#0a0d14]/80 border border-[#1f293d] rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Est. Time to Failure</span>
              </div>
              <div className="text-lg font-bold font-mono text-white mt-1">
                {estimatedTimeToFailureDays} <span className="text-xs text-slate-400 font-normal">days</span>
              </div>
              <div className="text-[10px] text-red-400 font-mono mt-0.5">
                (Joint-05 Splice Core)
              </div>
            </div>

            {/* Joint Degradation Count */}
            <div className="bg-[#0a0d14]/80 border border-[#1f293d] rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Degraded Joints</span>
              </div>
              <div className="text-lg font-bold font-mono text-white mt-1">
                <span className="text-red-400">{criticalCount}</span>
                <span className="text-slate-500 text-sm mx-1">/</span>
                <span className="text-amber-400">{warningCount}</span>
                <span className="text-slate-500 text-sm mx-1">/</span>
                <span className="text-emerald-400">{healthyCount}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Crit / Warn / Optimal
              </div>
            </div>

            {/* Active Joint Passing */}
            <div className="bg-[#0a0d14]/80 border border-[#1f293d] rounded-xl p-3 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tracking Station</span>
              </div>
              <div className="text-sm font-bold font-mono text-cyan-300 mt-1 truncate">
                {activeJointId}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                ● In-Transit (4.2 m/s)
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
