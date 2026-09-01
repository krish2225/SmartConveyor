import React from 'react';
import clsx from 'clsx';

export default function StatusBadge({ status, label, size = 'sm', className = '' }) {
  const getStyle = () => {
    switch (status?.toUpperCase()) {
      case 'CRITICAL':
      case 'CRITICAL_DELAMINATION':
      case 'FAULTY':
      case 'ACTIVE':
        return 'bg-red-500/10 text-red-400 border-red-500/40';
      case 'WARNING':
      case 'ELEVATED_WEAR':
      case 'DEGRADED':
      case 'ACKNOWLEDGED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/40';
      case 'OPTIMAL':
      case 'HEALTHY':
      case 'RESOLVED':
      case 'NOMINAL':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40';
      case 'INFO':
      default:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40';
    }
  };

  const displayText = label || status?.replace(/_/g, ' ') || 'NOMINAL';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-mono uppercase tracking-wider font-semibold rounded-full border',
        size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        getStyle(),
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {displayText}
    </span>
  );
}
