import React from 'react';
import { ShieldAlert, ShieldCheck, Clock, AlertTriangle, Cpu, Activity, Sparkles } from 'lucide-react';
import { Card, CardContent } from '../ui/card.jsx';
import { Badge } from '../ui/badge.jsx';
import { cn } from '../../lib/utils.js';

export default function HealthRiskGauge({
  riskScore = 84.6,
  estimatedTimeToFailureDays = 6.0,
  criticalCount = 1,
  warningCount = 1,
  healthyCount = 4,
  activeJointId = 'Joint-05'
}) {
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, riskScore)) / 100) * circumference;

  const systemHealth = Math.max(0, Math.min(100, (100 - riskScore))).toFixed(1);
  const rulHours = Math.round(estimatedTimeToFailureDays * 24);

  const getRiskTheme = (score) => {
    if (score >= 70) {
      return {
        color: '#EF4444',
        statusVariant: 'critical',
        badgeLabel: 'CRITICAL RUPTURE HAZARD',
        title: 'CRITICAL SPLICE RUPTURE HAZARD',
        desc: 'Immediate vulcanization splice maintenance mandated on Joint-05 before line resumption.',
        borderStyle: 'border-red-500/40 shadow-red-500/5'
      };
    }
    if (score >= 35) {
      return {
        color: '#F59E0B',
        statusVariant: 'warning',
        badgeLabel: 'ELEVATED WEAR',
        title: 'ELEVATED JOINT WEAR DETECTED',
        desc: 'Splice thinning & moderate vibration detected. Schedule overhaul in next maintenance window.',
        borderStyle: 'border-amber-500/40 shadow-amber-500/5'
      };
    }
    return {
      color: '#16A34A',
      statusVariant: 'nominal',
      badgeLabel: 'OPTIMAL INTEGRITY',
      title: 'OPTIMAL CONVEYOR INTEGRITY',
      desc: 'All 6 vulcanized splices circulating within normal design operational parameters.',
      borderStyle: 'border-emerald-500/30 shadow-emerald-500/5'
    };
  };

  const theme = getRiskTheme(riskScore);

  return (
    <Card className={cn("p-4 sm:p-5 relative overflow-hidden transition-all bg-surface border shadow-xs", theme.borderStyle)}>
      
      {/* Background radial accent */}
      <div
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ backgroundColor: theme.color }}
      />

      <div className="flex flex-col md:flex-row items-center justify-between gap-5 lg:gap-7">

        {/* Left: Gauge Circle */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-40 h-40 transform -rotate-90">
            {/* Background track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="9"
              fill="transparent"
            />
            {/* Dynamic progress track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke={theme.color}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center text in circle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground tabular-nums">
              {riskScore}%
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Rupture Risk
            </span>
            <Badge variant={theme.statusVariant} size="sm" className="mt-1 font-mono text-[9px] px-1.5 py-0">
              {riskScore >= 70 ? 'CRITICAL' : (riskScore >= 35 ? 'WARNING' : 'HEALTHY')}
            </Badge>
          </div>
        </div>

        {/* Center: Risk Summary & KPIs */}
        <div className="flex-1 space-y-3 text-center md:text-left min-w-0">
          <div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <Badge variant="cyan" size="sm" className="font-mono text-[10px] py-0.5">
                ● ML Predictive Intelligence
              </Badge>
              <span className="text-xs text-border font-mono hidden sm:inline">|</span>
              <span className="text-xs font-mono text-muted-foreground">
                Fleet Status: <strong className="text-foreground font-bold">{systemHealth}% System Health</strong>
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-foreground mt-1 tracking-tight">
              {theme.title}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
              {theme.desc}
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">

            {/* RUL Card */}
            <div className="bg-surface-sunken/70 border border-border/80 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-mono">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Est. RUL</span>
              </div>
              <div className="text-base sm:text-lg font-bold font-mono text-foreground mt-0.5 tabular-nums">
                {rulHours} <span className="text-[11px] text-muted-foreground font-normal">hours</span>
                <span className="text-xs text-muted-foreground ml-1 font-mono">({estimatedTimeToFailureDays}d)</span>
              </div>
              <div className="text-[10px] text-red-500 font-mono mt-0.5 font-medium truncate">
                (Joint-05 Splice Core)
              </div>
            </div>

            {/* Joint Degradation Breakdown */}
            <div className="bg-surface-sunken/70 border border-border/80 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Degraded Joints</span>
              </div>
              <div className="text-base sm:text-lg font-bold font-mono text-foreground mt-0.5 tabular-nums">
                <span className="text-red-500">{criticalCount}</span>
                <span className="text-muted-foreground text-xs mx-1">/</span>
                <span className="text-amber-500">{warningCount}</span>
                <span className="text-muted-foreground text-xs mx-1">/</span>
                <span className="text-emerald-500">{healthyCount}</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                Crit / Warn / Optimal
              </div>
            </div>

            {/* Active Joint Passing */}
            <div className="bg-surface-sunken/70 border border-border/80 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-mono">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                <span>Tracking Station</span>
              </div>
              <div className="text-sm sm:text-base font-bold font-mono text-primary mt-0.5 truncate">
                {activeJointId}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 font-medium">
                ● In-Transit (4.2 m/s)
              </div>
            </div>

          </div>
        </div>

      </div>
    </Card>
  );
}
