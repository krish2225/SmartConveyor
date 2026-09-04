import React from 'react';
import { NavLink } from 'react-router-dom';
import { useBackendStatus } from '../../hooks/useBackendStatus.js';
import {
  LayoutDashboard,
  Box,
  Camera,
  Activity,
  BellRing,
  FileText,
  Settings,
  ShieldCheck,
  Zap,
  Radio,
  Wifi,
  WifiOff
} from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar({
  isOpen,
  onClose,
  currentUser,
  alertsCount = 0
}) {
  const backend = useBackendStatus();

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'System Overview & ETTF'
    },
    {
      to: '/digital-twin',
      label: '3D Digital Twin',
      icon: Box,
      badge: '3D',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
      description: 'Interactive Belt & Splice Mesh'
    },
    {
      to: '/vision',
      label: 'Vision Monitoring',
      icon: Camera,
      badge: 'AI',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
      description: 'Line-Scan Surface Inspection'
    },
    {
      to: '/sensor-health',
      label: 'Sensor Health',
      icon: Activity,
      badge: null,
      description: 'Reliability Index & Jitter'
    },
    {
      to: '/alerts',
      label: 'Alerts Feed',
      icon: BellRing,
      badge: alertsCount > 0 ? String(alertsCount) : null,
      badgeColor: 'bg-red-500 text-white animate-pulse',
      description: 'Active & Acknowledged Events'
    },
    {
      to: '/logs',
      label: 'MongoDB Logs',
      icon: FileText,
      badge: 'MERN',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      description: 'System & Sensor Telemetry Logs'
    },
    {
      to: '/reports',
      label: 'Compliance Reports',
      icon: ShieldCheck,
      badge: null,
      description: 'Maintenance & Compliance Audit'
    },
    {
      to: '/settings',
      label: 'System Settings',
      icon: Settings,
      badge: currentUser?.role === 'SITE_ADMIN' ? 'ADMIN' : null,
      badgeColor: 'bg-cyan-950 text-cyan-400 border border-cyan-500/40',
      description: 'E-Stop Clearance & Thresholds'
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      <aside
        className={clsx(
          'fixed lg:sticky top-[57px] left-0 z-30 w-64 h-[calc(100vh-57px)] bg-[#0c101a] border-r border-[#1f293d] flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 overflow-y-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Plant Navigation
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group',
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border-l-4 border-cyan-400 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 hover:bg-[#111726]'
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0 transition-colors group-hover:text-cyan-400" />
                    <div>
                      <div className="font-semibold text-slate-200">{item.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal leading-tight">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={clsx(
                        'px-2 py-0.5 text-[10px] font-mono font-bold rounded-full shadow-sm',
                        item.badgeColor || 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Live MERN Backend Connection Status Card */}
        <div className={clsx(
          'p-3 m-3 rounded-xl text-xs space-y-2 border transition-all',
          backend.isOnline
            ? 'bg-[#111726] border-emerald-500/40 shadow-sm'
            : 'bg-red-950/20 border-red-500/40'
        )}>
          <div className="flex items-center justify-between gap-1 text-[11px] font-mono font-bold uppercase">
            <div className="flex items-center gap-1.5">
              {backend.isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-red-400 animate-bounce" />
              )}
              <span className={backend.isOnline ? 'text-emerald-400' : 'text-red-400'}>
                MERN BACKEND {backend.isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            {backend.isOnline && (
              <span className="text-[10px] text-emerald-400 font-bold font-mono">
                {backend.latencyMs}ms
              </span>
            )}
          </div>

          <div className="text-[10px] text-slate-300 leading-relaxed font-mono">
            {backend.isOnline ? (
              <span>Express API &amp; MongoDB active (port 5000). Live 20Hz Firebase sensor stream connected.</span>
            ) : (
              <span className="text-red-300">Express API offline on port 5000. Run <code>npm start</code> in <code>server/</code>.</span>
            )}
          </div>

          <div className="pt-1.5 border-t border-[#1f293d] flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>DB: {backend.dbConnected ? 'MongoDB (Active)' : 'Memory Fallback'}</span>
            <span className={backend.isOnline ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
              {backend.isOnline ? '100% Synced' : 'Disconnected'}
            </span>
          </div>
        </div>

      </aside>
    </>
  );
}
