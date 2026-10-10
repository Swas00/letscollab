"use client";

import React, { forwardRef } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "icon" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  withArrow?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      withArrow = false,
      icon,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5 h-8",
      md: "text-xs font-semibold px-4 py-2 rounded-xl gap-2 h-9",
      lg: "text-sm font-bold px-5 py-2.5 rounded-xl gap-2.5 h-11",
    };

    const variantClasses = {
      primary:
        "bg-coral text-white border border-[#d34628] shadow-sm hover:bg-[#d34628] hover:-translate-y-[1.5px] hover:shadow-md hover:shadow-coral/15 active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none",
      secondary:
        "bg-editor text-carbon border border-divider shadow-sm hover:bg-paper hover:border-muted hover:-translate-y-[1px] hover:shadow-sm active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0",
      ghost:
        "bg-transparent text-muted hover:text-carbon hover:bg-moss/40 hover:-translate-y-[0.5px] active:scale-[0.98] disabled:opacity-60",
      icon:
        "p-2 rounded-lg bg-transparent text-muted hover:text-carbon hover:bg-moss/50 hover:border-divider border border-transparent hover:-translate-y-[1px] active:scale-[0.95] disabled:opacity-50",
      danger:
        "bg-[#b0361e] text-white border border-[#8e2f1d] shadow-sm hover:bg-[#8e2f1d] hover:-translate-y-[1.5px] active:translate-y-0 active:scale-[0.98] disabled:opacity-60",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "group inline-flex items-center justify-center font-sans transition-all duration-150 ease-out select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2",
          variant !== "icon" && sizeClasses[size],
          variantClasses[variant],
          (disabled || isLoading) && "cursor-not-allowed pointer-events-none",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            {icon && <span className="shrink-0 transition-transform duration-150 group-hover:scale-105">{icon}</span>}
            {children}
            {withArrow && (
              <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-180 ease-out group-hover:translate-x-1" />
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
