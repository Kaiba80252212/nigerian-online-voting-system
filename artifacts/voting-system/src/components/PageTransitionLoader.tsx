import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

export function PageTransitionLoader() {
  const [location] = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevLocation = useRef(location);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (location === prevLocation.current) return;
    prevLocation.current = location;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setProgress(0);
    setVisible(true);

    let p = 0;
    intervalRef.current = setInterval(() => {
      p += Math.random() * 18 + 8;
      if (p >= 90) {
        p = 90;
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      setProgress(p);
    }, 80);

    timerRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 350);
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [location]);

  if (!visible) return null;

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
        style={{
          background: "hsl(var(--muted))",
        }}
      >
        <div
          className="h-full transition-all"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #008751, #00b368, #008751)",
            backgroundSize: "200% 100%",
            animation: progress < 100 ? "shimmer 1.2s infinite" : "none",
            boxShadow: "0 0 10px #008751, 0 0 5px #00b36880",
            transition: progress === 100 ? "width 0.3s ease, opacity 0.3s ease" : "width 0.15s ease",
          }}
        />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
}
