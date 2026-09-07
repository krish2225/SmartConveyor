import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils.js"

const badgeVariants = cva(
  "inline-flex items-center rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-ring select-none",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-primary/15 text-cyan-300 border-primary/30",
        secondary:
          "border border-border bg-surface-elevated text-slate-300",
        destructive:
          "border border-red-500/40 bg-red-950/60 text-red-400",
        outline:
          "border border-border text-foreground bg-transparent",
        nominal:
          "border border-emerald-500/40 bg-emerald-950/60 text-emerald-400",
        warning:
          "border border-amber-500/40 bg-amber-950/60 text-amber-400",
        critical:
          "border border-red-500/50 bg-red-950/70 text-red-400 animate-pulse",
        cyan:
          "border border-cyan-500/40 bg-cyan-950/60 text-cyan-300",
        sky:
          "border border-sky-500/40 bg-sky-950/60 text-sky-300",
      },
      size: {
        default: "px-2 py-0.5 text-[10px]",
        sm: "px-1.5 py-0.2 text-[9px]",
        lg: "px-2.5 py-1 text-xs",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({ className, variant, size, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
