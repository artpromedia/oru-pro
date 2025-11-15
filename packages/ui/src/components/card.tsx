import * as React from "react";
import { cn } from "../utils.js";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ elevated = true, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-slate-900/10 bg-white/90 p-6 backdrop-blur",
      elevated && "shadow-lg shadow-emerald-950/5",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";
