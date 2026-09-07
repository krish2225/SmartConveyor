import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PlantSelector from './PlantSelector.jsx';
import { triggerFacilityEmergencyStop } from '../../firebase/firestore.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
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
  LogOut,
  Cpu,
  Menu,
  Sun,
  Moon,
  Boxes,
  Palette,
  Radio
} from 'lucide-react';

export default function Navbar({
  activeFacilityId,
  onSelectFacility,
  currentUser,
  onLogout,
  emergencyStatus,
  onToggleSidebar
}) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
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

  const cycleTheme = () => {
    if (theme === 'industrial') setTheme('dark');
    else if (theme === 'dark') setTheme('light');
    else setTheme('industrial');
  };

  return (
    <>
      <header className="bg-surface/95 backdrop-blur-md border-b border-border px-4 sm:px-6 lg:px-8 py-2.5 sticky top-0 z-40 select-none shadow-sm transition-colors w-full">
        <div className="flex items-center justify-between gap-4 w-full">
          
          {/* Left: Mobile Toggle & Industrial Brand + Plant Selector */}
          <div className="flex items-center gap-4 shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleSidebar}
              className="lg:hidden text-muted-foreground hover:text-foreground h-8 w-8"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-4 h-4" />
            </Button>

            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-all shadow-xs">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm sm:text-base tracking-tight text-foreground">
                    Smart<span className="text-cyan-400">Conveyor</span>
                  </span>
                  <Badge variant="cyan" size="sm" className="hidden sm:inline-flex text-[9px] py-0 px-1.5 font-mono">
                    CB_001
                  </Badge>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono tracking-wider truncate">
                  NMDC BAILADILA IRON ORE MINES
                </div>
              </div>
            </Link>

            <div className="hidden xl:block pl-2 border-l border-border">
              <PlantSelector
                activeFacilityId={activeFacilityId}
                onSelectFacility={onSelectFacility}
              />
            </div>
          </div>

          {/* Center: Plant Selector (for md/lg) + Live IoT Status + Quick Nav Links */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            <div className="xl:hidden">
              <PlantSelector
                activeFacilityId={activeFacilityId}
                onSelectFacility={onSelectFacility}
              />
            </div>

            <div className="flex items-center gap-2 px-3 py-1 bg-surface-sunken border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-400 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold">IoT LIVE (ESP32 • 20Hz)</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/sensor-health')}
              className="gap-1.5 text-xs font-mono h-8 px-3 border-border hover:border-cyan-500/40 text-foreground hover:text-cyan-400 hover:bg-cyan-500/10"
              title="Inspect Transducer Health & Reliability Scores"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sensor Health</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/digital-twin')}
              className="gap-1.5 text-xs font-mono h-8 px-3 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>3D Digital Twin</span>
            </Button>
          </div>

          {/* Right: Theme Switcher, Emergency Stop, User Info & Logout */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={cycleTheme}
              title={`Active Theme: ${theme.toUpperCase()} (Click to toggle)`}
              className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-lg border border-border"
            >
              {theme === 'industrial' ? (
                <Palette className="w-4 h-4 text-cyan-400" />
              ) : theme === 'dark' ? (
                <Moon className="w-4 h-4 text-sky-300" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </Button>

            {/* Emergency Stop Button */}
            {!emergencyStatus?.emergencyStopActive && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowStopModal(true)}
                className="gap-1.5 font-mono font-bold uppercase tracking-wider text-[11px] px-3.5 h-8 shadow-sm border border-red-500/40"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">EMERGENCY STOP</span>
                <span className="sm:hidden">E-STOP</span>
              </Button>
            )}

            {/* Current User Pill */}
            <div className="flex items-center gap-2.5 sm:gap-3 pl-2.5 sm:pl-4 border-l border-border">
              <div className="hidden lg:block text-right min-w-0 max-w-[150px] xl:max-w-[200px]">
                <div className="text-xs font-bold text-foreground truncate" title={currentUser?.displayName}>
                  {currentUser?.displayName || 'Control Operator'}
                </div>
                <div className="text-[10px] font-mono text-cyan-400 truncate font-semibold">
                  {currentUser?.role?.replace('_', ' ') || 'OPERATOR'}
                </div>
              </div>

              <div 
                className="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-xs shrink-0 shadow-xs cursor-default"
                title={`${currentUser?.displayName || 'Operator'} (${currentUser?.role || 'Staff'})`}
              >
                {currentUser?.avatar || '👷‍♂️'}
              </div>

              {onLogout && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onLogout}
                  title="Logout / Switch User"
                  className="text-muted-foreground hover:text-red-400 h-8 w-8"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* Emergency Stop Confirmation Modal */}
      <Dialog open={showStopModal} onOpenChange={setShowStopModal}>
        <DialogContent className="max-w-md bg-surface border-red-500/80">
          <DialogHeader>
            <div className="flex items-center gap-2.5 text-destructive mb-1">
              <div className="p-2 bg-red-950/80 rounded-md border border-red-500/50">
                <AlertOctagon className="w-6 h-6 text-red-500 animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground uppercase tracking-wide">
                  Initiate Emergency Stop
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground font-mono">
                  Halts conveyor motor drives across all substations immediately.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-xs font-semibold text-foreground">
              Reason for Emergency Interlock:
            </Label>
            <select
              value={stopReason}
              onChange={(e) => setStopReason(e.target.value)}
              className="w-full bg-surface-sunken border border-border rounded-md px-3 py-2 text-xs text-foreground focus:border-red-500 focus:outline-none font-mono"
            >
              <option value="Critical Splice Joint Rupture Detected">Critical Splice Joint Rupture Detected</option>
              <option value="Longitudinal Belt Rip / Steel Cord Penetration">Longitudinal Belt Rip / Steel Cord Penetration</option>
              <option value="Drive Pulley Thermal Hotspot Overheat (>85°C)">Drive Pulley Thermal Hotspot Overheat (&gt;85°C)</option>
              <option value="Hopper Chute Severe Material Jam / Overload">Hopper Chute Severe Material Jam / Overload</option>
              <option value="Manual Operator Precautionary Stop">Manual Operator Precautionary Stop</option>
            </select>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowStopModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleTriggerEStop}
              disabled={isSubmitting}
              className="gap-1.5 font-bold uppercase"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              {isSubmitting ? 'Halting Line...' : 'CONFIRM EMERGENCY HALT'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
