import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils.js"

const alertVariants = cva(
  "relative w-full rounded-md border p-3.5 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-3.5 [&>svg]:top-3.5 text-xs shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-surface border-border text-foreground [&>svg]:text-cyan-400",
        destructive:
          "border-red-500/50 bg-red-950/20 text-red-300 [&>svg]:text-red-400 border-l-4 border-l-red-500",
        warning:
          "border-amber-500/50 bg-amber-950/20 text-amber-300 [&>svg]:text-amber-400 border-l-4 border-l-amber-500",
        nominal:
          "border-emerald-500/50 bg-emerald-950/20 text-emerald-300 [&>svg]:text-emerald-400 border-l-4 border-l-emerald-500",
        cyan:
          "border-cyan-500/40 bg-cyan-950/20 text-cyan-200 [&>svg]:text-cyan-400 border-l-4 border-l-cyan-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-bold leading-none tracking-tight text-foreground", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs [&_p]:leading-relaxed text-muted-foreground", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
