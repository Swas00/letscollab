"use client";

import React, { useState } from "react";
import Link from "next/link";
import BackgroundCarousel, { CAROUSEL_FRAMES } from "@/components/hero/BackgroundCarousel";
import { ArrowLeft, Play, Pause, FastForward, Sliders, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function CarouselPage() {
  const [speed, setSpeed] = useState<number>(500); // 500ms = 0.5s
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  const [activeFrame, setActiveFrame] = useState<number>(0);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-paper text-carbon selection:bg-periwinkle font-sans">
      {/* Full-Screen Responsive 20-Frame Carousel Background */}
      <BackgroundCarousel
        interval={speed}
        transitionDuration={speed === 250 ? 150 : 250}
        showControls={true}
        showOverlay={showOverlay}
        onFrameChange={(idx) => setActiveFrame(idx)}
        className="w-full h-full"
      />

      {/* Top Floating Header HUD */}
      <header className="absolute top-4 inset-x-4 z-30 flex items-center justify-between pointer-events-none">
        <Link href="/" className="pointer-events-auto">
          <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to LetsCollab
          </Button>
        </Link>

        {/* Speed & Mode Switcher */}
        <div className="pointer-events-auto flex items-center gap-2 p-1 rounded-full bg-editor/95 backdrop-blur-md border border-divider shadow-lg text-xs font-mono">
          <span className="px-2.5 text-muted font-bold flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-coral" />
            Speed:
          </span>
          <button
            onClick={() => setSpeed(250)}
            className={`px-2.5 py-1 rounded-full transition ${
              speed === 250
                ? "bg-coral text-white font-bold"
                : "text-carbon hover:bg-paper"
            }`}
          >
            0.25s (Fast)
          </button>
          <button
            onClick={() => setSpeed(500)}
            className={`px-2.5 py-1 rounded-full transition ${
              speed === 500
                ? "bg-coral text-white font-bold"
                : "text-carbon hover:bg-paper"
            }`}
          >
            0.5s (Default)
          </button>
          <button
            onClick={() => setSpeed(1000)}
            className={`px-2.5 py-1 rounded-full transition ${
              speed === 1000
                ? "bg-coral text-white font-bold"
                : "text-carbon hover:bg-paper"
            }`}
          >
            1.0s (Slow)
          </button>

          <span className="w-px h-4 bg-divider mx-1" />

          <button
            onClick={() => setShowOverlay((v) => !v)}
            className={`px-2.5 py-1 rounded-full transition ${
              showOverlay
                ? "bg-moss text-carbon font-bold"
                : "text-carbon hover:bg-paper"
            }`}
          >
            {showOverlay ? "Editorial Tint ON" : "Pure 4K Render"}
          </button>
        </div>

        {/* Telemetry Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-editor/95 backdrop-blur-md border border-divider shadow-lg text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-[#3B5A38] animate-pulse" />
          <span className="text-carbon font-semibold">20 UHD Frames</span>
          <span className="text-muted">•</span>
          <span className="text-coral font-bold">Continuous Loop</span>
        </div>
      </header>
    </div>
  );
}
