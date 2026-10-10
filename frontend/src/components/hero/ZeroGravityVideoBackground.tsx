"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Play, Pause, Activity } from "lucide-react";

interface Ripple {
  id: number;
  x: number;
  y: number;
  color: string;
}

export default function ZeroGravityVideoBackground() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.95; // Buttery smooth cinematic pacing
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback
      });
    }
  }, []);

  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const colors = ["#E65F42", "#00E5FF", "#D9E7D5", "#D8DDF5"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newRipple: Ripple = {
      id: Date.now() + Math.random(),
      x,
      y,
      color: randomColor,
    };

    setRipples((prev) => [...prev.slice(-6), newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 1800);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-auto select-none"
      aria-hidden="true"
    >
      {/* 1. Seamless High-Definition 60fps Video Element */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        poster="/images/zero-gravity-hero.jpg"
        className="w-full h-full object-cover object-center scale-105 motion-safe:animate-subtle-drift transition-transform duration-1000 ease-out"
      >
        <source src="/videos/zero-gravity-bg.webm" type="video/webm" />
        {/* Fallback image in case video is unsupported */}
        <img
          src="/images/zero-gravity-hero.jpg"
          alt="Zero-gravity futuristic digital workspace in isometric perspective"
          className="w-full h-full object-cover"
        />
      </video>

      {/* 2. Studio Lighting & Gradient Atmosphere Overlays */}
      {/* Deep vignette focusing user gaze towards hero center */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#181B17]/60 via-transparent to-[#181B17]/90 pointer-events-none" />

      {/* Soft Radial glow enhancing isometric data nodes */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(230,95,66,0.12)_0%,rgba(0,229,255,0.08)_40%,transparent_75%)] pointer-events-none" />

      {/* Editorial paper tone blend at the bottom */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-paper via-paper/60 to-transparent pointer-events-none" />

      {/* 3. Interactive Floating Luminous Ripples triggered by user interaction */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-ripple-expand"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            borderColor: ripple.color,
            boxShadow: `0 0 24px ${ripple.color}`,
          }}
        />
      ))}

      {/* 4. Interactive Cursor Node Follower */}
      {mousePos && (
        <div
          className="absolute pointer-events-none transition-transform duration-75 ease-out -translate-x-1/2 -translate-y-1/2 hidden md:block"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
          }}
        >
          <div className="relative">
            {/* Luminous aura */}
            <div className="w-8 h-8 rounded-full bg-coral/20 blur-sm animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-coral shadow-[0_0_8px_#E65F42]" />
            <div className="absolute top-4 left-4 px-2 py-0.5 rounded bg-carbon/90 border border-coral/40 text-[10px] font-mono text-paper whitespace-nowrap shadow-md">
              You • Gravity 0.0g
            </div>
          </div>
        </div>
      )}

      {/* 5. Ambient HUD Status & Playback Controls in Bottom Left/Right */}
      <div className="absolute bottom-6 left-6 z-20 hidden sm:flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-carbon/80 backdrop-blur-md border border-divider/40 text-paper text-xs shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#5bb062] animate-ping" />
          <span className="font-mono text-[11px] text-paper">Zero-G Engine Active</span>
          <span className="text-muted">•</span>
          <span className="font-mono text-[10px] text-coral">60 FPS Flow</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePlayback();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-carbon/70 hover:bg-carbon backdrop-blur-md border border-divider/40 text-paper/80 hover:text-paper text-xs transition shadow-md"
          title={isPlaying ? "Pause ambient video" : "Play ambient video"}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3 h-3 text-coral" />
              <span className="text-[10px] font-mono">Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 text-[#5bb062]" />
              <span className="text-[10px] font-mono">Resume</span>
            </>
          )}
        </button>
      </div>

      <div className="absolute bottom-6 right-6 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-carbon/80 backdrop-blur-md border border-divider/40 text-paper text-xs shadow-lg">
        <Activity className="w-3.5 h-3.5 text-[#00E5FF]" />
        <span className="font-mono text-[11px] text-[#A0A59C]">Isometric Space:</span>
        <span className="font-mono text-[11px] text-paper font-bold">CRDT Mesh Synced</span>
      </div>
    </div>
  );
}
