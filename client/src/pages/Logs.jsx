import React, { useState } from 'react';
import { useLogs } from '../hooks/useLogs.js';
import StatusBadge from '../components/shared/StatusBadge.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.jsx';
import { Card } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog.jsx';
import {
  Terminal,
  Search,
  RefreshCw,
  Download,
  Plus,
  CheckCircle2,
  Database,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils.js';

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
    <div className="space-y-4 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded text-emerald-400 shadow-sm">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
              MongoDB System &amp; Telemetry Logs
              <Badge variant="nominal" size="sm" className="font-mono">
                Live MERN Store
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              Collection: <span className="text-emerald-400 font-bold">logs</span> • High-Volume Audit Trail, Sensor Anomaly Events &amp; Plant Clearances
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => refetch()}
            title="Refresh MongoDB Logs"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="font-mono text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            Export CSV
          </Button>

          <Button
            variant="nominal"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="font-mono text-xs gap-1.5 font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            Insert Diagnostic Log
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        <Card className="p-3.5 bg-surface border-border">
          <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Total MongoDB Logs</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-1 tabular-nums">
            {stats.total.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Real-time Stream</span>
        </Card>

        <Card className="p-3.5 bg-surface border-red-500/30">
          <span className="text-[10px] font-mono text-red-300 uppercase font-bold">Critical Events</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-red-400 mt-1 tabular-nums">
            {stats.levels.CRITICAL || 0}
          </div>
          <span className="text-[10px] text-red-400/80 font-mono">High Urgency Alerts</span>
        </Card>

        <Card className="p-3.5 bg-surface border-amber-500/30">
          <span className="text-[10px] font-mono text-amber-300 uppercase font-bold">Warnings &amp; Wear</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-1 tabular-nums">
            {stats.levels.WARN || 0}
          </div>
          <span className="text-[10px] text-amber-400/80 font-mono">Threshold Drift</span>
        </Card>

        <Card className="p-3.5 bg-surface border-border">
          <span className="text-[10px] font-mono text-primary uppercase font-bold">Audit &amp; Clearances</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-primary mt-1 tabular-nums">
            {stats.categories.AUDIT || 0}
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">Safety Compliance</span>
        </Card>

      </div>

      {/* Filter & Search Bar */}
      <Card className="p-3 bg-surface border-border flex flex-wrap items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search MongoDB logs by keyword, source, user, ID..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            className="pl-9 h-8 text-xs font-mono"
          />
        </div>

        {/* Level Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-muted-foreground">Level:</span>
          <Select
            value={filters.level}
            onValueChange={(val) => setFilters({ ...filters, level: val, page: 1 })}
          >
            <SelectTrigger className="w-[120px] h-8 text-xs font-mono">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Levels</SelectItem>
              <SelectItem value="INFO">INFO</SelectItem>
              <SelectItem value="WARN">WARN</SelectItem>
              <SelectItem value="ERROR">ERROR</SelectItem>
              <SelectItem value="CRITICAL">CRITICAL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-muted-foreground">Category:</span>
          <Select
            value={filters.category}
            onValueChange={(val) => setFilters({ ...filters, category: val, page: 1 })}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs font-mono">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              <SelectItem value="SYSTEM">SYSTEM</SelectItem>
              <SelectItem value="SENSOR">SENSOR</SelectItem>
              <SelectItem value="ANOMALY">ANOMALY</SelectItem>
              <SelectItem value="VISION">VISION</SelectItem>
              <SelectItem value="ALERT">ALERT</SelectItem>
              <SelectItem value="EMERGENCY">EMERGENCY</SelectItem>
              <SelectItem value="AUDIT">AUDIT</SelectItem>
              <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Joint Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-muted-foreground">Joint:</span>
          <Select
            value={filters.jointId}
            onValueChange={(val) => setFilters({ ...filters, jointId: val, page: 1 })}
          >
            <SelectTrigger className="w-[120px] h-8 text-xs font-mono">
              <SelectValue placeholder="Joint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Joints</SelectItem>
              <SelectItem value="Joint-01">Joint-01</SelectItem>
              <SelectItem value="Joint-02">Joint-02</SelectItem>
              <SelectItem value="Joint-03">Joint-03</SelectItem>
              <SelectItem value="Joint-04">Joint-04</SelectItem>
              <SelectItem value="Joint-05">Joint-05</SelectItem>
              <SelectItem value="Joint-06">Joint-06</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </Card>

      {/* Logs Table */}
      <Card className="bg-surface border-border overflow-hidden shadow-xl">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-sunken hover:bg-surface-sunken">
              <TableHead className="w-[100px]">Level</TableHead>
              <TableHead className="w-[150px]">Timestamp</TableHead>
              <TableHead className="w-[160px]">Category / Source</TableHead>
              <TableHead>Log Message</TableHead>
              <TableHead className="w-[140px]">Target / User</TableHead>
              <TableHead className="w-[90px] text-right">Details</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                  <CheckCircle2 className="w-7 h-7 text-muted-foreground/60 mx-auto mb-2" />
                  No log records match the selected filter criteria in MongoDB.
                </TableCell>
              </TableRow>
            ) : (
              logs.map(log => {
                const isCritical = log.level === 'CRITICAL';
                const isError = log.level === 'ERROR';
                const isWarn = log.level === 'WARN';

                return (
                  <TableRow
                    key={log._id || log.logId}
                    onClick={() => setSelectedLog(log)}
                    className={cn(
                      'cursor-pointer transition-colors',
                      isCritical ? 'bg-red-950/20 border-l-2 border-l-red-500' : isError ? 'bg-orange-950/15' : isWarn ? 'bg-amber-950/10' : ''
                    )}
                  >
                    {/* Level Badge */}
                    <TableCell className="whitespace-nowrap">
                      <Badge
                        variant={isCritical ? 'critical' : (isError || isWarn ? 'warning' : 'cyan')}
                        size="sm"
                        className="font-mono"
                      >
                        {log.level}
                      </Badge>
                    </TableCell>

                    {/* Timestamp */}
                    <TableCell className="whitespace-nowrap font-mono text-[11px] text-muted-foreground tabular-nums">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      <span className="block text-[10px] text-muted-foreground/70">
                        {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </TableCell>

                    {/* Category & Source */}
                    <TableCell className="whitespace-nowrap font-mono">
                      <div className="text-primary font-semibold text-[11px]">
                        {log.category}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                        {log.source || 'Node Backend'}
                      </div>
                    </TableCell>

                    {/* Message */}
                    <TableCell className="max-w-md">
                      <div className="text-foreground text-xs font-mono font-medium line-clamp-2 leading-tight">
                        {log.message}
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <span className="text-[10px] font-mono text-muted-foreground truncate block mt-0.5">
                          {JSON.stringify(log.details).slice(0, 70)}...
                        </span>
                      )}
                    </TableCell>

                    {/* Joint / User */}
                    <TableCell className="whitespace-nowrap font-mono">
                      <div className="text-xs text-amber-400 font-medium">
                        {log.jointId || '—'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {log.user || 'System'}
                      </div>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="h-6 px-2 text-[10px] font-mono gap-1"
                      >
                        <Terminal className="w-3 h-3 text-emerald-400" />
                        JSON
                      </Button>
                    </TableCell>

                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Log Details Modal */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl bg-surface border-border">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant={selectedLog.level === 'CRITICAL' ? 'critical' : 'default'} className="font-mono">
                  {selectedLog.level} • {selectedLog.category}
                </Badge>
              </div>
              <DialogTitle className="text-base font-bold text-foreground mt-2">
                {selectedLog.message}
              </DialogTitle>
              <DialogDescription className="text-xs font-mono text-muted-foreground">
                Log ID: {selectedLog.logId || selectedLog._id} • Source: {selectedLog.source}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2 text-xs bg-surface-sunken p-3 rounded-md border border-border">
                <div><span className="text-muted-foreground">User:</span> <strong className="text-foreground">{selectedLog.user || 'System'}</strong></div>
                <div><span className="text-muted-foreground">Joint ID:</span> <strong className="text-amber-400">{selectedLog.jointId || 'None'}</strong></div>
                <div><span className="text-muted-foreground">Facility:</span> <strong className="text-primary">{selectedLog.facilityId}</strong></div>
                <div><span className="text-muted-foreground">Timestamp:</span> <span className="tabular-nums text-foreground">{new Date(selectedLog.timestamp).toISOString()}</span></div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                  <span>Structured Document Payload:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyJson(selectedLog)}
                    className="h-6 px-2 text-[10px] gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy JSON'}
                  </Button>
                </div>
                <pre className="p-3 bg-background border border-border rounded-md text-[11px] text-cyan-200 overflow-x-auto max-h-56">
                  <code>{JSON.stringify(selectedLog, null, 2)}</code>
                </pre>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Insert Log Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md bg-surface border-border">
          <form onSubmit={handleCreateSubmit} className="space-y-3.5">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Insert Diagnostic Log Entry
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-mono">
                Append custom inspection audit record into MongoDB telemetry collection.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Severity Level:</Label>
                  <select
                    value={newLogLevel}
                    onChange={(e) => setNewLogLevel(e.target.value)}
                    className="w-full bg-surface-sunken border border-border rounded-md px-2.5 py-1.5 text-foreground text-xs font-mono"
                  >
                    <option value="INFO">INFO</option>
                    <option value="WARN">WARN</option>
                    <option value="ERROR">ERROR</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground">Category:</Label>
                  <select
                    value={newLogCategory}
                    onChange={(e) => setNewLogCategory(e.target.value)}
                    className="w-full bg-surface-sunken border border-border rounded-md px-2.5 py-1.5 text-foreground text-xs font-mono"
                  >
                    <option value="SYSTEM">SYSTEM</option>
                    <option value="SENSOR">SENSOR</option>
                    <option value="ANOMALY">ANOMALY</option>
                    <option value="VISION">VISION</option>
                    <option value="ALERT">ALERT</option>
                    <option value="AUDIT">AUDIT</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground">Target Splice Joint:</Label>
                <select
                  value={newLogJointId}
                  onChange={(e) => setNewLogJointId(e.target.value)}
                  className="w-full bg-surface-sunken border border-border rounded-md px-2.5 py-1.5 text-foreground text-xs font-mono"
                >
                  <option value="NONE">General / None</option>
                  <option value="Joint-01">Joint-01 (Head Splice)</option>
                  <option value="Joint-02">Joint-02 (Drive Return)</option>
                  <option value="Joint-03">Joint-03 (Loading Zone)</option>
                  <option value="Joint-04">Joint-04 (Carrying Strand)</option>
                  <option value="Joint-05">Joint-05 (Tail Transition)</option>
                  <option value="Joint-06">Joint-06 (Take-up Loop)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground">Log Message / Finding:</Label>
                <textarea
                  rows={3}
                  required
                  placeholder="E.g. Visual verification performed on Joint-05 step-lap splice."
                  value={newLogMessage}
                  onChange={(e) => setNewLogMessage(e.target.value)}
                  className="w-full bg-surface-sunken border border-border rounded-md p-2 text-foreground text-xs font-mono focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="nominal"
                size="sm"
                disabled={isSubmitting}
                className="font-bold font-mono"
              >
                {isSubmitting ? 'Inserting...' : 'Commit to MongoDB'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
