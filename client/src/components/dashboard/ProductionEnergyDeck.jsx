import React from 'react';
import { Card } from '../ui/card.jsx';
import { Badge } from '../ui/badge.jsx';
import { Progress } from '../ui/progress.jsx';
import {
  TrendingUp,
  Zap,
  Leaf,
  Layers,
  Gauge,
  Cpu,
  BarChart3,
  CheckCircle2
} from 'lucide-react';

export default function ProductionEnergyDeck({
  beltSpeed = 4.15,
  dynamicLoad = 1636
}) {
  const oeeAvailability = 98.2;
  const oeePerformance = 94.6;
  const oeeQuality = 99.4;
  const compositeOEE = Math.round((oeeAvailability * oeePerformance * oeeQuality) / 10000);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 select-none">
      
      {/* 1. Shift Ore Production Tonnage */}
      <Card className="p-3.5 bg-surface border-border shadow-xs flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground">Ore Throughput</span>
              <div className="text-[10px] text-muted-foreground font-mono">Shift Total #1</div>
            </div>
          </div>
          <Badge variant="warning" size="sm" className="font-mono text-[9px]">
            1,636 T/H
          </Badge>
        </div>

        <div className="mt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-foreground tabular-nums">38,420</span>
            <span className="text-xs font-mono text-muted-foreground">/ 42,000 T</span>
          </div>
          <Progress value={91.4} className="h-1.5 mt-2" indicatorClassName="bg-amber-500" />
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-1">
            <span>Target Progress: 91.4%</span>
            <span className="text-emerald-400 font-semibold">● On Track</span>
          </div>
        </div>
      </Card>

      {/* 2. Heavy Drive Motor Power & Torque */}
      <Card className="p-3.5 bg-surface border-border shadow-xs flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground">Drive Motor System</span>
              <div className="text-[10px] text-muted-foreground font-mono">3.3 kV Substation</div>
            </div>
          </div>
          <Badge variant="cyan" size="sm" className="font-mono text-[9px]">
            340 kW
          </Badge>
        </div>

        <div className="mt-1 space-y-1 text-xs font-mono">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Motor Current:</span>
            <span className="font-bold text-foreground tabular-nums">74.2 A (Nominal)</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Torque Utilization:</span>
            <span className="font-bold text-cyan-300 tabular-nums">68.4% Rated</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/80">
            <span>Power Index: 0.24 kWh/t</span>
            <span className="text-emerald-400 font-semibold">VFD Synced</span>
          </div>
        </div>
      </Card>

      {/* 3. Plant OEE Indicator */}
      <Card className="p-3.5 bg-surface border-border shadow-xs flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground">Plant OEE Metric</span>
              <div className="text-[10px] text-muted-foreground font-mono">World-Class SCADA</div>
            </div>
          </div>
          <Badge variant="nominal" size="sm" className="font-mono text-[9px]">
            {compositeOEE}% OEE
          </Badge>
        </div>

        <div className="mt-1 space-y-1 text-[10px] font-mono">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Availability:</span>
            <span className="font-bold text-emerald-400 tabular-nums">{oeeAvailability}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Performance:</span>
            <span className="font-bold text-cyan-300 tabular-nums">{oeePerformance}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Quality Yield:</span>
            <span className="font-bold text-emerald-400 tabular-nums">{oeeQuality}%</span>
          </div>
        </div>
      </Card>

      {/* 4. Carcass Wear & Belt Tension */}
      <Card className="p-3.5 bg-surface border-border shadow-xs flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground">Carcass Structural Health</span>
              <div className="text-[10px] text-muted-foreground font-mono">ST-5400 Steel Cord</div>
            </div>
          </div>
          <Badge variant="critical" size="sm" className="font-mono text-[9px]">
            ALERT J-05
          </Badge>
        </div>

        <div className="mt-1 space-y-1 text-xs font-mono">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Average Cover:</span>
            <span className="font-bold text-foreground tabular-nums">23.8 mm (Nominal)</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Joint-05 Thinning:</span>
            <span className="font-bold text-red-400 tabular-nums">14.8 mm (Hazard)</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/80">
            <span>Wear: 0.012 mm/kH</span>
            <span className="text-amber-400 font-semibold">Overhaul Mandate</span>
          </div>
        </div>
      </Card>

    </div>
  );
}
