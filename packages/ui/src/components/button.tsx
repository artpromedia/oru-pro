import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils.js";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-400",
        secondary: "bg-slate-900/5 text-slate-900 hover:bg-slate-900/10 focus-visible:ring-slate-400",
        ghost: "bg-transparent text-slate-900 hover:bg-slate-900/10 focus-visible:ring-slate-200",
        danger: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300"
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    isLoading?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : children}
    </button>
  )
);
Button.displayName = "Button";
