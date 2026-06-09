import * as React from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  secondary: "bg-ink-900 text-white hover:bg-ink-800 shadow-sm",
  outline: "border border-slate-300 bg-white hover:bg-slate-50 text-ink-900",
  ghost: "hover:bg-slate-100 text-ink-900",
  destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-11 px-5 text-sm rounded-xl",
};

export function buttonClassName({
  variant = "default",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", size = "md", ...props },
  ref,
) {
  return <button ref={ref} className={buttonClassName({ variant, size, className })} {...props} />;
});

Button.displayName = "Button";
