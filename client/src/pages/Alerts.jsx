import React from 'react';
import AlertsTable from '../components/alerts/AlertsTable.jsx';
import { BellRing, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function Alerts({
  facilityId = 'nmdc-kirandul-cv101',
  alerts = [],
  currentUser
}) {
  const activeCount = alerts.filter(a => a.status === 'ACTIVE').length;
  const acknowledgedCount = alerts.filter(a => a.status === 'ACKNOWLEDGED').length;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-slate-950 shadow-md">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Real-Time Alarm &amp; Incident Console
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Live Firestore Trigger Feed • Anomaly Verification &amp; Operator Acknowledgements
            </p>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="px-3 py-1 bg-red-950 text-red-300 border border-red-500/50 rounded-lg text-xs font-mono font-bold animate-pulse">
              ● {criticalCount} CRITICAL UNRESOLVED
            </span>
          )}
          <span className="px-3 py-1 bg-[#111726] text-slate-300 border border-[#1f293d] rounded-lg text-xs font-mono">
            {activeCount} Active / {alerts.length} Total
          </span>
        </div>
      </div>

      {/* Main Alerts Table Component */}
      <AlertsTable
        alerts={alerts}
        facilityId={facilityId}
        currentUser={currentUser}
      />

    </div>
  );
}
