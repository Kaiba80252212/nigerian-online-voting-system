import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { PublicNav } from "@/components/PublicNav";
import { cn } from "@/lib/utils";
import { ShieldCheck, Download, ArrowLeft, Printer } from "lucide-react";
import { STATUS_LABELS } from "@/lib/nigeria-data";

interface ReceiptData {
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

const PARTY_THEMES: Record<string, {
  primary: string;
  secondary: string;
  badge: string;
  text: string;
  light: string;
  border: string;
}> = {
  APC: {
    primary: "#1e40af",
    secondary: "#1d4ed8",
    badge: "#dbeafe",
    text: "#1e40af",
    light: "#eff6ff",
    border: "#bfdbfe",
  },
  PDP: {
    primary: "#dc2626",
    secondary: "#b91c1c",
    badge: "#fee2e2",
    text: "#dc2626",
    light: "#fef2f2",
    border: "#fecaca",
  },
  LP: {
    primary: "#008751",
    secondary: "#006b40",
    badge: "#dcfce7",
    text: "#166534",
    light: "#f0fdf4",
    border: "#bbf7d0",
  },
  NNPP: {
    primary: "#7c3aed",
    secondary: "#6d28d9",
    badge: "#ede9fe",
    text: "#5b21b6",
    light: "#f5f3ff",
    border: "#ddd6fe",
  },
};

function getTheme(abbr: string) {
  return PARTY_THEMES[abbr] ?? {
    primary: "#008751",
    secondary: "#006b40",
    badge: "#dcfce7",
    text: "#166534",
    light: "#f0fdf4",
    border: "#bbf7d0",
  };
}

export default function CertificatePage() {
  const [, navigate] = useLocation();
  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const receipt = params.get("receipt")?.trim().toUpperCase();
    if (!receipt) {
      setError("No receipt code provided.");
      setLoading(false);
      return;
    }
    fetch(`/api/votes/verify?receipt=${encodeURIComponent(receipt)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Receipt not found");
        return json as ReceiptData;
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-destructive text-sm mb-4">{error ?? "Certificate not available."}</p>
          <button onClick={() => navigate("/verify-receipt")} className="text-primary text-sm hover:underline flex items-center gap-1.5 mx-auto">
            <ArrowLeft size={13} /> Back to Receipt Verification
          </button>
        </div>
      </div>
    );
  }

  const theme = getTheme(data.partyAbbreviation);
  const votedDate = new Date(data.votedAt).toLocaleDateString("en-NG", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const votedTime = new Date(data.votedAt).toLocaleTimeString("en-NG", {
    hour: "2-digit", minute: "2-digit",
  });
  const electionTypeLabel = data.electionType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  const issuedDate = new Date().toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <>
      {/* Screen-only: header controls */}
      <div className="print:hidden">
        <PublicNav />
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(`/verify-receipt?receipt=${encodeURIComponent(data.receiptCode)}`)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={15} /> Back to Verification
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
              data-testid="button-print-certificate"
            >
              <Printer size={15} />
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* Certificate — visible on screen and in print */}
      <div className="max-w-3xl mx-auto px-4 pb-12 print:px-0 print:pb-0 print:max-w-none">
        <div
          id="vote-certificate"
          className="relative bg-white rounded-2xl print:rounded-none overflow-hidden"
          style={{
            border: `3px solid ${theme.primary}`,
            boxShadow: `0 0 0 6px ${theme.primary}18, 0 20px 60px ${theme.primary}25`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          {/* Corner ornaments */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: theme.primary }} />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: theme.primary }} />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: theme.primary }} />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: theme.primary }} />

          {/* Header band */}
          <div
            className="px-8 py-6 text-center text-white relative"
            style={{ background: `linear-gradient(135deg, #004d2e 0%, #008751 50%, #004d2e 100%)` }}
          >
            {/* Watermark pattern */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px)`,
            }} />

            <div className="relative flex items-center justify-center gap-4 mb-3">
              {/* Nigeria coat of arms placeholder */}
              <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-2xl select-none">
                🦅
              </div>
              <div className="text-center">
                <p className="text-xs font-bold tracking-[0.3em] uppercase text-green-200 mb-0.5">Federal Republic of Nigeria</p>
                <p className="text-2xl font-bold tracking-wide">NIGERIA VOTES</p>
                <p className="text-xs tracking-[0.2em] uppercase text-green-200">Independent National Electoral Commission</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
                <ShieldCheck size={26} className="text-white" />
              </div>
            </div>

            <div className="relative inline-block">
              <div className="border border-white/40 px-8 py-2 rounded-full bg-white/10 backdrop-blur-sm">
                <p className="text-sm font-bold tracking-[0.25em] uppercase">Official Vote Certificate</p>
              </div>
            </div>
          </div>

          {/* Divider with seal text */}
          <div className="flex items-center gap-3 px-8 py-3" style={{ background: theme.light, borderBottom: `1px solid ${theme.border}` }}>
            <div className="flex-1 h-px" style={{ background: theme.border }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: theme.text }}>
              Certificate of Vote · {electionTypeLabel} Election
            </p>
            <div className="flex-1 h-px" style={{ background: theme.border }} />
          </div>

          {/* Body */}
          <div className="px-8 sm:px-12 py-8 space-y-6 bg-white">

            {/* Opening declaration */}
            <p className="text-center text-sm text-gray-600 leading-relaxed max-w-xl mx-auto" style={{ fontStyle: "italic" }}>
              This certificate confirms that a valid vote was cast and officially recorded in the following election
              in accordance with the Electoral Act of Nigeria.
            </p>

            {/* Election title */}
            <div className="text-center py-4 border-y" style={{ borderColor: theme.border }}>
              <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: theme.text }}>Election</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">{data.electionTitle}</p>
              <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                <span className="text-xs px-3 py-1 rounded-full font-semibold text-white"
                  style={{ background: theme.primary }}>
                  {STATUS_LABELS[data.electionStatus] ?? data.electionStatus}
                </span>
                <span className="text-xs text-gray-500">{electionTypeLabel}</span>
              </div>
            </div>

            {/* Party voted for — the HERO section */}
            <div
              className="rounded-2xl p-5 sm:p-6 text-center relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}15 0%, ${theme.secondary}25 100%)`,
                border: `2px solid ${theme.border}`,
              }}
            >
              {/* Decorative bg glow */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at center, ${theme.primary}10 0%, transparent 70%)` }} />

              <p className="relative text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: theme.text }}>
                Voted For
              </p>

              {/* Party badge */}
              <div
                className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full text-2xl sm:text-3xl font-extrabold text-white mb-4 relative"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                  boxShadow: `0 8px 32px ${theme.primary}50`,
                  letterSpacing: "0.05em",
                }}
              >
                {data.partyAbbreviation}
              </div>

              <p className="relative text-xl sm:text-2xl font-bold text-gray-900 mb-1">{data.candidateName}</p>
              <p className="relative text-sm font-semibold" style={{ color: theme.text }}>
                {data.partyAbbreviation} — {data.party}
              </p>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-xl p-3.5" style={{ background: theme.light, border: `1px solid ${theme.border}` }}>
                <p className="text-xs font-bold tracking-widest uppercase mb-1.5" style={{ color: theme.text }}>Date Voted</p>
                <p className="text-sm font-bold text-gray-900 leading-snug">{votedDate}</p>
                <p className="text-xs text-gray-500 mt-0.5">{votedTime}</p>
              </div>
              <div className="rounded-xl p-3.5" style={{ background: theme.light, border: `1px solid ${theme.border}` }}>
                <p className="text-xs font-bold tracking-widest uppercase mb-1.5" style={{ color: theme.text }}>Certificate Issued</p>
                <p className="text-sm font-bold text-gray-900">{issuedDate}</p>
                <p className="text-xs text-gray-500 mt-0.5">By Nigeria Votes</p>
              </div>
            </div>

            {/* Receipt code — verification anchor */}
            <div
              className="rounded-xl px-5 py-4 text-center"
              style={{ background: "#f9fafb", border: "2px dashed #d1d5db" }}
            >
              <p className="text-xs font-bold tracking-[0.3em] uppercase text-gray-500 mb-2">Receipt Code</p>
              <p className="text-2xl sm:text-3xl font-mono font-extrabold tracking-widest" style={{ color: theme.primary }}>
                {data.receiptCode}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                This unique code can be verified at any time at nigeria-votes.replit.app/verify-receipt
              </p>
            </div>

            {/* Official footer */}
            <div className="pt-4 border-t" style={{ borderColor: theme.border }}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

                {/* Issuing authority */}
                <div className="text-center sm:text-left">
                  <div className="w-28 h-px mb-2 mx-auto sm:mx-0" style={{ background: theme.primary }} />
                  <p className="text-xs font-bold text-gray-700">Independent National Electoral Commission</p>
                  <p className="text-xs text-gray-400">INEC Nigeria · Federal Republic of Nigeria</p>
                </div>

                {/* Official seal */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                    boxShadow: `0 4px 16px ${theme.primary}50`,
                    border: `2px solid ${theme.border}`,
                  }}
                >
                  <div className="text-center leading-none">
                    <div className="text-lg">✓</div>
                    <div className="text-[7px] font-bold tracking-tighter mt-0.5 uppercase">VALID</div>
                  </div>
                </div>

                {/* Verification */}
                <div className="text-center sm:text-right">
                  <div className="w-28 h-px mb-2 mx-auto sm:ml-auto sm:mr-0" style={{ background: theme.primary }} />
                  <p className="text-xs font-bold text-gray-700">Digitally Verified</p>
                  <p className="text-xs text-gray-400">Nigeria Votes Platform</p>
                </div>
              </div>
            </div>

            {/* Watermark disclaimer */}
            <p className="text-center text-[10px] text-gray-400 leading-relaxed">
              This certificate is for personal record-keeping only. Individual vote choices are protected under Nigerian electoral law.
              The receipt code confirms participation — it does not violate ballot secrecy.
            </p>
          </div>
        </div>

        {/* Screen-only action buttons below certificate */}
        <div className="print:hidden mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            data-testid="button-download-certificate"
          >
            <Download size={16} />
            Download as PDF
          </button>
          <button
            onClick={() => navigate(`/verify-receipt?receipt=${encodeURIComponent(data.receiptCode)}`)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ShieldCheck size={16} />
            Back to Verification
          </button>
        </div>
      </div>

      {/* Print-only styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden { display: none !important; }
          #vote-certificate {
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </>
  );
}
