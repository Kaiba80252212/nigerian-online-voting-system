import { useState, useRef, useEffect } from "react";
import { PublicNav } from "@/components/PublicNav";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import {
  ShieldCheck, ShieldX, Receipt, Search, Copy,
  CheckCircle2, Clock, BarChart3, ArrowRight, RotateCcw, Award
} from "lucide-react";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/nigeria-data";

const PARTY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  APC:  { bg: "bg-blue-50 dark:bg-blue-900/20",   text: "text-blue-700 dark:text-blue-400",   border: "border-blue-200 dark:border-blue-700" },
  PDP:  { bg: "bg-red-50 dark:bg-red-900/20",    text: "text-red-700 dark:text-red-400",    border: "border-red-200 dark:border-red-700" },
  LP:   { bg: "bg-green-50 dark:bg-green-900/20",  text: "text-green-700 dark:text-green-400",  border: "border-green-200 dark:border-green-700" },
  NNPP: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-700" },
};

interface ReceiptResult {
  valid: boolean;
  receiptCode: string;
  electionTitle: string;
  electionType: string;
  electionStatus: string;
  candidateName: string;
  party: string;
  partyAbbreviation: string;
  votedAt: string;
}

function getParty(abbr: string) {
  return PARTY_COLORS[abbr] ?? { bg: "bg-muted", text: "text-foreground", border: "border-border" };
}

export default function VerifyReceiptPage() {
  const [, navigate] = useLocation();
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReceiptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pre-fill from URL query param (?receipt=NV-XXXX)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("receipt");
    if (r) {
      setInputValue(r.toUpperCase());
      handleVerify(r.toUpperCase());
    }
    setTimeout(() => setMounted(true), 50);
  }, []);

  async function handleVerify(code?: string) {
    const receipt = (code ?? inputValue).trim().toUpperCase();
    if (!receipt) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch(`/api/votes/verify?receipt=${encodeURIComponent(receipt)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Receipt not found. Please check the code and try again.");
      } else {
        setResult(data as ReceiptResult);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.receiptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setInputValue("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const party = result ? getParty(result.partyAbbreviation) : null;

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <div className="max-w-2xl mx-auto px-3 sm:px-4 lg:px-6 py-8 md:py-12">

        {/* Hero header */}
        <div
          className={cn(
            "text-center mb-8 md:mb-10 transition-all duration-700",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <div className="w-14 h-14 md:w-16 md:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ boxShadow: "0 4px 20px rgba(0,135,81,0.2)" }}>
            <Receipt size={26} className="text-primary" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Vote Receipt Verification</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base max-w-md mx-auto">
            Enter your receipt code to confirm your vote was recorded correctly. Your identity is never revealed.
          </p>
        </div>

        {/* Input card */}
        <div
          className={cn(
            "bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm mb-5 transition-all duration-700 delay-100",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <label className="block text-sm font-medium text-foreground mb-2">Receipt Code</label>
          <div className="flex gap-2 sm:gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              placeholder="NV-ABCDEF123456"
              maxLength={20}
              className="flex-1 h-11 sm:h-12 px-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground font-mono text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              data-testid="input-receipt-code"
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            <button
              onClick={() => handleVerify()}
              disabled={loading || !inputValue.trim()}
              className="h-11 sm:h-12 px-4 sm:px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
              data-testid="button-verify-receipt"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Search size={16} />
              )}
              <span className="hidden sm:inline">{loading ? "Verifying..." : "Verify"}</span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Format: <span className="font-mono text-foreground">NV-XXXXXXXXXXXXXXX</span> — found on your vote confirmation screen
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div
            className={cn(
              "bg-card border border-destructive/30 rounded-2xl p-5 sm:p-6 transition-all duration-500",
              "opacity-100 translate-y-0"
            )}
            data-testid="card-receipt-invalid"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center shrink-0">
                <ShieldX size={24} className="text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-foreground text-base mb-1">Receipt Not Found</h2>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                  <p>Common reasons:</p>
                  <ul className="list-disc list-inside space-y-1 ml-1">
                    <li>The receipt code was entered incorrectly — check carefully</li>
                    <li>The receipt belongs to a different voting system</li>
                    <li>The vote was not completed successfully</li>
                  </ul>
                </div>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                >
                  <RotateCcw size={13} />
                  Try a different code
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success state */}
        {result && !error && (
          <div
            className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
            data-testid="card-receipt-valid"
          >
            {/* Valid confirmation banner */}
            <div
              className="rounded-2xl p-4 sm:p-5 border"
              style={{
                background: "linear-gradient(135deg, hsl(153,60%,14%) 0%, hsl(153,55%,20%) 100%)",
                borderColor: "rgba(0,135,81,0.3)",
                boxShadow: "0 4px 20px rgba(0,135,81,0.2)",
              }}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/15 rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
                  <ShieldCheck size={24} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold tracking-widest text-green-300 uppercase mb-0.5">Verified</p>
                  <h2 className="font-bold text-white text-base sm:text-lg leading-tight" data-testid="text-receipt-valid-message">
                    Your vote is recorded &amp; valid
                  </h2>
                  <p className="text-xs text-white/70 mt-0.5">This receipt confirms your vote was securely counted.</p>
                </div>
                <CheckCircle2 size={28} className="text-green-400 shrink-0 hidden sm:block" />
              </div>
            </div>

            {/* Receipt code card */}
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Receipt Details</h3>
                <button
                  onClick={handleCopy}
                  className={cn(
                    "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all font-medium",
                    copied
                      ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                      : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                  data-testid="button-copy-receipt"
                >
                  {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy code"}
                </button>
              </div>

              {/* Receipt code display */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Receipt Code</p>
                <p className="text-xl sm:text-2xl font-mono font-bold text-primary tracking-widest" data-testid="text-verified-receipt-code">
                  {result.receiptCode}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Election */}
                <div className="bg-muted/50 rounded-xl p-3.5">
                  <p className="text-xs text-muted-foreground mb-1">Election</p>
                  <p className="text-sm font-semibold text-foreground leading-snug">{result.electionTitle}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">
                    {result.electionType.replace(/_/g, " ")}
                  </p>
                </div>

                {/* Status */}
                <div className="bg-muted/50 rounded-xl p-3.5">
                  <p className="text-xs text-muted-foreground mb-1">Election Status</p>
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium inline-block", STATUS_COLORS[result.electionStatus])}>
                    {STATUS_LABELS[result.electionStatus] ?? result.electionStatus}
                  </span>
                </div>

                {/* Candidate */}
                <div className={cn("rounded-xl p-3.5 border", party?.bg, party?.border)}>
                  <p className="text-xs text-muted-foreground mb-1">Candidate Voted For</p>
                  <p className={cn("text-sm font-bold leading-snug", party?.text)}>{result.candidateName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-semibold">{result.partyAbbreviation}</span> — {result.party}
                  </p>
                </div>

                {/* Timestamp */}
                <div className="bg-muted/50 rounded-xl p-3.5">
                  <p className="text-xs text-muted-foreground mb-1">Date &amp; Time</p>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Clock size={13} className="text-muted-foreground shrink-0" />
                    {new Date(result.votedAt).toLocaleDateString("en-NG", {
                      day: "numeric", month: "long", year: "numeric"
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(result.votedAt).toLocaleTimeString("en-NG", {
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy notice */}
            <div className="bg-muted/40 border border-border rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs text-muted-foreground">
              <ShieldCheck size={14} className="text-primary mt-0.5 shrink-0" />
              <p>
                <span className="font-medium text-foreground">Your identity is protected.</span>{" "}
                This verification confirms your vote was counted but does not reveal who you are.
                The receipt code is the only link between you and your vote — keep it private.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={handleReset}
                className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <RotateCcw size={14} />
                Verify another
              </button>
              <button
                onClick={() => navigate(`/certificate?receipt=${encodeURIComponent(result.receiptCode)}`)}
                className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border-2 font-semibold text-sm transition-colors hover:opacity-90"
                style={{ borderColor: "var(--color-primary, #008751)", color: "var(--color-primary, #008751)" }}
                data-testid="button-get-certificate"
              >
                <Award size={15} />
                Get Certificate
              </button>
              <button
                onClick={() => navigate("/results")}
                className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-semibold"
              >
                <BarChart3 size={14} />
                Live Results
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Help section — only shown when idle */}
        {!result && !error && !loading && (
          <div
            className={cn(
              "mt-6 space-y-3 transition-all duration-700 delay-200",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center mb-3">How it works</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Receipt, title: "Get your receipt", desc: "Your receipt code was shown after you successfully cast your vote." },
                { icon: Search, title: "Enter the code", desc: "Type your receipt code in the box above. Format: NV- followed by 12 characters." },
                { icon: ShieldCheck, title: "Confirm your vote", desc: "The system confirms your vote is valid and shows the election and candidate — without revealing your identity." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-card border border-border rounded-xl p-4 text-center">
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2.5">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
