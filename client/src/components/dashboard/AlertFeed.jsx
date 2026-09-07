import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatusBadge from '../shared/StatusBadge.jsx';
import { acknowledgeAlertDoc } from '../../firebase/firestore.js';
import { Card } from '../ui/card.jsx';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import {
  BellRing,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

export default function AlertFeed({
  alerts = [],
  facilityId = 'nmdc-kirandul-cv101',
  currentUser,
  onInvestigateJoint,
  onAcknowledgeAlert
}) {
  const navigate = useNavigate();
  const [localAcked, setLocalAcked] = React.useState(new Set());

  const handleAcknowledge = async (e, alertId) => {
    e.stopPropagation();
    if (!alertId) return;

    setLocalAcked(prev => new Set([...prev, alertId]));

    if (onAcknowledgeAlert) {
      onAcknowledgeAlert(alertId);
    } else {
      try {
        await acknowledgeAlertDoc(facilityId, alertId, currentUser);
      } catch (err) {
        console.error('Failed to acknowledge alert:', err);
      }
    }
  };

  const handleInvestigate = (alert) => {
    if (alert.jointId && alert.jointId !== 'System Wide' && alert.jointId !== 'ALL JOINTS') {
      if (onInvestigateJoint) onInvestigateJoint(alert.jointId);
      navigate('/digital-twin');
    } else if (alert.source?.includes('Vision')) {
      navigate('/vision');
    } else {
      navigate('/alerts');
    }
  };

  // Filter ONLY active, unacknowledged alerts for the live stream on the dashboard
  const unacknowledgedAlerts = alerts.filter(alert => {
    const id = alert.id || alert._id || alert.incidentId;
    if (localAcked.has(id)) return false;
    return alert.status !== 'ACKNOWLEDGED' && !alert.acknowledged;
  });
  const activeAlerts = unacknowledgedAlerts.slice(0, 5);

  return (
    <Card className="p-4 bg-surface border-border shadow-xs flex flex-col justify-between h-full transition-colors select-none">

      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-red-100 dark:bg-red-950/80 border border-red-500/40 text-red-600 dark:text-red-400">
              <BellRing className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground">Live Incident Feed</h3>
              <p className="text-[10px] text-muted-foreground font-mono">
                {unacknowledgedAlerts.length} Unacknowledged Incident{unacknowledgedAlerts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <Link
            to="/alerts"
            className="text-[11px] font-mono text-primary hover:underline flex items-center gap-0.5"
          >
            View All ({alerts.length})
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Alert Items List */}
        <div className="space-y-2">
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs space-y-2">
              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="font-semibold text-foreground text-xs">All Live Alarms Acknowledged</div>
              <div className="text-[10px] text-muted-foreground font-mono">Conveyor line CV-101 operating under nominal supervision.</div>
            </div>
          ) : (
            activeAlerts.map(alert => {
              const alertId = alert.id || alert._id || alert.incidentId;
              const isCritical = alert.severity === 'CRITICAL';
              const isWarning = alert.severity === 'WARNING';

              return (
                <div
                  key={alertId}
                  onClick={() => handleInvestigate(alert)}
                  className={cn(
                    'p-2.5 rounded-lg border transition-all cursor-pointer select-none',
                    isCritical
                      ? 'bg-red-50/80 dark:bg-red-950/20 border-border border-l-4 border-l-red-500 hover:border-red-500 shadow-xs'
                      : isWarning
                        ? 'bg-amber-50/80 dark:bg-amber-950/15 border-border border-l-4 border-l-amber-500 hover:border-amber-500 shadow-xs'
                        : 'bg-surface-sunken/70 border-border border-l-4 border-l-primary hover:border-primary shadow-xs'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {isCritical ? (
                          <AlertOctagon className="w-3.5 h-3.5 text-red-500 animate-bounce" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <Info className="w-3.5 h-3.5 text-primary" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-foreground tracking-tight truncate">
                            {alert.title || alert.type?.replace(/_/g, ' ')}
                          </span>
                          <StatusBadge status={alert.severity} size="xs" />
                        </div>
                        <p className="text-[11px] text-foreground/80 dark:text-slate-300 mt-0.5 line-clamp-1 leading-tight">
                          {alert.message || alert.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-muted-foreground">
                          <span className="text-primary font-semibold">{alert.jointId || 'Line CV-101'}</span>
                          <span>•</span>
                          <span className="tabular-nums">{alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'Just now'}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleAcknowledge(e, alertId)}
                      className="h-6 px-2.5 text-[10px] font-mono font-bold bg-surface-elevated hover:bg-emerald-600 hover:text-white border-border hover:border-emerald-500 shrink-0 gap-1 ml-2 transition-colors active:scale-95"
                      title="Acknowledge and dismiss from live stream"
                    >
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      Ack
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Quick Link */}
      <div className="pt-2.5 border-t border-border mt-3 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span>Active Alarms: <strong className="text-foreground">{unacknowledgedAlerts.length}</strong></span>
        <Link to="/alerts" className="text-primary hover:underline flex items-center gap-1">
          Historical Incidents <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

    </Card>
  );
}
