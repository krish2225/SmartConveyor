import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../shared/StatusBadge.jsx';
import { triggerFacilityEmergencyStop } from '../../firebase/firestore.js';
import {
  AlertOctagon,
  Wrench,
  Cpu,
  Ruler,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Send,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import clsx from 'clsx';

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
      <div className="bg-[#111726] border border-[#1f293d] rounded-2xl p-5 flex flex-col justify-between h-full space-y-4 shadow-xl">
        
        <div className="space-y-4">
          
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-[#1f293d] pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-cyan-950/80 border border-cyan-500/40 rounded-lg text-cyan-400">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide">Analysis Results</h3>
            </div>
            <StatusBadge status={activeScan?.severity || 'CRITICAL'} />
          </div>

          {/* 1. STATUS Headline */}
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-400">
              STATUS
            </div>
            <div className={clsx(
              'text-lg font-black tracking-tight',
              isCritical ? 'text-red-400' : (isWarning ? 'text-amber-400' : 'text-emerald-400')
            )}>
              {activeScan?.classification || 'CRITICAL - Splice Joint Delamination'}
            </div>
          </div>

          {/* 2. CONFIDENCE Progress Bar */}
          <div className="space-y-1.5 p-3 bg-[#0a0d14] border border-[#1f293d] rounded-xl">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-semibold">CONFIDENCE</span>
              <span className={clsx('font-bold', isCritical ? 'text-red-400' : 'text-cyan-400')}>
                {confidencePct}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-500',
                  isCritical ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                )}
                style={{ width: `${confidencePct}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-slate-500 flex justify-between">
              <span>YOLOv8-nano Classifier</span>
              <span>Model Ver: 2.4.1</span>
            </div>
          </div>

          {/* 3. AFFECTED COMPONENT Box with LOCATE Button */}
          <div className="p-3 bg-[#0a0d14] border border-[#1f293d] rounded-xl space-y-2">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
              AFFECTED COMPONENT
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate font-mono">
                  {linkedJointId}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {linkedJointName}
                </div>
              </div>

              <button
                onClick={handleNavigateToDigitalTwin}
                className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 shrink-0 shadow-sm"
              >
                <MapPin className="w-3.5 h-3.5" />
                Locate
              </button>
            </div>
          </div>

          {/* 4. DEFECT PARAMETERS Card */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
              Defect Parameters
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              
              {/* Length (est) */}
              <div className="p-2.5 bg-[#0a0d14] border border-[#1f293d] rounded-lg">
                <div className="flex items-center gap-1 text-slate-400 text-[10px] font-mono">
                  <Ruler className="w-3 h-3 text-cyan-400" />
                  Length (est)
                </div>
                <div className="text-sm font-bold font-mono text-white mt-1">
                  {params.lengthMm || params.crackLengthMm || 1180} mm
                </div>
              </div>

              {/* Width (max) */}
              <div className="p-2.5 bg-[#0a0d14] border border-[#1f293d] rounded-lg">
                <div className="flex items-center gap-1 text-slate-400 text-[10px] font-mono">
                  <Ruler className="w-3 h-3 text-cyan-400" />
                  Width (max)
                </div>
                <div className="text-sm font-bold font-mono text-white mt-1">
                  {params.widthMm || params.tearWidthMm || 54} mm
                </div>
              </div>

              {/* Depth (est) */}
              <div className="p-2.5 bg-[#0a0d14] border border-[#1f293d] rounded-lg">
                <div className="flex items-center gap-1 text-slate-400 text-[10px] font-mono">
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  Depth (est)
                </div>
                <div className="text-sm font-bold font-mono text-amber-300 mt-1">
                  {params.depthMm || 14.8} mm
                </div>
              </div>

              {/* Growth Rate (%/hr) */}
              <div className="p-2.5 bg-[#0a0d14] border border-[#1f293d] rounded-lg">
                <div className="flex items-center gap-1 text-slate-400 text-[10px] font-mono">
                  <TrendingUp className="w-3 h-3 text-red-400" />
                  Growth Rate
                </div>
                <div className="text-sm font-bold font-mono text-red-400 mt-1">
                  +{params.growthRatePctHr || 8.4} %/hr
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* 5. Action Buttons: Initiate Emergency Stop (Full Width Red) & Log Maintenance Ticket */}
        <div className="space-y-2 pt-3 border-t border-[#1f293d]">
          <button
            onClick={handleTriggerEmergencyStop}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 border border-red-400 uppercase tracking-wider"
          >
            <AlertOctagon className="w-4 h-4 animate-bounce" />
            Initiate Emergency Stop
          </button>

          <button
            onClick={() => setShowTicketModal(true)}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <Wrench className="w-4 h-4 text-cyan-400" />
            Log Maintenance Ticket
          </button>
        </div>

      </div>

      {/* Log Maintenance Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#111726] border border-cyan-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            {ticketLogged ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">Maintenance Ticket Dispatched</h3>
                <p className="text-xs text-slate-300 font-mono">
                  Ticket #WO-2026-9812 assigned to Mechanical Crew Alpha.
                </p>
              </div>
            ) : (
              <form onSubmit={handleLogTicket} className="space-y-4">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Wrench className="w-5 h-5" />
                  <h3 className="text-base font-bold text-white">Dispatch Splice Repair Order</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Target Component:</label>
                    <input
                      type="text"
                      disabled
                      value={`${facilityId.toUpperCase()} | ${linkedJointName}`}
                      className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-slate-400 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Work Order Priority:</label>
                    <select
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value)}
                      className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="P1 - Urgent Vulcanizing Overhaul (< 24h)">P1 - Urgent Vulcanizing Overhaul (&lt; 24h)</option>
                      <option value="P2 - Next Shift Inspection">P2 - Next Shift Inspection</option>
                      <option value="P3 - Routine Cold Patch">P3 - Routine Cold Patch</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Diagnostic Notes:</label>
                    <textarea
                      rows={3}
                      value={ticketNotes}
                      onChange={(e) => setTicketNotes(e.target.value)}
                      className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg p-2.5 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1f293d]">
                  <button
                    type="button"
                    onClick={() => setShowTicketModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Dispatch Ticket
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
