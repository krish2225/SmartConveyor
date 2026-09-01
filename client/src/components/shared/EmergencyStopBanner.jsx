import React, { useState } from 'react';
import { AlertOctagon, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';
import { clearFacilityEmergencyStop } from '../../firebase/firestore.js';

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
      <div className="w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-b-2 border-red-500 text-white px-4 py-2.5 sticky top-0 z-50 shadow-2xl shadow-red-950/60 animate-pulse">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm">
          
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-red-600 rounded-lg text-white animate-bounce">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-bold tracking-wider text-red-100 uppercase">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                EMERGENCY STOP ACTIVE — CONVEYOR HALTED
              </div>
              <div className="text-red-200 text-xs mt-0.5">
                Reason: <span className="font-semibold text-white">{emergencyStatus.reason || 'Splice Joint Rupture Hazard'}</span> | 
                Triggered By: <span className="font-semibold text-white">{emergencyStatus.triggeredBy || 'Control Operator'}</span> | 
                Time: <span className="font-mono text-red-100">{emergencyStatus.triggeredAt ? new Date(emergencyStatus.triggeredAt).toLocaleTimeString() : 'Just now'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowClearModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg shadow-lg transition-all border border-emerald-400 uppercase tracking-wide hover:scale-105"
            >
              <ShieldCheck className="w-4 h-4" />
              Clear E-Stop &amp; Resume Line
            </button>
          </div>

        </div>
      </div>

      {/* Quick E-Stop Reset Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#111726] border-2 border-emerald-500/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="p-2.5 bg-emerald-950/80 rounded-xl border border-emerald-500/50">
                <ShieldCheck className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Clear Emergency Stop Interlock
                </h3>
                <p className="text-xs text-slate-300 font-mono">
                  Resume conveyor line CV-101 motor drives
                </p>
              </div>
            </div>

            <form onSubmit={handleClearStop} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Safety Inspection Remarks:
                </label>
                <textarea
                  rows={2}
                  required
                  value={clearNote}
                  onChange={(e) => setClearNote(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-xl p-3 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1f293d]">
                <button
                  type="button"
                  onClick={() => setShowClearModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isClearing}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  {isClearing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {isClearing ? 'Resuming Line...' : 'Authorize & Clear E-Stop'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}
