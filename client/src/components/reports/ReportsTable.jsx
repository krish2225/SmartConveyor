import React, { useState, useEffect } from 'react';
import { getReportsApi, createReportApi } from '../../services/api.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table.jsx';
import { Card } from '../ui/card.jsx';
import { Badge } from '../ui/badge.jsx';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';
import { Label } from '../ui/label.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog.jsx';
import {
  Download,
  Plus,
  Search,
  CheckCircle2,
  FileText
} from 'lucide-react';

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
    <div className="space-y-4">
      
      {/* Top KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        <Card className="p-3.5 bg-surface border-border">
          <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Belt Uptime</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">99.42%</div>
          <span className="text-[10px] text-muted-foreground font-mono">Kirandul Complex Dep-14</span>
        </Card>

        <Card className="p-3.5 bg-surface border-border">
          <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">MTTF (Mean Time)</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-primary mt-1 tabular-nums">3,480 hrs</div>
          <span className="text-[10px] text-muted-foreground font-mono">Steel Cord Splices</span>
        </Card>

        <Card className="p-3.5 bg-surface border-border">
          <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">MTTR (Repair Time)</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-1 tabular-nums">4.2 hrs</div>
          <span className="text-[10px] text-muted-foreground font-mono">Vulcanized Overhaul</span>
        </Card>

        <Card className="p-3.5 bg-surface border-border">
          <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Ore Hauled (MTD)</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-orange-400 mt-1 tabular-nums">1.84M Tons</div>
          <span className="text-[10px] text-muted-foreground font-mono">+65% Fe Grade</span>
        </Card>

      </div>

      {/* Reports Table Header & Generator Button */}
      <Card className="p-3 bg-surface border-border flex flex-wrap items-center justify-between gap-3">
        
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search report archive by title, engineer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-xs font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="font-mono text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            Export Live CSV
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setShowGenerateModal(true)}
            className="font-mono text-xs gap-1.5 font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            Generate Custom Report
          </Button>
        </div>

      </Card>

      {/* Reports Table */}
      <Card className="bg-surface border-border overflow-hidden shadow-xl">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-sunken hover:bg-surface-sunken">
              <TableHead>Report Title / ID</TableHead>
              <TableHead className="w-[140px]">Category</TableHead>
              <TableHead className="w-[180px]">Generated By</TableHead>
              <TableHead className="w-[160px]">Date / Time</TableHead>
              <TableHead className="w-[130px]">Tonnage</TableHead>
              <TableHead className="w-[110px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {reportsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                  <CheckCircle2 className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                  No reports filed yet. Click "Generate Custom Report" to create a new compliance audit in MongoDB.
                </TableCell>
              </TableRow>
            ) : (
              reportsList.map(rep => (
                <TableRow key={rep.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-bold text-foreground text-xs">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span>{rep.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground pl-6">{rep.id}</span>
                  </TableCell>

                  <TableCell className="whitespace-nowrap font-mono text-[11px] text-primary font-semibold">
                    {rep.type}
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-slate-300 text-xs">
                    {rep.generatedBy}
                  </TableCell>

                  <TableCell className="whitespace-nowrap font-mono text-[11px] text-muted-foreground tabular-nums">
                    {new Date(rep.generatedAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>

                  <TableCell className="whitespace-nowrap font-mono text-[11px] text-orange-400 tabular-nums">
                    {rep.totalTonnage}
                  </TableCell>

                  <TableCell className="text-right whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportCSV(rep)}
                      className="h-6 px-2 text-[10px] font-mono gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* New Custom Report Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-md bg-surface border-border">
          <form onSubmit={handleGenerateReport} className="space-y-3.5">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary">
                <FileText className="w-4 h-4" />
                <DialogTitle className="text-sm font-bold text-foreground">
                  Generate NMDC Compliance Report
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground font-mono">
                Compile splice RUL, vibration, and thermal metrics for plant audit records.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2.5 text-xs">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Report Heading:</Label>
                <Input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground">Audit Template:</Label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-surface-sunken border border-border rounded-md px-2.5 py-1.5 text-foreground text-xs font-mono"
                >
                  <option value="SHIFT_AUDIT">Shift Splice Wear &amp; RUL Log</option>
                  <option value="DUMP_FILTER_LOG">Dump-Vibration False Alarm Audit</option>
                  <option value="VISION_DEFECT_MAP">Line-Scan Defect Incident History</option>
                  <option value="SENSOR_RELIABILITY_INDEX">Sensor Reliability &amp; Jitter Report</option>
                </select>
              </div>

              <div className="p-2.5 bg-surface-sunken rounded-md border border-border text-[10px] text-muted-foreground space-y-0.5 font-mono">
                <span className="text-primary font-bold block">Live Telemetry Snapshot Included:</span>
                <div>• All 6 Vulcanized Splice Health Scores &amp; Thickness readings</div>
                <div>• DumpNoiseFilter suppressions &amp; Peak Vibration harmonics</div>
                <div>• AI Remaining Useful Life projections</div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowGenerateModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                className="gap-1.5 font-bold font-mono"
              >
                <Download className="w-3.5 h-3.5" />
                Generate &amp; Download CSV
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
