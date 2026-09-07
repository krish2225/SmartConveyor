import React from 'react';
import { Badge } from '../ui/badge.jsx';
import { cn } from '../../lib/utils.js';

export default function StatusBadge({ status, label, size = 'sm', className = '' }) {
  const getVariant = () => {
    switch (status?.toUpperCase()) {
      case 'CRITICAL':
      case 'CRITICAL_DELAMINATION':
      case 'FAULTY':
      case 'ACTIVE':
        return 'critical';
      case 'WARNING':
      case 'ELEVATED_WEAR':
      case 'DEGRADED':
      case 'ACKNOWLEDGED':
        return 'warning';
      case 'OPTIMAL':
      case 'HEALTHY':
      case 'RESOLVED':
      case 'NOMINAL':
        return 'nominal';
      case 'INFO':
      default:
        return 'cyan';
    }
  };

  const displayText = label || status?.replace(/_/g, ' ') || 'NOMINAL';

  return (
    <Badge
      variant={getVariant()}
      size={size === 'xs' ? 'sm' : 'default'}
      className={cn('inline-flex items-center gap-1.5 font-mono tracking-wider', className)}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
      <span>{displayText}</span>
    </Badge>
  );
}
