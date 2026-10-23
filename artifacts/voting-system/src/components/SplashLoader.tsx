import { useEffect, useState } from "react";
import { NigeriaCoatOfArms } from "@/components/NigeriaCoatOfArms";

interface SplashLoaderProps {
  onComplete: () => void;
}

export function SplashLoader({ onComplete }: SplashLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"enter" | "fill" | "exit">("enter");

  useEffect(() => {
    // Phase 1: logo + text appear (0–600ms)
    const t1 = setTimeout(() => setPhase("fill"), 600);

    // Phase 2: progress bar fills from 600ms → 2400ms
    const startTime = Date.now() + 600;
    const duration = 1800;
    let raf: number;

    function tick() {
      const elapsed = Date.now() - startTime;
      const p = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(p);
      if (p < 100) {
        raf = requestAnimationFrame(tick);
      }
    }
    const t2 = setTimeout(() => { raf = requestAnimationFrame(tick); }, 600);

    // Phase 3: exit after bar reaches 100%
    const t3 = setTimeout(() => setPhase("exit"), 2500);

    // Unmount after fade-out
    const t4 = setTimeout(() => onComplete(), 3100);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      cancelAnimationFrame(raf);
    };
  }, [onComplete]);

  return (
    <div
      className="splash-root"
      data-phase={phase}
      aria-label="Loading Nigeria Votes"
      role="status"
    >
      {/* Nigerian flag stripes — decorative side bars */}
      <div className="splash-flag-left" />
      <div className="splash-flag-right" />

      {/* Center content */}
      <div className="splash-content">
        {/* Outer glow ring */}
        <div className="splash-ring">
          <div className="splash-ring-inner">
            <NigeriaCoatOfArms className="w-20 h-20" />
          </div>
        </div>

        {/* App name */}
        <h1 className="splash-title">Nigeria Votes</h1>
        <p className="splash-subtitle">Independent National Electoral Commission</p>
        <p className="splash-tagline">Secure · Transparent · Democratic</p>

        {/* Progress bar */}
        <div className="splash-bar-track">
          <div
            className="splash-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="splash-progress-label">
          {progress < 30 ? "Initialising secure connection…" :
           progress < 60 ? "Loading election data…" :
           progress < 90 ? "Preparing ballot system…" :
           "Ready"}
        </p>
      </div>

      {/* Bottom INEC seal line */}
      <p className="splash-footer">
        Federal Republic of Nigeria &nbsp;·&nbsp; INEC Online Voting Portal
      </p>
    </div>
  );
}
