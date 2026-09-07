import React from 'react';
import { NavLink } from 'react-router-dom';
import { useBackendStatus } from '../../hooks/useBackendStatus.js';
import { Badge } from '../ui/badge.jsx';
import {
  LayoutDashboard,
  Box,
  Camera,
  Activity,
  BellRing,
  FileText,
  Settings,
  ShieldCheck,
  Wifi,
  WifiOff,
  Radio
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

export default function Sidebar({
  isOpen,
  onClose,
  currentUser,
  activeAlertCount = 0
}) {
  const backend = useBackendStatus();

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'Overview & 3D Spatial Twin'
    },
    {
      to: '/digital-twin',
      label: '3D Digital Twin',
      icon: Box,
      badge: '3D',
      badgeVariant: 'cyan',
      description: 'Interactive Splice Raycaster'
    },
    {
      to: '/vision',
      label: 'Vision Monitoring',
      icon: Camera,
      badge: 'AI',
      badgeVariant: 'cyan',
      description: 'Surface Defect Inspection'
    },
    {
      to: '/sensor-health',
      label: 'Sensor Health',
      icon: Activity,
      badge: null,
      description: 'Transducer Reliability'
    },
    {
      to: '/alerts',
      label: 'Alerts Feed',
      icon: BellRing,
      badge: activeAlertCount > 0 ? String(activeAlertCount) : null,
      badgeVariant: activeAlertCount > 0 ? 'critical' : 'nominal',
      description: 'Incident Management'
    },
    {
      to: '/logs',
      label: 'MongoDB Logs',
      icon: FileText,
      badge: 'MERN',
      badgeVariant: 'nominal',
      description: 'Historical Audit Stream'
    },
    {
      to: '/reports',
      label: 'Compliance Reports',
      icon: ShieldCheck,
      badge: null,
      description: 'ISO 10816 Audit Exports'
    },
    {
      to: '/settings',
      label: 'System Settings',
      icon: Settings,
      badge: currentUser?.role === 'SITE_ADMIN' ? 'ADMIN' : null,
      badgeVariant: 'default',
      description: 'Thresholds & Interlocks'
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-[49px] left-0 z-30 w-64 h-[calc(100vh-49px)] bg-surface border-r border-border flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 select-none overflow-y-auto shadow-xs',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-3 space-y-1.5">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold flex items-center justify-between">
            <span>Plant Console</span>
            <Radio className="w-3 h-3 text-primary animate-pulse" />
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
                    cn(
                      'flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative border',
                      isActive
                        ? 'bg-primary/10 text-primary border-primary/30 font-semibold shadow-xs'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/70'
                    )
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4.5 h-4.5 shrink-0 transition-colors group-hover:text-primary text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight truncate">{item.label}</div>
                      <div className="text-[10px] text-muted-foreground font-normal leading-none mt-0.5 truncate">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <Badge
                      variant={item.badgeVariant || 'default'}
                      size="sm"
                      className="ml-auto shrink-0 text-[9px] px-1.5 font-mono"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Live MERN Backend Connection Status Card */}
        <div className={cn(
          'p-3 m-3 rounded-lg text-xs space-y-1.5 border transition-all shadow-xs',
          backend.isOnline
            ? 'bg-surface-sunken/80 border-emerald-500/30'
            : 'bg-red-50 dark:bg-red-950/20 border-red-500/40'
        )}>
          <div className="flex items-center justify-between gap-1 text-[10px] font-mono font-bold uppercase">
            <div className="flex items-center gap-1.5">
              {backend.isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-red-500 animate-bounce" />
              )}
              <span className={backend.isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                MERN CORE {backend.isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            {backend.isOnline && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                {backend.latencyMs}ms
              </span>
            )}
          </div>

          <div className="text-[10px] text-muted-foreground leading-tight font-mono">
            {backend.isOnline ? (
              <span>Express API &amp; MongoDB active (5000). 20Hz telemetry.</span>
            ) : (
              <span className="text-red-500">Express API offline on port 5000.</span>
            )}
          </div>

          <div className="pt-1.5 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>DB: {backend.dbConnected ? 'MongoDB' : 'Memory Store'}</span>
            <span className={backend.isOnline ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-500 font-bold'}>
              {backend.isOnline ? '100% Synced' : 'Disconnected'}
            </span>
          </div>
        </div>

      </aside>
    </>
  );
}
