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
  ChevronRight
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

  const activeAlerts = alerts.slice(0, 5);

  return (
    <div className="bg-[#111726] border border-[#1f293d] rounded-2xl p-5 flex flex-col justify-between h-full">
      
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-950/80 border border-red-500/40 rounded-lg text-red-400">
              <BellRing className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live Alert Stream</h3>
              <p className="text-[11px] text-slate-400 font-mono">Real-time incident feed</p>
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
            <div className="text-center py-8 text-slate-400 text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
              All plant conveyor systems operating nominally.
            </div>
          ) : (
            activeAlerts.map(alert => {
              const isCritical = alert.severity === 'CRITICAL';
              const isWarning = alert.severity === 'WARNING';
              const isAcknowledged = alert.status === 'ACKNOWLEDGED';

              return (
                <div
                  key={alert.id}
                  onClick={() => handleInvestigate(alert)}
                  className={clsx(
                    'p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.01]',
                    isCritical
                      ? 'bg-red-950/30 border-red-500/40 hover:border-red-400'
                      : isWarning
                      ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400'
                      : 'bg-[#0a0d14]/70 border-[#1f293d] hover:border-slate-600'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {isCritical ? (
                          <AlertOctagon className="w-4 h-4 text-red-500 animate-pulse" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Info className="w-4 h-4 text-cyan-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100 line-clamp-1">
                            {alert.title}
                          </span>
                          {alert.jointId && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-cyan-300 rounded border border-slate-700">
                              {alert.jointId}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {alert.description}
                        </p>
                      </div>
                    </div>

                    <StatusBadge status={alert.severity} size="xs" />
                  </div>

                  {/* Actions & Timestamp */}
                  <div className="mt-2.5 pt-2 border-t border-[#1f293d]/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>

                    <div className="flex items-center gap-2">
                      {!isAcknowledged && (
                        <button
                          type="button"
                          onClick={(e) => handleAcknowledge(e, alert.id)}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 hover:text-white transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                      <span className="text-cyan-400 flex items-center gap-0.5 hover:underline">
                        Investigate <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-4 pt-3 border-t border-[#1f293d] flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Autonomous SIH Alarm Engine</span>
        <span className="text-emerald-400">Active</span>
      </div>

    </div>
  );
}
