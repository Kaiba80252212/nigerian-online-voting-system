import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, AlertCircle, Loader2, RefreshCw } from "lucide-react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    faceapi: any;
  }
}

// jsdelivr CDN is faster and more reliable than raw.githubusercontent.com
const MODELS_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights";
const FACEAPI_URL = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";

type Status =
  | "idle"
  | "loading-script"
  | "loading-models"
  | "ready"
  | "capturing"
  | "detected"
  | "error";

interface BiometricCaptureProps {
  onCapture: (descriptor: number[]) => void;
  label?: string;
}

let scriptLoading: Promise<void> | null = null;
let modelsLoaded = false;

async function ensureFaceApi(): Promise<void> {
  // Load the script once across all instances
  if (!window.faceapi) {
    if (!scriptLoading) {
      scriptLoading = new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(`script[src="${FACEAPI_URL}"]`);
        if (existing) {
          existing.addEventListener("load", () => resolve());
          return;
        }
        const s = document.createElement("script");
        s.src = FACEAPI_URL;
        s.crossOrigin = "anonymous";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load face-api.js from CDN. Check your internet connection."));
        document.head.appendChild(s);
      });
    }
    await scriptLoading;
  }

  if (!modelsLoaded) {
    const fa = window.faceapi;
    await Promise.all([
      fa.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
      fa.nets.faceLandmark68Net.loadFromUri(MODELS_URL),   // required before withFaceDescriptor
      fa.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
    ]);
    modelsLoaded = true;
  }
}

export function BiometricCapture({ onCapture, label = "Capture Face" }: BiometricCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runningRef = useRef(false);

  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [captured, setCaptured] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  const stopCamera = useCallback(() => {
    runningRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startDetectionLoop = useCallback(() => {
    runningRef.current = true;
    intervalRef.current = setInterval(async () => {
      if (!runningRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !window.faceapi) return;
      // Wait until video is actually streaming frames
      if (video.readyState < 2) return;

      try {
        const detection = await window.faceapi
          .detectSingleFace(video, new window.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
          setStatus("detected");
          const { x, y, width, height } = detection.detection.box;
          if (ctx) {
            // Draw green bounding box
            ctx.strokeStyle = "#22c55e";
            ctx.lineWidth = 2.5;
            ctx.shadowColor = "#22c55e";
            ctx.shadowBlur = 6;
            ctx.strokeRect(x, y, width, height);
            ctx.shadowBlur = 0;

            // Corner accents
            const cs = 14;
            ctx.strokeStyle = "#4ade80";
            ctx.lineWidth = 3;
            [[x, y], [x + width - cs, y], [x, y + height - cs], [x + width - cs, y + height - cs]].forEach(([cx, cy]) => {
              ctx.beginPath(); ctx.moveTo(cx, cy + cs); ctx.lineTo(cx, cy); ctx.lineTo(cx + cs, cy); ctx.stroke();
            });
          }
        } else {
          setStatus("capturing");
        }
      } catch {
        // Detection errors are transient — ignore and keep looping
      }
    }, 400);
  }, []);

  const startCamera = useCallback(async () => {
    setErrorMsg("");
    setStatus("loading-script");

    try {
      setLoadingStep("Loading face detection engine...");
      await ensureFaceApi();

      setLoadingStep("Loading face recognition models...");
      // models are loaded inside ensureFaceApi — just show a brief UI update
      setStatus("loading-models");

      setLoadingStep("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // wait for video to be ready
        await new Promise<void>((resolve) => {
          if (!videoRef.current) return resolve();
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(resolve).catch(resolve);
          };
        });
      }

      setStatus("capturing");
      startDetectionLoop();
    } catch (err) {
      let msg = "An unexpected error occurred.";
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.message.includes("Permission")) {
          msg = "Camera access was denied. Please allow camera access in your browser settings and try again.";
        } else if (err.name === "NotFoundError") {
          msg = "No camera found. Please connect a camera and try again.";
        } else if (err.name === "NotReadableError") {
          msg = "Camera is already in use by another application. Please close it and try again.";
        } else {
          msg = err.message;
        }
      }
      stopCamera();
      setErrorMsg(msg);
      setStatus("error");
    }
  }, [startDetectionLoop, stopCamera]);

  const captureDescriptor = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !window.faceapi) return;

    try {
      const detection = await window.faceapi
        .detectSingleFace(video, new window.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setErrorMsg("No face clearly detected. Please look directly at the camera and try again.");
        return;
      }

      const descriptor = Array.from(detection.descriptor as Float32Array) as number[];
      stopCamera();
      onCapture(descriptor);
      setCaptured(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Capture failed. Please try again.");
    }
  }, [onCapture, stopCamera]);

  const reset = useCallback(() => {
    stopCamera();
    setCaptured(false);
    setStatus("idle");
    setErrorMsg("");
  }, [stopCamera]);

  // Clean up on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  if (captured) {
    return (
      <div className="biometric-captured">
        <div className="biometric-captured-status" role="status" data-testid="status-biometric-captured">
          <span className="biometric-captured-icon"><CheckCircle2 size={21} /></span>
          <span>
            <span className="biometric-display-title block text-lg font-semibold">Biometric data captured</span>
            <span className="block mt-0.5 text-xs opacity-75">Your face scan is ready for the next step.</span>
          </span>
        </div>
        <button
          type="button"
          onClick={reset}
          data-testid="button-retake-camera"
          className="biometric-retake text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <RefreshCw size={12} /> Retake
        </button>
      </div>
    );
  }

  const isLoading = status === "loading-script" || status === "loading-models";
  const isCameraActive = status === "capturing" || status === "detected";

  return (
    <div className="biometric-capture space-y-4">
      <div
        className={`biometric-stage ${isCameraActive ? "biometric-stage-active" : ""}`}
        data-testid="biometric-camera-stage"
        data-camera-active={isCameraActive}
      >
        <video
          ref={videoRef}
          width={320}
          height={240}
          className={`biometric-video ${isCameraActive ? "opacity-100" : "opacity-0"}`}
          autoPlay
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          width={320}
          height={240}
          className={`biometric-overlay-canvas ${isCameraActive ? "opacity-100" : "opacity-0"}`}
        />

        {!isCameraActive && (
          <div className="biometric-idle-state">
            <span className="biometric-idle-icon">
              {isLoading ? <Loader2 size={26} className="animate-spin" /> : <Camera size={26} />}
            </span>
            <p className="biometric-display-title mt-4 text-lg font-semibold text-white">
              {isLoading ? "Preparing your camera" : "Ready for your face scan"}
            </p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/75">
              {isLoading ? loadingStep : "Sit in good lighting and position your face inside the guide."}
            </p>
            <span className="biometric-privacy-note">
              Camera access starts only after you choose “{label}”.
            </span>
          </div>
        )}

        {isCameraActive && (
          <div className="biometric-live-overlay" aria-live="polite">
            <div className="biometric-live-header">
              <span className="biometric-live-pill">
                <span className={status === "detected" ? "biometric-live-dot biometric-live-dot-detected" : "biometric-live-dot"} />
                {status === "detected" ? "Face detected" : "Camera is live"}
              </span>
              <span className="biometric-live-caption">CENTER YOUR FACE</span>
            </div>
            <div className="biometric-guide-wrap">
              <div className={`biometric-face-guide ${status === "detected" ? "biometric-face-guide-detected" : ""}`} />
            </div>
            <div className="biometric-live-footer">
              {status === "detected"
                ? "Good — hold still, then select Capture Now."
                : "Position your face inside the oval."}
            </div>
          </div>
        )}
      </div>

      {/* Error state */}
      {status === "error" && (
        <div className="biometric-error flex items-start gap-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3" role="alert">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Camera Error</p>
            <p className="text-xs mt-0.5 opacity-90">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="biometric-actions flex gap-2 flex-wrap">
        {(status === "idle" || status === "error") && (
          <Button
            type="button"
            variant="default"
            onClick={startCamera}
            data-testid="button-start-camera"
            className="biometric-start-button flex items-center gap-2"
          >
            <Camera size={16} />
            {label}
          </Button>
        )}

        {isCameraActive && (
          <>
            <Button
              type="button"
              onClick={captureDescriptor}
              disabled={status !== "detected"}
              data-testid="button-capture-face"
              className="biometric-capture-button flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              {status === "detected" ? "Capture Now" : "Waiting for face..."}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => { stopCamera(); setStatus("idle"); }}
              data-testid="button-cancel-camera"
              className="biometric-cancel-button"
            >
              Cancel
            </Button>
          </>
        )}
      </div>

      {/* Tips */}
      {isCameraActive && (
        <ul className="biometric-tips text-xs text-muted-foreground space-y-1">
          <li>Face the camera directly in good lighting</li>
          <li>Remove glasses or hats if not detected</li>
          <li>Wait for the green box to appear, then click Capture</li>
        </ul>
      )}
    </div>
  );
}
