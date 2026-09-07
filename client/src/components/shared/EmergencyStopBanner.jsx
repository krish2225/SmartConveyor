import React, { useState } from 'react';
import { AlertOctagon, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';
import { clearFacilityEmergencyStop } from '../../firebase/firestore.js';
import { Button } from '../ui/button.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog.jsx';
import { Label } from '../ui/label.jsx';

export default function EmergencyStopBanner({ emergencyStatus, currentUser, facilityId = 'nmdc-kirandul-cv101' }) {
  const [isClearing, setIsClearing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearNote, setClearNote] = useState('Splice joint inspected and confirmed secure. Line cleared for hauling.');

  if (!emergencyStatus?.emergencyStopActive) return null;

  const handleClearStop = async (e) => {
    e?.preventDefault();
    setIsClearing(true);
    try {
      await clearFacilityEmergencyStop(
        facilityId,
        currentUser || { displayName: 'Shift Operator', role: 'OPERATOR' },
        clearNote
      );
      setShowClearModal(false);
    } catch (err) {
      console.error('Failed to clear emergency stop:', err);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <>
      <div className="w-full bg-red-950 border-b-2 border-red-500 text-white px-4 py-2 sticky top-0 z-50 shadow-2xl shadow-red-950/80">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-destructive rounded text-white animate-pulse">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-mono font-bold tracking-wider text-red-200 uppercase text-xs">
                <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-ping" />
                EMERGENCY STOP ACTIVE — CONVEYOR LINE HALTED
              </div>
              <div className="text-red-300/90 text-[11px] font-mono mt-0.5">
                Hazard: <span className="font-semibold text-white">{emergencyStatus.reason || 'Splice Joint Rupture Hazard'}</span> | 
                Operator: <span className="font-semibold text-white">{emergencyStatus.triggeredBy || 'Control Operator'}</span> | 
                Time: <span className="tabular-nums text-red-100">{emergencyStatus.triggeredAt ? new Date(emergencyStatus.triggeredAt).toLocaleTimeString() : 'Just now'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="nominal"
              size="sm"
              onClick={() => setShowClearModal(true)}
              className="gap-1.5 font-bold uppercase tracking-wider font-mono text-[11px]"
            >
              <ShieldCheck className="w-4 h-4" />
              Clear E-Stop &amp; Resume Line
            </Button>
          </div>

        </div>
      </div>

      {/* Quick E-Stop Reset Confirmation Modal */}
      <Dialog open={showClearModal} onOpenChange={setShowClearModal}>
        <DialogContent className="max-w-md bg-surface border-border">
          <DialogHeader>
            <div className="flex items-center gap-2.5 text-emerald-400 mb-1">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <DialogTitle className="text-base font-bold text-foreground">
                Clear Emergency Stop Interlock
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground font-mono">
              Resume conveyor line CV-101 motor drives across all substations.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleClearStop} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground font-semibold">
                Safety Inspection Remarks &amp; Justification:
              </Label>
              <textarea
                rows={3}
                required
                value={clearNote}
                onChange={(e) => setClearNote(e.target.value)}
                className="w-full bg-surface-sunken border border-border rounded-md p-2.5 text-xs text-foreground focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowClearModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="nominal"
                size="sm"
                disabled={isClearing}
                className="gap-1.5 font-bold"
              >
                {isClearing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                {isClearing ? 'Resuming Line...' : 'Authorize & Resume Line'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
