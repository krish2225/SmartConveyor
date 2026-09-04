import React, { useState } from 'react';
import { useLogs } from '../hooks/useLogs.js';
import StatusBadge from '../components/shared/StatusBadge.jsx';
import {
  Terminal,
  Search,
  Filter,
  RefreshCw,
  Download,
  Plus,
  AlertTriangle,
  AlertOctagon,
  Info,
  ShieldCheck,
  CheckCircle2,
  Database,
  Cpu,
  Layers,
  Copy,
  Check,
  X
} from 'lucide-react';
import clsx from 'clsx';

export default function Logs({
  facilityId = 'nmdc-kirandul-cv101',
  currentUser
}) {
  const {
    logs,
    stats,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    refetch,
    insertLog
  } = useLogs(facilityId, {}, 5);

  const [selectedLog, setSelectedLog] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // New log form state
  const [newLogLevel, setNewLogLevel] = useState('INFO');
  const [newLogCategory, setNewLogCategory] = useState('SYSTEM');
  const [newLogMessage, setNewLogMessage] = useState('');
  const [newLogSource, setNewLogSource] = useState('Control Console');
  const [newLogJointId, setNewLogJointId] = useState('Joint-01');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCopyJson = (obj) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'Level', 'Category', 'Source', 'Message', 'Joint ID', 'User'];
    const rows = logs.map(l => [
      `"${l.logId || l._id}"`,
      `"${new Date(l.timestamp).toISOString()}"`,
      `"${l.level}"`,
      `"${l.category}"`,
      `"${l.source || ''}"`,
      `"${(l.message || '').replace(/"/g, '""')}"`,
      `"${l.jointId || ''}"`,
      `"${l.user || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartConveyor_${facilityId}_MongoDB_Logs.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `SmartConveyor_${facilityId}_MongoDB_Logs.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newLogMessage.trim()) return;

    setIsSubmitting(true);
    try {
      await insertLog({
        level: newLogLevel,
        category: newLogCategory,
        source: newLogSource,
        message: newLogMessage,
        jointId: newLogJointId !== 'NONE' ? newLogJointId : null,
        user: currentUser?.displayName || 'Operator',
        details: { manualEntry: true, operatorRole: currentUser?.role || 'OPERATOR' }
      });
      setShowCreateModal(false);
      setNewLogMessage('');
    } catch (err) {
      alert(`Failed to save log: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-slate-950 shadow-md">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              MongoDB System &amp; Telemetry Logs
              <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40 rounded-full">
                Live MERN Store
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Collection: <span className="text-emerald-400 font-bold">logs</span> • High-Volume Audit Trail, Sensor Anomaly Events &amp; Plant Clearances
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors shadow-sm"
            title="Refresh MongoDB Logs"
          >
            <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export CSV
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Insert Diagnostic Log
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-[#111726] border border-[#1f293d]">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Total MongoDB Logs</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {stats.total.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Real-time Stream</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#111726] border border-red-500/30">
          <span className="text-[11px] font-mono text-red-300 uppercase">Critical Events</span>
          <div className="text-2xl font-bold font-mono text-red-400 mt-1">
            {stats.levels.CRITICAL || 0}
          </div>
          <span className="text-[10px] text-red-500/80 font-mono">High Urgency Alerts</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#111726] border border-amber-500/30">
          <span className="text-[11px] font-mono text-amber-300 uppercase">Warnings &amp; Wear</span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {stats.levels.WARN || 0}
          </div>
          <span className="text-[10px] text-amber-500/80 font-mono">Threshold Drift</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#111726] border border-[#1f293d]">
          <span className="text-[11px] font-mono text-cyan-300 uppercase">Audit &amp; Clearances</span>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {stats.categories.AUDIT || 0}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Safety Compliance</span>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#111726] border border-[#1f293d] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search MongoDB logs by keyword, source, user, ID..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Level Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-slate-400">Level:</span>
          <select
            value={filters.level}
            onChange={(e) => setFilters({ ...filters, level: e.target.value, page: 1 })}
            className="bg-[#0a0d14] border border-[#1f293d] rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-slate-400">Category:</span>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
            className="bg-[#0a0d14] border border-[#1f293d] rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="SYSTEM">SYSTEM</option>
            <option value="SENSOR">SENSOR</option>
            <option value="ANOMALY">ANOMALY</option>
            <option value="VISION">VISION</option>
            <option value="ALERT">ALERT</option>
            <option value="EMERGENCY">EMERGENCY</option>
            <option value="AUDIT">AUDIT</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
          </select>
        </div>

        {/* Joint Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-slate-400">Joint:</span>
          <select
            value={filters.jointId}
            onChange={(e) => setFilters({ ...filters, jointId: e.target.value, page: 1 })}
            className="bg-[#0a0d14] border border-[#1f293d] rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Joints</option>
            <option value="Joint-01">Joint-01</option>
            <option value="Joint-02">Joint-02</option>
            <option value="Joint-03">Joint-03</option>
            <option value="Joint-04">Joint-04</option>
            <option value="Joint-05">Joint-05</option>
            <option value="Joint-06">Joint-06</option>
          </select>
        </div>

      </div>

      {/* Logs Table */}
      <div className="bg-[#111726] border border-[#1f293d] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0c101a] border-b border-[#1f293d] text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Level</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Category / Source</th>
                <th className="py-3.5 px-4">Log Message</th>
                <th className="py-3.5 px-4">Target / User</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#1f293d]/80">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    No log records match the selected filter criteria in MongoDB.
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const isCritical = log.level === 'CRITICAL';
                  const isError = log.level === 'ERROR';
                  const isWarn = log.level === 'WARN';

                  return (
                    <tr
                      key={log._id || log.logId}
                      onClick={() => setSelectedLog(log)}
                      className={clsx(
                        'hover:bg-slate-800/50 transition-colors cursor-pointer',
                        isCritical ? 'bg-red-950/20' : isError ? 'bg-orange-950/15' : isWarn ? 'bg-amber-950/10' : ''
                      )}
                    >
                      {/* Level Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={clsx(
                          'px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border',
                          isCritical ? 'bg-red-950 text-red-300 border-red-500/50' :
                          isError ? 'bg-orange-950 text-orange-300 border-orange-500/50' :
                          isWarn ? 'bg-amber-950 text-amber-300 border-amber-500/50' :
                          'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                        )}>
                          {log.level}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        <span className="block text-[10px] text-slate-500">
                          {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </td>

                      {/* Category & Source */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-cyan-300 font-semibold text-[11px]">
                          {log.category}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {log.source || 'Node Backend'}
                        </div>
                      </td>

                      {/* Message */}
                      <td className="py-3 px-4 max-w-md">
                        <div className="text-slate-200 text-xs font-mono font-medium line-clamp-2 leading-relaxed">
                          {log.message}
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <span className="text-[10px] font-mono text-slate-500 truncate block mt-0.5">
                            {JSON.stringify(log.details).slice(0, 70)}...
                          </span>
                        )}
                      </td>

                      {/* Joint / User */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-xs text-amber-300 font-medium">
                          {log.jointId || '—'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {log.user || 'System'}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px] font-mono inline-flex items-center gap-1"
                        >
                          <Terminal className="w-3 h-3 text-emerald-400" />
                          JSON
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#111726] border border-[#1f293d] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold uppercase bg-slate-800 border border-slate-700 text-cyan-300">
                  {selectedLog.level} • {selectedLog.category}
                </span>
                <h3 className="text-base font-bold text-white mt-2">
                  {selectedLog.message}
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Log ID: {selectedLog.logId || selectedLog._id} | {selectedLog.source}
                </span>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* JSON Viewer */}
            <div className="relative rounded-xl bg-[#0a0d14] border border-[#1f293d] p-4 text-xs font-mono text-emerald-400 max-h-80 overflow-y-auto">
              <button
                onClick={() => handleCopyJson(selectedLog)}
                className="absolute right-3 top-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px] flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>

              <pre className="whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1f293d]">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Insert Diagnostic Log Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#111726] border border-emerald-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center gap-2 text-emerald-400">
              <Database className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Insert Diagnostic Log Entry into MongoDB</h3>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Severity Level:</label>
                <select
                  value={newLogLevel}
                  onChange={(e) => setNewLogLevel(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="INFO">INFO (Standard telemetry / audit)</option>
                  <option value="WARN">WARN (Elevated wear / calibration drift)</option>
                  <option value="ERROR">ERROR (Transducer fault / packet loss)</option>
                  <option value="CRITICAL">CRITICAL (Splice joint rupture hazard)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category:</label>
                <select
                  value={newLogCategory}
                  onChange={(e) => setNewLogCategory(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="SYSTEM">SYSTEM</option>
                  <option value="SENSOR">SENSOR</option>
                  <option value="ANOMALY">ANOMALY</option>
                  <option value="VISION">VISION</option>
                  <option value="ALERT">ALERT</option>
                  <option value="EMERGENCY">EMERGENCY</option>
                  <option value="AUDIT">AUDIT</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Source Transducer / Component:</label>
                <input
                  type="text"
                  value={newLogSource}
                  onChange={(e) => setNewLogSource(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Splice Joint:</label>
                <select
                  value={newLogJointId}
                  onChange={(e) => setNewLogJointId(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="NONE">None / System Wide</option>
                  <option value="Joint-01">Joint-01 (Head Splice)</option>
                  <option value="Joint-02">Joint-02 (Tensioning Zone)</option>
                  <option value="Joint-03">Joint-03 (Feeder Chute Impact)</option>
                  <option value="Joint-04">Joint-04 (Mid-Span Drive)</option>
                  <option value="Joint-05">Joint-05 (High Tension Curve)</option>
                  <option value="Joint-06">Joint-06 (Tail Pulley Return)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Log Message:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Ultrasonic transducer calibration test executed successfully."
                  value={newLogMessage}
                  onChange={(e) => setNewLogMessage(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg p-2.5 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1f293d]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow"
                >
                  {isSubmitting ? 'Saving to MongoDB...' : 'Save Log to MongoDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
