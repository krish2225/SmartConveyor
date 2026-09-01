import React from 'react';
import { X, CheckCircle, AlertTriangle, AlertOctagon, ShieldCheck } from 'lucide-react';
import { SAMPLE_CONVEYOR_SCANS } from '../../assets/sampleScans.js';
import clsx from 'clsx';

export default function SamplePickerModal({ isOpen, onClose, onSelectSample, currentScanId }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#111726] border border-cyan-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#1f293d] pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Select Conveyor Defect Sample Image</h3>
            <p className="text-xs text-slate-400 font-mono">
              Test YOLOv8 optical defect detection on labeled NMDC conveyor captures
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Samples Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[440px] overflow-y-auto pr-1">
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
                className={clsx(
                  'group p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2',
                  isSelected
                    ? 'bg-cyan-950/50 border-cyan-400 ring-1 ring-cyan-400 shadow-lg shadow-cyan-500/20'
                    : 'bg-[#0a0d14] border-[#1f293d] hover:border-slate-600 hover:bg-[#0f1422]'
                )}
              >
                {/* Image Preview */}
                <div className="relative w-full h-28 rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                  <img
                    src={sample.imageUrl}
                    alt={sample.classification}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={clsx(
                      'px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase shadow',
                      isCrit ? 'bg-red-600 text-white' : (isWarn ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white')
                    )}>
                      {sample.severity}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors font-mono">
                    {sample.defectType} ({sample.linkedJointId})
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {sample.classification}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/80 mt-1">
                    <span>{sample.sector}</span>
                    <span className="text-cyan-400 font-bold">Conf: {Math.round(sample.confidence * 100)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-2 border-t border-[#1f293d]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold rounded-lg"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
