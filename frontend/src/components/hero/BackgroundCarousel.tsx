"use client";

import React, { useEffect, useState, useRef } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const CAROUSEL_FRAMES = [
  "/background-carousel/frame_0001.jpg",
  "/background-carousel/frame_0002.jpg",
  "/background-carousel/frame_0003.jpg",
  "/background-carousel/frame_0004.jpg",
  "/background-carousel/frame_0005.jpg",
  "/background-carousel/frame_0006.jpg",
  "/background-carousel/frame_0007.jpg",
  "/background-carousel/frame_0008.jpg",
  "/background-carousel/frame_0009.jpg",
  "/background-carousel/frame_0010.jpg",
  "/background-carousel/frame_0011.jpg",
  "/background-carousel/frame_0012.jpg",
  "/background-carousel/frame_0013.jpg",
  "/background-carousel/frame_0014.jpg",
  "/background-carousel/frame_0015.jpg",
  "/background-carousel/frame_0016.jpg",
  "/background-carousel/frame_0017.jpg",
  "/background-carousel/frame_0018.jpg",
  "/background-carousel/frame_0019.jpg",
  "/background-carousel/frame_0020.jpg",
];

interface BackgroundCarouselProps {
  interval?: number; // Duration each frame displays (default: 500ms = 0.5s)
  transitionDuration?: number; // Crossfade transition duration (default: 250ms)
  showControls?: boolean; // Show playback and frame status pill
  showOverlay?: boolean; // Show editorial atmosphere blend overlay
  className?: string;
  onFrameChange?: (index: number) => void;
}

export default function BackgroundCarousel({
  interval = 500,
  transitionDuration = 250,
  showControls = true,
  showOverlay = true,
  className,
  onFrameChange,
}: BackgroundCarouselProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isOverlayActive, setIsOverlayActive] = useState(showOverlay);
  const [isLoaded, setIsLoaded] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Preload all 20 frames into browser memory on mount
  useEffect(() => {
    let loadedCount = 0;
    CAROUSEL_FRAMES.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        if (loadedCount >= Math.min(5, CAROUSEL_FRAMES.length)) {
          setIsLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount >= CAROUSEL_FRAMES.length) {
          setIsLoaded(true);
        }
      };
    });
  }, []);

  // 2. Auto-playing loop advancing every 0.5 seconds (500ms)
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentFrame((prev) => {
        const next = (prev + 1) % CAROUSEL_FRAMES.length;
        if (onFrameChange) onFrameChange(next);
        return next;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, interval, onFrameChange]);

  const handleNext = () => {
    setCurrentFrame((prev) => (prev + 1) % CAROUSEL_FRAMES.length);
  };

  const handlePrev = () => {
    setCurrentFrame((prev) => (prev - 1 + CAROUSEL_FRAMES.length) % CAROUSEL_FRAMES.length);
  };

  return (
    <div
      className={cn(
        "absolute inset-0 w-full h-full overflow-hidden select-none",
        className
      )}
      aria-label="Isometric zero-gravity collaborative workspace animated slideshow"
    >
      {/* 20 Image Frames with Hardware-Accelerated Smooth Crossfade */}
      <div className="relative w-full h-full">
        {CAROUSEL_FRAMES.map((src, index) => {
          const isActive = index === currentFrame;
          return (
            <div
              key={src}
              className={cn(
                "absolute inset-0 w-full h-full will-change-[opacity] transform-gpu pointer-events-none",
                isActive ? "opacity-100 z-10" : "opacity-0 z-0"
              )}
              style={{
                transitionProperty: "opacity",
                transitionDuration: `${transitionDuration}ms`,
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <img
                src={src}
                alt={`Workspace isometric animation frame ${index + 1}`}
                className="w-full h-full object-cover object-center scale-[1.02]"
                loading="eager"
                decoding="async"
              />
            </div>
          );
        })}
      </div>

      {/* Atmospheric Editorial Overlay (Blends beautifully with Paper #F2EFE6 theme) */}
      {isOverlayActive && (
        <>
          {/* Subtle top-to-bottom soft vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-paper/80 via-paper/55 to-paper pointer-events-none z-10" />

          {/* Radial soft glow emphasizing central collaborative nodes */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(242,239,230,0.3)_0%,rgba(242,239,230,0.85)_80%)] pointer-events-none z-10" />

          {/* Bottom seamless blend into next sections */}
          <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-paper via-paper/90 to-transparent pointer-events-none z-10" />
        </>
      )}

      {/* Interactive Control Pill & Telemetry (Restrained, Editorial & Developer-Focused) */}
      {showControls && (
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-editor/90 backdrop-blur-md border border-divider text-carbon text-xs shadow-md font-mono">
            <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
            <span className="font-semibold text-carbon">
              Frame {String(currentFrame + 1).padStart(2, "0")}/{CAROUSEL_FRAMES.length}
            </span>
            <span className="text-muted">•</span>
            <span className="text-muted text-[11px]">0.5s Cycle</span>

            {/* Play / Pause Toggle */}
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="ml-1 p-1 rounded-md text-carbon hover:bg-paper hover:text-coral transition-all duration-140"
              title={isPlaying ? "Pause auto-playing slideshow" : "Resume auto-playing slideshow"}
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-coral" />}
            </button>

            {/* Step Backward / Forward */}
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 rounded-md text-muted hover:text-carbon hover:bg-paper transition"
              title="Previous frame"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 rounded-md text-muted hover:text-carbon hover:bg-paper transition"
              title="Next frame"
            >
              <ChevronRight className="w-3 h-3" />
            </button>

            {/* Toggle Overlay Visibility */}
            <button
              type="button"
              onClick={() => setIsOverlayActive((o) => !o)}
              className="ml-0.5 p-1 rounded-md text-muted hover:text-carbon hover:bg-paper transition"
              title={isOverlayActive ? "Hide overlay (View raw isometric render)" : "Enable editorial text overlay"}
            >
              {isOverlayActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-coral" />}
            </button>
          </div>
        </div>
      )}

      {/* Frame Scrubber Bar at Bottom Edge */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-divider/30 z-20 flex">
        {CAROUSEL_FRAMES.map((_, i) => (
          <div
            key={i}
            onClick={() => setCurrentFrame(i)}
            className={cn(
              "flex-1 h-full cursor-pointer transition-colors duration-150",
              i === currentFrame
                ? "bg-coral shadow-xs"
                : i < currentFrame
                ? "bg-divider"
                : "bg-transparent"
            )}
            title={`Jump to frame ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
