import React from 'react';
import { SAMPLE_CONVEYOR_SCANS } from '../../assets/sampleScans.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog.jsx';
import { Badge } from '../ui/badge.jsx';
import { Button } from '../ui/button.jsx';
import { cn } from '../../lib/utils.js';

export default function SamplePickerModal({ isOpen, onClose, onSelectSample, currentScanId }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-surface border-border p-5 shadow-2xl">
        
        {/* Modal Header */}
        <DialogHeader className="pb-2 border-b border-border">
          <DialogTitle className="text-sm font-bold text-foreground">
            Select Conveyor Defect Optical Sample
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-mono">
            Test YOLOv8 optical defect detection on labeled NMDC conveyor inspection captures
          </DialogDescription>
        </DialogHeader>

        {/* Samples Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1 py-1">
          {SAMPLE_CONVEYOR_SCANS.map((sample) => {
            const isSelected = sample.incidentId === currentScanId;
            const isCrit = sample.severity === 'CRITICAL';
            const isWarn = sample.severity === 'WARNING';

            return (
              <div
                key={sample.incidentId}
                onClick={() => {
                  onSelectSample(sample);
                  onClose();
                }}
                className={cn(
                  'group p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between space-y-2 select-none',
                  isSelected
                    ? 'bg-primary/10 border-primary ring-1 ring-primary shadow-xs'
                    : 'bg-surface-sunken/70 border-border hover:border-primary/40 hover:bg-surface'
                )}
              >
                {/* Image Preview */}
                <div className="relative w-full h-28 rounded-md overflow-hidden bg-slate-900 border border-border/80">
                  <img
                    src={sample.imageUrl}
                    alt={sample.classification}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute top-1.5 right-1.5">
                    <Badge
                      variant={isCrit ? 'critical' : (isWarn ? 'warning' : 'nominal')}
                      size="sm"
                      className="px-1.5 py-0 text-[9px]"
                    >
                      {sample.severity}
                    </Badge>
                  </div>
                </div>

                {/* Details */}
                <div>
                  <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors font-mono">
                    {sample.defectType} ({sample.linkedJointId})
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {sample.classification}
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground pt-1.5 border-t border-border mt-1.5">
                    <span>{sample.sector}</span>
                    <span className="text-primary font-bold tabular-nums">Conf: {Math.round(sample.confidence * 100)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <DialogFooter className="pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
