import React, { useState, useEffect } from 'react';
import { getReportsApi, createReportApi } from '../../services/api.js';
import {
  FileSpreadsheet,
  Download,
  Plus,
  Calendar,
  Search,
  CheckCircle2,
  FileText,
  Clock,
  Printer,
  RefreshCw
} from 'lucide-react';
import clsx from 'clsx';

export default function ReportsTable({
  facilityId = 'nmdc-kirandul-cv101',
  joints = [],
  overallRiskScore = 84.6
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('NMDC Shift Splice Integrity & RUL Audit');
  const [reportType, setReportType] = useState('SHIFT_AUDIT');
  const [isExporting, setIsExporting] = useState(false);
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await getReportsApi(facilityId);
      if (res.reports) {
        setReportsList(res.reports);
      }
    } catch (err) {
      console.warn('Using fallback historical reports list:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [facilityId]);

  const handleExportCSV = (specificReport) => {
    setIsExporting(true);
    const headers = ['Joint ID', 'Status', 'RUL (Days)', 'RUL (Hours)', 'Risk Score (%)', 'Thickness (mm)', 'Temp (C)'];
    const rows = joints.map(j => [
      j.jointId,
      j.healthStatus,
      j.estimatedTimeToFailureDays,
      j.estimatedTimeToFailureHours,
      j.riskScore,
      j.ultrasonicThickness,
      j.temperature
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartConveyor_${facilityId}_${specificReport?.id || 'Report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setIsExporting(false), 800);
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    try {
      const res = await createReportApi({
        facilityId,
        title: reportTitle,
        type: reportType,
        generatedBy: 'Dr. Ananya Verma (Lead Eng.)',
        totalTonnage: '428,500 Tons',
        overallRiskScore,
        snapshotData: { jointsCount: joints.length, riskScore: overallRiskScore }
      });

      if (res.report) {
        setReportsList(prev => [res.report, ...prev]);
      }
    } catch (err) {
      console.error('Failed to create report in MongoDB:', err);
    }

    setShowGenerateModal(false);
    handleExportCSV();
  };

  return (
    <div className="space-y-6">
      
      {/* Top KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-[#111726] border border-[#1f293d]">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Belt Uptime</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">99.42%</div>
          <span className="text-[10px] text-slate-500 font-mono">Kirandul Complex Dep-14</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#111726] border border-[#1f293d]">
          <span className="text-[11px] font-mono text-slate-400 uppercase">MTTF (Mean Time)</span>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">3,480 hrs</div>
          <span className="text-[10px] text-slate-500 font-mono">Steel Cord Splices</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#111726] border border-[#1f293d]">
          <span className="text-[11px] font-mono text-slate-400 uppercase">MTTR (Repair Time)</span>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">4.2 hrs</div>
          <span className="text-[10px] text-slate-500 font-mono">Vulcanized Overhaul</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#111726] border border-[#1f293d]">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Ore Hauled (MTD)</span>
          <div className="text-xl font-bold font-mono text-orange-400 mt-1">1.84M Tons</div>
          <span className="text-[10px] text-slate-500 font-mono">+65% Fe Grade</span>
        </div>

      </div>

      {/* Reports Table Header & Generator Button */}
      <div className="bg-[#111726] border border-[#1f293d] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search report archive by title, engineer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export Live CSV
          </button>

          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Generate Custom Report
          </button>
        </div>

      </div>

      {/* Reports Table */}
      <div className="bg-[#111726] border border-[#1f293d] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0c101a] border-b border-[#1f293d] text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Report Title / ID</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Generated By</th>
                <th className="py-3.5 px-4">Date / Time</th>
                <th className="py-3.5 px-4">Tonnage</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#1f293d]/80">
              {reportsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-6 h-6 text-slate-600 mx-auto mb-1" />
                    No reports filed yet. Click "Generate Custom Report" to create a new compliance audit in MongoDB.
                  </td>
                </tr>
              ) : (
                reportsList.map(rep => (
                  <tr key={rep.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 font-bold text-white text-xs">
                        <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>{rep.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 pl-6">{rep.id}</span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap font-mono text-[11px] text-cyan-300">
                      {rep.type}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-slate-300 text-xs">
                      {rep.generatedBy}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {new Date(rep.generatedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap font-mono text-[11px] text-orange-400">
                      {rep.totalTonnage}
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleExportCSV(rep)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px] font-mono inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Custom Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#111726] border border-cyan-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-cyan-400">
              <FileSpreadsheet className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Generate NMDC Compliance Report</h3>
            </div>

            <form onSubmit={handleGenerateReport} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Report Heading:</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Audit Template:</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                >
                  <option value="SHIFT_AUDIT">Shift Splice Wear &amp; RUL Log</option>
                  <option value="DUMP_FILTER_LOG">Dump-Vibration False Alarm Audit</option>
                  <option value="VISION_DEFECT_MAP">Line-Scan Defect Incident History</option>
                  <option value="SENSOR_RELIABILITY_INDEX">Sensor Reliability &amp; Jitter Report</option>
                </select>
              </div>

              <div className="p-3 bg-[#0a0d14] rounded-xl border border-[#1f293d] text-[11px] text-slate-400 space-y-1">
                <span className="text-cyan-400 font-bold block">Live Telemetry Snapshot Included:</span>
                <div>• All 6 Vulcanized Splice Health Scores &amp; Thickness readings</div>
                <div>• DumpNoiseFilter suppressions &amp; Peak Vibration harmonics</div>
                <div>• AI Remaining Useful Life projections</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1f293d]">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  Generate &amp; Download CSV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
