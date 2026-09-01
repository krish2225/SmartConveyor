import React, { useState } from 'react';
import StatusBadge from '../shared/StatusBadge.jsx';
import { acknowledgeAlertDoc } from '../../firebase/firestore.js';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Info,
  Clock,
  Check,
  ChevronDown
} from 'lucide-react';
import clsx from 'clsx';

export default function AlertsTable({
  alerts = [],
  facilityId = 'nmdc-kirandul-cv101',
  currentUser
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAlert, setSelectedAlert] = useState(null);

  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlertDoc(facilityId, alertId, currentUser);
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch =
      alert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.jointId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.source?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || alert.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-4">
      
      {/* Controls: Search & Filters */}
      <div className="bg-[#111726] border border-[#1f293d] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search alerts by title, joint ID, transducer source..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#0a0d14] border border-[#1f293d] rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Alarms</option>
            <option value="WARNING">Warning Notices</option>
            <option value="INFO">Informational Logs</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0a0d14] border border-[#1f293d] rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Incidents</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

      </div>

      {/* Table Canvas */}
      <div className="bg-[#111726] border border-[#1f293d] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            
            <thead className="bg-[#0c101a] border-b border-[#1f293d] text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Severity / Status</th>
                <th className="py-3.5 px-4">Incident Title &amp; Details</th>
                <th className="py-3.5 px-4">Origin / Joint ID</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#1f293d]/80">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    No alert events match the selected search criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map(alert => {
                  const isCritical = alert.severity === 'CRITICAL';
                  const isWarning = alert.severity === 'WARNING';
                  const isAcknowledged = alert.status === 'ACKNOWLEDGED';

                  return (
                    <tr
                      key={alert.id}
                      onClick={() => setSelectedAlert(alert)}
                      className={clsx(
                        'hover:bg-slate-800/40 transition-colors cursor-pointer',
                        isCritical && !isAcknowledged ? 'bg-red-950/15' : ''
                      )}
                    >
                      {/* Severity & Status Badges */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5 items-start">
                          <StatusBadge status={alert.severity} size="xs" />
                          <span className={clsx(
                            'text-[10px] font-mono uppercase font-bold',
                            alert.status === 'ACTIVE' ? 'text-red-400' :
                            alert.status === 'ACKNOWLEDGED' ? 'text-amber-400' : 'text-emerald-400'
                          )}>
                            ● {alert.status}
                          </span>
                        </div>
                      </td>

                      {/* Title & Description */}
                      <td className="py-4 px-4 max-w-md">
                        <div className="font-bold text-white text-xs mb-0.5">
                          {alert.title}
                        </div>
                        <p className="text-slate-400 text-[11px] line-clamp-2 leading-relaxed">
                          {alert.description}
                        </p>
                      </td>

                      {/* Joint / Source */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-mono text-cyan-300 font-semibold text-xs">
                          {alert.jointId || 'System Wide'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {alert.source}
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                        {new Date(alert.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>

                      {/* Action Button */}
                      <td className="py-4 px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        {!isAcknowledged && alert.status !== 'RESOLVED' ? (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 text-xs font-semibold transition-all shadow-sm"
                          >
                            Acknowledge
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-emerald-400 inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            {alert.acknowledgedBy ? `Ack by ${alert.acknowledgedBy.split(' ')[0]}` : 'Acknowledged'}
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#111726] border border-[#1f293d] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-start justify-between gap-3">
              <div>
                <StatusBadge status={selectedAlert.severity} />
                <h3 className="text-base font-bold text-white mt-2">
                  {selectedAlert.title}
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Event ID: {selectedAlert.id} | {selectedAlert.jointId}
                </span>
              </div>
              
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0a0d14] border border-[#1f293d] text-xs text-slate-300 leading-relaxed">
              {selectedAlert.description}
            </div>

            {/* Prescribed Action */}
            <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl text-xs space-y-1">
              <span className="text-cyan-400 font-mono font-bold text-[11px]">
                Recommended Mitigation Action:
              </span>
              <p className="text-slate-200">
                {selectedAlert.actionRequired || 'Perform ultrasonic splice verification.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1f293d]">
              {selectedAlert.status === 'ACTIVE' && (
                <button
                  onClick={() => {
                    handleAcknowledge(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg shadow"
                >
                  Acknowledge Alarm
                </button>
              )}
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
