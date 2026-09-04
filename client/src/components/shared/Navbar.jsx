import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PlantSelector from './PlantSelector.jsx';
import { triggerFacilityEmergencyStop } from '../../firebase/firestore.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import {
  Activity,
  AlertOctagon,
  ShieldAlert,
  Radio,
  User,
  LogOut,
  Cpu,
  Clock,
  Flame,
  Layers
} from 'lucide-react';

export default function Navbar({
  activeFacilityId,
  onSelectFacility,
  currentUser,
  onLogout,
  emergencyStatus,
  onToggleSidebar
}) {
  const { theme, isHematite, toggleTheme } = useTheme();
  const [showStopModal, setShowStopModal] = useState(false);
  const [stopReason, setStopReason] = useState('Critical Splice Joint Rupture Detected');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTriggerEStop = async () => {
    setIsSubmitting(true);
    try {
      await triggerFacilityEmergencyStop(activeFacilityId, currentUser, stopReason);
      setShowStopModal(false);
    } catch (err) {
      console.error('Failed to trigger emergency stop:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="bg-[#0c101a] border-b border-[#1f293d] px-4 py-2.5 sticky top-0 z-40 transition-colors duration-200">
        <div className="flex items-center justify-between gap-4">
          
          {/* Left: Mobile Menu Toggle & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Cpu className="w-5 h-5 text-slate-950 font-black" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm md:text-base tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-amber-100 bg-clip-text text-transparent">
                    SmartConveyor
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/30 text-amber-400 font-semibold hidden sm:inline-block">
                    SIH-26008
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono tracking-wider">
                  NMDC BAILADILA IRON ORE MINES
                </div>
              </div>
            </Link>
          </div>

          {/* Center: Plant Selector & Live Status Pill */}
          <div className="hidden md:flex items-center gap-3">
            <PlantSelector
              activeFacilityId={activeFacilityId}
              onSelectFacility={onSelectFacility}
            />

            <div className="flex items-center gap-2 px-2.5 py-1 bg-[#111726] border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE FIREBASE IoT • MONGODB LOGS</span>
            </div>
          </div>

          {/* Right: Theme Toggle, Quick Emergency Stop & Profile */}
          <div className="flex items-center gap-3">
            
            {/* Theme Toggle Button (Hematite Ore Forge <-> Obsidian Dark) */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111726] hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-[#1f293d] hover:border-amber-500/50 transition-all shadow-sm text-xs font-mono font-bold"
              title={isHematite ? "Switch to Obsidian Dark Mode" : "Switch to Hematite Ore Forge Mode"}
              aria-label="Toggle theme mode"
            >
              {isHematite ? (
                <>
                  <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="hidden sm:inline text-amber-300">HEMATITE</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline text-slate-300">OBSIDIAN</span>
                </>
              )}
            </button>

            {/* Quick Emergency Stop Button */}
            {!emergencyStatus?.emergencyStopActive && (
              <button
                onClick={() => setShowStopModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs rounded-lg shadow-lg shadow-red-600/25 transition-all hover:scale-105 border border-red-400"
              >
                <AlertOctagon className="w-4 h-4" />
                <span className="hidden sm:inline">EMERGENCY STOP</span>
              </button>
            )}

            {/* Current User Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden lg:block text-right">
                <div className="text-xs font-semibold text-slate-200">
                  {currentUser?.displayName || 'Control Operator'}
                </div>
                <div className="text-[10px] font-mono text-amber-400 font-medium">
                  {currentUser?.role?.replace('_', ' ') || 'OPERATOR'}
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm" title={currentUser?.displayName}>
                {currentUser?.avatar || '👷‍♂️'}
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Logout / Switch User"
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* Emergency Stop Confirmation Modal */}
      {showStopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#111726] border-2 border-red-500 rounded-xl max-w-md w-full p-6 shadow-2xl shadow-red-950 glow-border-red">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="p-3 bg-red-950/80 rounded-xl border border-red-500/50">
                <AlertOctagon className="w-8 h-8 text-red-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                  Initiate Emergency Stop
                </h3>
                <p className="text-xs text-red-300">
                  This action immediately halts conveyor line CV-101 motor drives across all substations.
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <label className="block text-xs font-semibold text-slate-300">
                Reason for Emergency Interlock:
              </label>
              <select
                value={stopReason}
                onChange={(e) => setStopReason(e.target.value)}
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-red-500 focus:outline-none"
              >
                <option value="Critical Splice Joint Rupture Detected">Critical Splice Joint Rupture Detected</option>
                <option value="Longitudinal Belt Rip / Steel Cord Penetration">Longitudinal Belt Rip / Steel Cord Penetration</option>
                <option value="Drive Pulley Thermal Hotspot Overheat (>85°C)">Drive Pulley Thermal Hotspot Overheat (&gt;85°C)</option>
                <option value="Hopper Chute Severe Material Jam / Overload">Hopper Chute Severe Material Jam / Overload</option>
                <option value="Manual Operator Precautionary Stop">Manual Operator Precautionary Stop</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowStopModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTriggerEStop}
                disabled={isSubmitting}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-red-600/40 transition-all flex items-center gap-1.5"
              >
                <AlertOctagon className="w-4 h-4" />
                {isSubmitting ? 'Halting Line...' : 'CONFIRM EMERGENCY HALT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
