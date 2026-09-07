import React, { useState } from 'react';
import StatusBadge from '../shared/StatusBadge.jsx';
import { acknowledgeAlertDoc } from '../../firebase/firestore.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table.jsx';
import { Input } from '../ui/input.jsx';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import { Card } from '../ui/card.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog.jsx';
import {
  Search,
  CheckCircle2,
  Check
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

export default function AlertsTable({
  alerts = [],
  facilityId = 'nmdc-kirandul-cv101',
  currentUser,
  onAcknowledgeAlert
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [localAcked, setLocalAcked] = useState(new Set());

  const handleAcknowledge = async (alertId) => {
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
    <div className="space-y-3.5">
      
      {/* Controls: Search & Filters */}
      <Card className="p-3 bg-surface border-border flex flex-wrap items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search alerts by title, joint ID, transducer source..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-xs font-mono"
          />
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-muted-foreground">Severity:</span>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs font-mono">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Severities</SelectItem>
              <SelectItem value="CRITICAL">Critical Alarms</SelectItem>
              <SelectItem value="WARNING">Warning Notices</SelectItem>
              <SelectItem value="INFO">Info Logs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-muted-foreground">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs font-mono">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </Card>

      {/* Table Canvas */}
      <Card className="bg-surface border-border overflow-hidden shadow-xl">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-sunken hover:bg-surface-sunken">
              <TableHead className="w-[140px]">Severity / Status</TableHead>
              <TableHead>Incident Title &amp; Details</TableHead>
              <TableHead className="w-[160px]">Origin / Joint ID</TableHead>
              <TableHead className="w-[160px]">Timestamp</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredAlerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground text-xs">
                  <CheckCircle2 className="w-7 h-7 text-muted-foreground/60 mx-auto mb-2" />
                  No alert events match the selected search criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredAlerts.map(alert => {
                const alertId = alert.id || alert._id || alert.incidentId;
                const isCritical = alert.severity === 'CRITICAL';
                const isWarning = alert.severity === 'WARNING';
                const isAcknowledged = alert.status === 'ACKNOWLEDGED' || localAcked.has(alertId);

                return (
                  <TableRow
                    key={alertId}
                    onClick={() => setSelectedAlert(alert)}
                    className={cn(
                      'cursor-pointer transition-colors',
                      isCritical && !isAcknowledged ? 'bg-red-950/15 border-l-2 border-l-red-500' : ''
                    )}
                  >
                    {/* Severity & Status Badges */}
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusBadge status={alert.severity} size="xs" />
                        <span className={cn(
                          'text-[10px] font-mono uppercase font-bold',
                          alert.status === 'ACTIVE' && !localAcked.has(alertId) ? 'text-red-400' :
                          isAcknowledged ? 'text-amber-400' : 'text-emerald-400'
                        )}>
                          ● {isAcknowledged ? 'ACKNOWLEDGED' : alert.status}
                        </span>
                      </div>
                    </TableCell>

                    {/* Title & Description */}
                    <TableCell className="max-w-md">
                      <div className="font-bold text-foreground text-xs mb-0.5">
                        {alert.title}
                      </div>
                      <p className="text-muted-foreground text-[11px] line-clamp-2 leading-tight font-mono">
                        {alert.description}
                      </p>
                    </TableCell>

                    {/* Joint / Source */}
                    <TableCell className="whitespace-nowrap font-mono">
                      <div className="text-primary font-semibold text-xs">
                        {alert.jointId || 'System Wide'}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {alert.source}
                      </div>
                    </TableCell>

                    {/* Timestamp */}
                    <TableCell className="whitespace-nowrap font-mono text-[11px] text-muted-foreground tabular-nums">
                      {new Date(alert.createdAt || Date.now()).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </TableCell>

                    {/* Action Button */}
                    <TableCell className="text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      {!isAcknowledged && alert.status !== 'RESOLVED' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcknowledge(alertId)}
                          className="font-mono text-xs font-bold bg-surface-elevated hover:bg-emerald-600 hover:text-white border-border hover:border-emerald-500 gap-1 active:scale-95 transition-all"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Acknowledge
                        </Button>
                      ) : (
                        <span className="text-[11px] font-mono text-emerald-400 inline-flex items-center gap-1 font-semibold">
                          <Check className="w-3.5 h-3.5" />
                          {alert.acknowledgedBy ? `Ack by ${alert.acknowledgedBy.split(' ')[0]}` : 'Acknowledged'}
                        </span>
                      )}
                    </TableCell>

                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
          <DialogContent className="max-w-lg bg-surface border-border">
            <DialogHeader>
              <div className="flex items-center justify-between gap-2">
                <StatusBadge status={selectedAlert.severity} />
                <span className="text-[10px] font-mono text-muted-foreground">
                  Event ID: {selectedAlert.id}
                </span>
              </div>
              <DialogTitle className="text-base font-bold text-foreground mt-2">
                {selectedAlert.title}
              </DialogTitle>
              <DialogDescription className="text-xs font-mono text-primary">
                Origin: {selectedAlert.jointId} ({selectedAlert.source})
              </DialogDescription>
            </DialogHeader>

            <div className="p-3 rounded-md bg-surface-sunken border border-border text-xs text-slate-200 leading-relaxed font-mono">
              {selectedAlert.description}
            </div>

            {/* Prescribed Action */}
            <div className="p-2.5 bg-primary/10 border border-primary/30 rounded-md text-xs space-y-1 font-mono">
              <span className="text-primary font-bold text-[11px]">
                Recommended Mitigation Action:
              </span>
              <p className="text-slate-200 text-xs">
                {selectedAlert.actionRequired || 'Perform ultrasonic splice verification and schedule repair.'}
              </p>
            </div>

            <DialogFooter className="gap-2">
              {selectedAlert.status === 'ACTIVE' && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    handleAcknowledge(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  className="font-bold font-mono"
                >
                  Acknowledge Alarm
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAlert(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
