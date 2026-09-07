import React, { useState, useEffect } from 'react';
import { Activity, Radio, AlertTriangle, Cpu, Clock } from 'lucide-react';
import { Badge } from '../ui/badge.jsx';
import { cn } from '../../lib/utils.js';

export default function TopSystemStatusStrip({
  facilityId = 'nmdc-kirandul-cv101',
  deviceId = 'CB_001',
  sensorCount = 6,
  activeAlertCount = 0,
  criticalAlertCount = 0,
  isOnline = true,
  lastSyncSecondsAgo = 1,
  activeJointId = 'Joint-05',
  beltSpeed = 4.15
}) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-surface border border-border shadow-xs rounded-lg px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-y-2.5 gap-x-6 text-xs font-mono select-none transition-colors">
      
      {/* Left: Device & System Online Beacon */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              isOnline ? "bg-emerald-400" : "bg-red-400"
            )} />
            <span className={cn(
              "relative inline-flex rounded-full h-2.5 w-2.5",
              isOnline ? "bg-emerald-500" : "bg-red-500"
            )} />
          </span>
          <span className={cn(
            "font-bold tracking-wider uppercase text-[11px]",
            isOnline ? "text-emerald-400" : "text-red-400"
          )}>
            {isOnline ? 'SYSTEM ONLINE' : 'DISCONNECTED'}
          </span>
        </div>

        <span className="text-border/80">|</span>

        {/* Device Identifier */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-foreground uppercase text-[11px] tracking-wide">
            {deviceId} • {facilityId.replace('nmdc-', '').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Center: Live Sensors & Splice Joint Tracking */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[11px]">
        
        {/* Live Sensors */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>SENSORS:</span>
          <span className="font-bold text-foreground tabular-nums">{sensorCount}/6 LIVE (ESP32)</span>
        </div>

        <span className="text-border/80 hidden sm:inline">|</span>

        {/* Active Splice Passing */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span>SPLICE TRACKING:</span>
          <span className="font-bold text-cyan-300 tabular-nums">{activeJointId}</span>
          <span className="text-muted-foreground">({beltSpeed} m/s)</span>
        </div>

        <span className="text-border/80">|</span>

        {/* Active Alerts */}
        <div className="flex items-center gap-2">
          <AlertTriangle className={cn(
            "w-3.5 h-3.5",
            criticalAlertCount > 0 ? "text-red-400 animate-pulse" : (activeAlertCount > 0 ? "text-amber-400" : "text-emerald-400")
          )} />
          <span className="text-muted-foreground">ALERTS:</span>
          {criticalAlertCount > 0 ? (
            <Badge variant="critical" size="sm" className="font-mono text-[10px] px-2 py-0.5">
              {criticalAlertCount} CRITICAL
            </Badge>
          ) : activeAlertCount > 0 ? (
            <Badge variant="warning" size="sm" className="font-mono text-[10px] px-2 py-0.5">
              {activeAlertCount} ACTIVE
            </Badge>
          ) : (
            <Badge variant="nominal" size="sm" className="font-mono text-[10px] px-2 py-0.5">
              0 NOMINAL
            </Badge>
          )}
        </div>
      </div>

      {/* Right: Clock & Sync */}
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="tabular-nums font-semibold text-foreground">{timeStr}</span>
        </div>
        <span className="text-border/80">|</span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="tabular-nums font-medium">SYNC {lastSyncSecondsAgo}s</span>
        </div>
      </div>

    </div>
  );
}
