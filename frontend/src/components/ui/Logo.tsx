"use client";

import React from "react";
import Link from "next/link";
import { cn } from "../../lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  withText?: boolean;
  subtitle?: string;
  badge?: string;
  href?: string;
  className?: string;
}

const SIZE_CONFIG = {
  sm: { icon: 26, box: "w-7 h-7 rounded-lg", text: "text-base", sub: "text-[10px]" },
  md: { icon: 34, box: "w-9 h-9 rounded-xl", text: "text-lg", sub: "text-[11px]" },
  lg: { icon: 42, box: "w-11 h-11 rounded-2xl", text: "text-2xl", sub: "text-xs" },
  xl: { icon: 54, box: "w-14 h-14 rounded-2xl", text: "text-3xl", sub: "text-sm" },
};

export function LogoIcon({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 transition-transform duration-200 group-hover:scale-105", className)}
    >
      <defs>
        {/* Signal Coral Core Gradient */}
        <linearGradient id="lc-coral-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF7A59" />
          <stop offset="0.55" stopColor="#E65F42" />
          <stop offset="1" stopColor="#C73E22" />
        </linearGradient>

        {/* Ambient Drop Glow */}
        <filter id="lc-glow" x="0" y="2" width="48" height="46" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#E65F42" floodOpacity="0.28" />
        </filter>

        {/* Highlight Gradient for Upper Edge */}
        <linearGradient id="lc-rim" x1="10" y1="4" x2="38" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Tactile Shield Container */}
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="12"
        fill="url(#lc-coral-grad)"
        filter="url(#lc-glow)"
      />
      <rect
        x="3.5"
        y="3.5"
        width="41"
        height="41"
        rx="11.5"
        stroke="url(#lc-rim)"
        strokeWidth="1"
      />

      {/* Collaborative Interlocking Nodes & Orbiting Arc */}
      {/* Node 1: Left collaborator circle */}
      <circle cx="18" cy="20" r="5" fill="#FFFFFF" fillOpacity="0.95" />
      
      {/* Node 2: Right collaborator circle */}
      <circle cx="30" cy="28" r="5" fill="#FFFFFF" fillOpacity="0.95" />

      {/* Dynamic Connecting Bridge (CRDT Synchronizer Vector) */}
      <path
        d="M19 22L29 26"
        stroke="#FFFFFF"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Outer Real-Time Sync Pulse Orbit */}
      <path
        d="M31 16C33.5 18 35 21 35 24.5C35 30.299 30.299 35 24.5 35C20.5 35 17 32.5 15.5 29"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="1 3"
        strokeOpacity="0.65"
      />

      {/* Top Pulse Node (Real-Time Live indicator) */}
      <circle cx="32" cy="15" r="2.5" fill="#D9E7D5" stroke="#232722" strokeWidth="0.8" />
    </svg>
  );
}

export function Logo({
  size = "md",
  withText = true,
  subtitle,
  badge,
  href,
  className,
}: LogoProps) {
  const cfg = SIZE_CONFIG[size];

  const content = (
    <div className={cn("inline-flex items-center gap-3 group select-none", className)}>
      <LogoIcon size={cfg.icon} />
      {withText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2">
            <span className={cn("font-black tracking-tight text-carbon group-hover:text-coral transition-colors duration-160", cfg.text)}>
              LetsCollab
            </span>
            {badge && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-moss border border-[#b5cea8] text-[#254622] font-semibold">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <span className={cn("text-muted block -mt-0.5 font-medium tracking-normal", cfg.sub)}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
