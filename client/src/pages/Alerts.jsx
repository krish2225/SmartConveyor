import React from 'react';
import AlertsTable from '../components/alerts/AlertsTable.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { BellRing } from 'lucide-react';

export default function Alerts({
  facilityId = 'nmdc-kirandul-cv101',
  alerts = [],
  currentUser,
  onAcknowledgeAlert
}) {
  const activeCount = alerts.filter(a => a.status === 'ACTIVE').length;
  const acknowledgedCount = alerts.filter(a => a.status === 'ACKNOWLEDGED').length;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;

  return (
    <div className="space-y-4 animate-fade-in select-none">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-primary/10 border border-primary/30 rounded-lg text-primary shadow-xs">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              Real-Time Alarm &amp; Incident Console
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              Live Firestore Trigger Feed • Anomaly Verification &amp; Operator Acknowledgements
            </p>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <Badge variant="critical" size="default" className="font-mono text-xs">
              ● {criticalCount} CRITICAL UNRESOLVED
            </Badge>
          )}
          <Badge variant="secondary" size="default" className="font-mono text-xs">
            {activeCount} Active / {alerts.length} Total
          </Badge>
        </div>
      </div>

      {/* Main Alerts Table Component */}
      <AlertsTable
        alerts={alerts}
        facilityId={facilityId}
        currentUser={currentUser}
        onAcknowledgeAlert={onAcknowledgeAlert}
      />

    </div>
  );
}
