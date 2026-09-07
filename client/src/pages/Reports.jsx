import React from 'react';
import ReportsTable from '../components/reports/ReportsTable.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { FileSpreadsheet } from 'lucide-react';

export default function Reports({
  facilityId = 'nmdc-kirandul-cv101',
  joints = [],
  overallRiskScore = 84.6
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-primary/20 border border-primary/40 rounded text-primary shadow-sm">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              Maintenance Audit &amp; Compliance Reports
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              NMDC Mining Operations • Predictive RUL Logs &amp; Exportable Compliance Records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="nominal" size="default" className="font-mono text-xs">
            ✓ ISO 10816 Certified
          </Badge>
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
