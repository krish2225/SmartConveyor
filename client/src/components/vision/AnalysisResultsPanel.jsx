import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../shared/StatusBadge.jsx';
import { triggerFacilityEmergencyStop } from '../../firebase/firestore.js';
import { Card } from '../ui/card.jsx';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import { Progress } from '../ui/progress.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog.jsx';
import { Label } from '../ui/label.jsx';
import {
  AlertOctagon,
  Wrench,
  Cpu,
  Ruler,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Send,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

export default function AnalysisResultsPanel({
  activeScan,
  facilityId = 'nmdc-kirandul-cv101',
  currentUser
}) {
  const navigate = useNavigate();
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketLogged, setTicketLogged] = useState(false);
  const [ticketPriority, setTicketPriority] = useState('P1 - Urgent Vulcanizing Overhaul (< 24h)');
  const [ticketNotes, setTicketNotes] = useState('Splice delamination confirmed on Joint-05 tail transition.');

  const isDefect = activeScan?.isDefect;
  const isCritical = activeScan?.severity === 'CRITICAL';
  const isWarning = activeScan?.severity === 'WARNING';
  const confidencePct = Math.round((activeScan?.confidence || 0.954) * 100);

  const params = activeScan?.defectParameters || {
    lengthMm: 1180.0,
    widthMm: 54.0,
    depthMm: 14.8,
    growthRatePctHr: 8.4
  };

  const linkedJointId = activeScan?.linkedJointId || 'Joint-05';
  const linkedJointName = activeScan?.linkedJointName || 'Joint 05 (Tail Pulley Transition Splice)';

  const handleTriggerEmergencyStop = async () => {
    try {
      await triggerFacilityEmergencyStop(
        facilityId,
        currentUser,
        `Vision AI Confirmed: ${activeScan?.classification || 'Severe Splice Joint Delamination'}`
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigateToDigitalTwin = () => {
    navigate(`/digital-twin?jointId=${linkedJointId}`);
  };

  const handleLogTicket = (e) => {
    e.preventDefault();
    setTicketLogged(true);
    setTimeout(() => {
      setShowTicketModal(false);
      setTicketLogged(false);
    }, 1800);
  };

  return (
    <>
      <Card className="p-4 bg-surface border-border shadow-xs flex flex-col justify-between h-full space-y-3.5 select-none transition-colors">
        
        <div className="space-y-3.5">
          
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 border border-primary/30 rounded-md text-primary">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">Analysis Results</h3>
            </div>
            <StatusBadge status={activeScan?.severity || 'CRITICAL'} size="xs" />
          </div>

          {/* 1. STATUS Headline */}
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-muted-foreground">
              CLASSIFICATION STATUS
            </div>
            <div className={cn(
              'text-sm sm:text-base font-bold tracking-tight',
              isCritical ? 'text-red-600 dark:text-red-400' : (isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')
            )}>
              {activeScan?.classification || 'CRITICAL - Splice Joint Delamination'}
            </div>
          </div>

          {/* 2. CONFIDENCE Progress Bar */}
          <div className="space-y-1.5 p-2.5 bg-surface-sunken/70 border border-border/80 rounded-lg">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground font-semibold text-[11px]">AI CONFIDENCE</span>
              <span className={cn('font-bold tabular-nums', isCritical ? 'text-red-500' : 'text-primary')}>
                {confidencePct}%
              </span>
            </div>
            <Progress
              value={confidencePct}
              className="h-2"
              indicatorClassName={isCritical ? 'bg-red-500' : (isWarning ? 'bg-amber-500' : 'bg-primary')}
            />
            <div className="text-[10px] font-mono text-muted-foreground flex justify-between pt-0.5">
              <span>YOLOv8-nano</span>
              <span>Model Ver: 2.4.1</span>
            </div>
          </div>

          {/* 3. AFFECTED COMPONENT Box with LOCATE Button */}
          <div className="p-2.5 bg-surface-sunken/70 border border-border/80 rounded-lg space-y-1.5">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-bold">
              AFFECTED SPLICE COMPONENT
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-bold text-foreground truncate font-mono">
                  {linkedJointId}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {linkedJointName}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateToDigitalTwin}
                className="font-mono text-xs gap-1 shrink-0 text-primary border-primary/40 hover:bg-primary/10 h-7 px-2"
              >
                <MapPin className="w-3.5 h-3.5" />
                Locate
              </Button>
            </div>
          </div>

          {/* 4. DEFECT PARAMETERS Card */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-bold">
              Defect Geometry Parameters
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              
              {/* Length (est) */}
              <div className="p-2 bg-surface-sunken/70 border border-border/80 rounded-lg">
                <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-mono">
                  <Ruler className="w-3 h-3 text-primary" />
                  Length (est)
                </div>
                <div className="text-xs font-bold font-mono text-foreground mt-0.5 tabular-nums">
                  {params.lengthMm || params.crackLengthMm || 1180} mm
                </div>
              </div>

              {/* Width (max) */}
              <div className="p-2 bg-surface-sunken/70 border border-border/80 rounded-lg">
                <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-mono">
                  <Ruler className="w-3 h-3 text-primary" />
                  Width (max)
                </div>
                <div className="text-xs font-bold font-mono text-foreground mt-0.5 tabular-nums">
                  {params.widthMm || params.tearWidthMm || 54} mm
                </div>
              </div>

              {/* Depth (est) */}
              <div className="p-2 bg-surface-sunken/70 border border-border/80 rounded-lg">
                <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-mono">
                  <ShieldAlert className="w-3 h-3 text-amber-500" />
                  Depth (est)
                </div>
                <div className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 tabular-nums">
                  {params.depthMm || 14.8} mm
                </div>
              </div>

              {/* Growth Rate (%/hr) */}
              <div className="p-2 bg-surface-sunken/70 border border-border/80 rounded-lg">
                <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-mono">
                  <TrendingUp className="w-3 h-3 text-red-500" />
                  Growth Rate
                </div>
                <div className="text-xs font-bold font-mono text-red-600 dark:text-red-400 mt-0.5 tabular-nums">
                  +{params.growthRatePctHr || 8.4}% / hr
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Action Buttons: Log Maintenance Ticket & Emergency Stop */}
        <div className="pt-3 border-t border-border space-y-2">
          
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowTicketModal(true)}
            className="w-full font-mono text-xs font-bold gap-1.5 h-8.5 shadow-sm"
          >
            <Wrench className="w-3.5 h-3.5" />
            Dispatch Maintenance Ticket
          </Button>

          {isCritical && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleTriggerEmergencyStop}
              className="w-full font-mono text-xs font-bold uppercase gap-1.5 h-8.5 shadow-sm"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              Direct Emergency Line Halt
            </Button>
          )}

        </div>

      </Card>

      {/* Dispatch Ticket Modal */}
      <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
        <DialogContent className="max-w-md bg-surface border-border shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 border border-primary/30 rounded text-primary">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-foreground">
                  Dispatch Maintenance Work Order
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground font-mono">
                  Generates SAP PM work order for NMDC Bailadila maintenance crew.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {ticketLogged ? (
            <div className="py-6 text-center space-y-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-10 h-10 mx-auto animate-bounce" />
              <div className="font-bold text-sm">Work Order Dispatched Successfully!</div>
              <div className="text-xs text-muted-foreground font-mono">
                SAP PM Ref: #WO-2026-NMDC-{Math.floor(1000 + Math.random() * 9000)}
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogTicket} className="space-y-3 py-2 text-xs">
              <div>
                <Label className="text-xs font-semibold text-foreground">Priority Level</Label>
                <select
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value)}
                  className="w-full bg-surface-sunken border border-border rounded-md px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none font-mono mt-1"
                >
                  <option value="P1 - Urgent Vulcanizing Overhaul (< 24h)">P1 - Urgent Vulcanizing Overhaul (&lt; 24h)</option>
                  <option value="P2 - Next Scheduled Shift Maintenance">P2 - Next Scheduled Shift Maintenance</option>
                  <option value="P3 - Monitor at Next Pulley Inspection">P3 - Monitor at Next Pulley Inspection</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-foreground">Defect Description &amp; Notes</Label>
                <textarea
                  value={ticketNotes}
                  onChange={(e) => setTicketNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-surface-sunken border border-border rounded-md px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none font-mono mt-1"
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTicketModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  className="gap-1 font-bold"
                >
                  <Send className="w-3.5 h-3.5" />
                  Dispatch Ticket
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
