import React from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Boxes,
  Camera,
  HeartPulse,
  BellRing,
  FileSpreadsheet,
  Settings,
  Shield,
  Zap,
  Info
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose, activeAlertCount = 0, currentUser }) {
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
      icon: Boxes,
      badge: '3D',
      description: 'Interactive Belt & Splice Mesh'
    },
    {
      to: '/vision',
      label: 'Vision Monitoring',
      icon: Camera,
      badge: 'AI',
      description: 'Line-Scan Surface Inspection'
    },
    {
      to: '/sensor-health',
      label: 'Sensor Health',
      icon: HeartPulse,
      badge: null,
      description: 'Reliability Index & Jitter'
    },
    {
      to: '/alerts',
      label: 'Alerts Feed',
      icon: BellRing,
      badge: activeAlertCount > 0 ? activeAlertCount : null,
      badgeColor: 'bg-red-500 text-white',
      description: 'Active & Acknowledged Events'
    },
    {
      to: '/reports',
      label: 'Reports & Logs',
      icon: FileSpreadsheet,
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

        {/* Bottom Hardware Info Card */}
        <div className="p-3 m-3 bg-[#111726] border border-[#1f293d] rounded-xl text-xs space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-[11px] font-bold uppercase">
            <Zap className="w-3.5 h-3.5" />
            Edge Inference Node
          </div>
          <div className="text-[11px] text-slate-300 leading-relaxed">
            FastAPI microservice connected. Isolation Forest &amp; XGBoost RUL active.
          </div>
          <div className="pt-2 border-t border-[#1f293d] flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Sampling: 20Hz</span>
            <span className="text-emerald-400 font-semibold">100% Synced</span>
          </div>
        </div>
      </aside>
    </>
  );
}
