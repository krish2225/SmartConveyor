import React from 'react';
import StatusBadge from '../shared/StatusBadge.jsx';
import { Film, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';
import clsx from 'clsx';

export default function RecentScansStrip({ scans = [], activeScanId, onSelectScan }) {
  return (
    <div className="bg-[#111726] border border-[#1f293d] rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Recent Line-Scan Captures (Rotary Encoder Synchronized)
          </h4>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Showing last {scans.length} events
        </span>
      </div>

      {/* Horizontal Strip Carousel */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
        {scans.map((scan) => {
          const isSelected = scan.incidentId === activeScanId || scan.frameId === activeScanId;
          const isCritical = scan.severity === 'CRITICAL';
          const isWarning = scan.severity === 'WARNING';

          return (
            <div
              key={scan.incidentId || scan.frameId}
              onClick={() => onSelectScan(scan)}
              className={clsx(
                'flex-shrink-0 w-56 p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.02]',
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/20'
                  : 'bg-[#0a0d14] border-[#1f293d] hover:border-slate-600'
              )}
            >
              {/* Mini Thumbnail */}
              <div className="relative w-full h-20 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center mb-2">
                <div className="absolute inset-0 bg-grid-pattern opacity-40" />
                
                {scan.isDefect ? (
                  <div className="relative flex flex-col items-center gap-1 z-10">
                    {isCritical ? (
                      <AlertOctagon className="w-6 h-6 text-red-500 animate-pulse" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-amber-500" />
                    )}
                    <span className="text-[9px] font-mono font-bold text-red-300">
                      DEFECT DETECTED
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-emerald-400 z-10">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-[9px] font-mono">NOMINAL</span>
                  </div>
                )}

                <div className="absolute bottom-1 right-1 px-1 bg-black/80 rounded text-[9px] font-mono text-slate-300">
                  {scan.beltDistanceMeters}m
                </div>
              </div>

              {/* Title & Badge */}
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className="text-xs font-bold text-slate-200 truncate font-mono">
                  {scan.frameId}
                </span>
                <StatusBadge status={scan.severity || 'NOMINAL'} size="xs" />
              </div>

              <div className="text-[10px] text-slate-400 truncate">
                {scan.classification}
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-400">
                <span>{new Date(scan.firstDetected || Date.now()).toLocaleTimeString()}</span>
                <span className="text-cyan-400">Conf: {Math.round((scan.confidence || 0.95) * 100)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
