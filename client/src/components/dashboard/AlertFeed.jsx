import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatusBadge from '../shared/StatusBadge.jsx';
import { acknowledgeAlertDoc } from '../../firebase/firestore.js';
import {
  BellRing,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import clsx from 'clsx';

export default function AlertFeed({
  alerts = [],
  facilityId = 'nmdc-kirandul-cv101',
  currentUser,
  onInvestigateJoint
}) {
  const navigate = useNavigate();

  const handleAcknowledge = async (e, alertId) => {
    e.stopPropagation();
    try {
      await acknowledgeAlertDoc(facilityId, alertId, currentUser);
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
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
  const unacknowledgedAlerts = alerts.filter(
    alert => alert.status !== 'ACKNOWLEDGED' && !alert.acknowledged
  );
  const activeAlerts = unacknowledgedAlerts.slice(0, 5);

  return (
    <div className="bg-[#111726] border border-[#1f293d] rounded-2xl p-5 flex flex-col justify-between h-full shadow-xl">

      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-950/80 border border-red-500/40 rounded-lg text-red-400">
              <BellRing className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live Alert Stream</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {unacknowledgedAlerts.length} Unacknowledged Active Incident{unacknowledgedAlerts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <Link
            to="/alerts"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
          >
            View All ({alerts.length})
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Alert Items List */}
        <div className="space-y-2.5">
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="font-semibold text-slate-300">All Live Alerts Acknowledged</div>
              <div className="text-[11px] text-slate-500 font-mono">Conveyor line operating under normal supervision.</div>
            </div>
          ) : (
            activeAlerts.map(alert => {
              const isCritical = alert.severity === 'CRITICAL';
              const isWarning = alert.severity === 'WARNING';

              return (
                <div
                  key={alert.id}
                  onClick={() => handleInvestigate(alert)}
                  className={clsx(
                    'p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.01]',
                    isCritical
                      ? 'bg-red-950/30 border-red-500/40 hover:border-red-400 shadow-md shadow-red-950/20'
                      : isWarning
                        ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400'
                        : 'bg-[#0a0d14]/70 border-[#1f293d] hover:border-slate-600'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {isCritical ? (
                          <AlertOctagon className="w-4 h-4 text-red-500 animate-bounce" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Info className="w-4 h-4 text-cyan-400" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white tracking-tight">
                            {alert.title || alert.type?.replace(/_/g, ' ')}
                          </span>
                          <StatusBadge status={alert.severity} size="xs" />
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                          {alert.message || alert.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                          <span className="text-cyan-400 font-semibold">{alert.jointId || 'Line CV-101'}</span>
                          <span>•</span>
                          <span>{alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'Just now'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleAcknowledge(e, alert.id)}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-700 hover:border-emerald-500 rounded-lg transition-all shrink-0 flex items-center gap-1"
                      title="Acknowledge and dismiss from live feed"
                    >
                      <CheckCircle className="w-3 h-3 text-emerald-400 group-hover:text-white" />
                      Ack
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Quick Link */}
      <div className="pt-3 border-t border-[#1f293d] mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Active Alarms: {unacknowledgedAlerts.length}</span>
        <Link to="/alerts" className="text-cyan-400 hover:underline flex items-center gap-1">
          Historical Incident Logs <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

    </div>
  );
}
