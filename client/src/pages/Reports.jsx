import React from 'react';
import ReportsTable from '../components/reports/ReportsTable.jsx';
import { FileSpreadsheet, Download, ShieldCheck } from 'lucide-react';

export default function Reports({
  facilityId = 'nmdc-kirandul-cv101',
  joints = [],
  overallRiskScore = 84.6
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-slate-950 shadow-md">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Maintenance Audit &amp; Compliance Reports
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              NMDC Mining Operations • Predictive RUL Logs &amp; Exportable Compliance Records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs font-mono text-emerald-400">
            ✓ ISO 10816 Mining Certified
          </span>
        </div>
      </div>

      {/* Reports Table Component */}
      <ReportsTable
        facilityId={facilityId}
        joints={joints}
        overallRiskScore={overallRiskScore}
      />

    </div>
  );
}
