import React from 'react';
import { AlertOctagon, ShieldAlert, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmergencyStopBanner({ emergencyStatus, currentUser }) {
  if (!emergencyStatus?.emergencyStopActive) return null;

  return (
    <div className="w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-b-2 border-red-500 text-white px-4 py-2.5 sticky top-0 z-50 shadow-2xl shadow-red-950/60 animate-pulse">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-red-600 rounded-lg text-white animate-bounce">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-bold tracking-wider text-red-100 uppercase">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
              EMERGENCY STOP ACTIVE — CONVEYOR HALTED
            </div>
            <div className="text-red-200 text-xs mt-0.5">
              Reason: <span className="font-semibold text-white">{emergencyStatus.reason || 'Critical Splice Joint Rupture Hazard'}</span> | 
              Triggered By: <span className="font-semibold text-white">{emergencyStatus.triggeredBy || 'Control Operator'}</span> ({emergencyStatus.role || 'OPERATOR'}) | 
              Time: <span className="font-mono text-red-100">{emergencyStatus.triggeredAt ? new Date(emergencyStatus.triggeredAt).toLocaleTimeString() : 'Just now'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser?.role === 'SITE_ADMIN' ? (
            <Link
              to="/settings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-red-900 hover:bg-red-100 font-bold text-xs rounded-md shadow transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-red-600" />
              Admin Safety Release
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-950/80 border border-red-500/40 rounded text-xs text-red-200">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              Admin clearance required to resume
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
