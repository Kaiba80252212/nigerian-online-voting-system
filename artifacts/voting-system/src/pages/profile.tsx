import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { PublicNav } from "@/components/PublicNav";
import { getVoterToken } from "@/lib/auth";
import {
  User, MapPin, Building2, Hash, Phone, Calendar,
  Vote, CheckCircle2, Clock, Shield, Receipt, ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/nigeria-data";

interface VoteRecord {
  voteId: number;
  receiptCode: string;
  votedAt: string;
  candidateName: string;
  party: string;
  partyAbbreviation: string;
  electionTitle: string;
  electionType: string;
  electionStatus: string;
}

interface ProfileData {
  id: number;
  nin: string;
  fullName: string;
  dateOfBirth: string | null;
  state: string;
  lga: string;
  pollingUnit: string;
  phoneNumber: string | null;
  status: string;
  createdAt: string;
  votingHistory: VoteRecord[];
}

const PARTY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  APC: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
  PDP: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-800" },
  LP: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-400", border: "border-green-200 dark:border-green-800" },
  NNPP: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
};

function getPartyColor(abbr: string) {
  return PARTY_COLORS[abbr] ?? { bg: "bg-muted", text: "text-foreground", border: "border-border" };
}

function maskNin(nin: string) {
  if (nin.length < 7) return "***-***-****";
  return nin.slice(0, 3) + "-***-" + nin.slice(-4);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getVoterToken();
    if (!token) {
      setError("not-authenticated");
      setLoading(false);
      return;
    }

    fetch("/api/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load profile");
        return data as ProfileData;
      })
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="max-w-2xl mx-auto px-4 py-16 space-y-4">
          <div className="h-32 bg-muted animate-pulse rounded-2xl" />
          <div className="h-64 bg-muted animate-pulse rounded-2xl" />
          <div className="h-40 bg-muted animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error === "not-authenticated") {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Identity Verification Required</h2>
          <p className="text-muted-foreground text-sm mb-6">
            You need to verify your identity with your NIN and face scan before accessing your profile.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/verify">
              <button className="w-full px-5 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                Verify Identity
                <ArrowRight size={15} />
              </button>
            </Link>
            <Link href="/register">
              <button className="w-full px-5 py-3 border border-border text-sm font-medium rounded-lg hover:bg-muted transition-colors">
                Register an Account
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-destructive text-sm">{error ?? "Something went wrong. Please try again."}</p>
          <button onClick={() => navigate("/verify")} className="mt-4 text-primary text-sm hover:underline">
            Re-verify identity
          </button>
        </div>
      </div>
    );
  }

  const initials = getInitials(profile.fullName);
  const joinDate = new Date(profile.createdAt).toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric",
  });
  const dob = profile.dateOfBirth
    ? new Date(profile.dateOfBirth).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })
    : "Not provided";

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-5">

        {/* Header card */}
        <div className="bg-gradient-to-br from-[hsl(153,60%,18%)] via-[hsl(153,55%,22%)] to-[hsl(153,50%,26%)] rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-white select-none">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-widest text-green-300 uppercase mb-1">Voter Profile</p>
              <h1 className="text-xl font-bold text-white leading-tight" data-testid="text-profile-name">{profile.fullName}</h1>
              <p className="text-sm text-white/70 mt-1">{profile.state} · {profile.lga}</p>
              <div className="mt-2 inline-flex items-center gap-1.5">
                <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium border", {
                  "bg-green-400/20 text-green-300 border-green-400/30": profile.status === "voted",
                  "bg-blue-400/20 text-blue-300 border-blue-400/30": profile.status === "verified",
                  "bg-white/10 text-white/70 border-white/20": profile.status === "registered",
                })}>
                  {profile.status === "voted" && <CheckCircle2 size={10} className="inline mr-1" />}
                  {STATUS_LABELS[profile.status] ?? profile.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal information */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-2">Personal Information</h2>
          <div className="divide-y divide-border">
            <InfoRow icon={Hash} label="National ID Number (NIN)" value={maskNin(profile.nin)} />
            <InfoRow icon={Calendar} label="Date of Birth" value={dob} />
            <InfoRow icon={Phone} label="Phone Number" value={profile.phoneNumber ?? "Not provided"} />
            <InfoRow icon={MapPin} label="State of Origin" value={profile.state} />
            <InfoRow icon={Building2} label="Local Government Area" value={profile.lga} />
            <InfoRow icon={Building2} label="Polling Unit" value={profile.pollingUnit} />
          </div>
        </div>

        {/* Account info */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-2">Account Details</h2>
          <div className="divide-y divide-border">
            <InfoRow icon={Calendar} label="Account Created" value={joinDate} />
            <InfoRow icon={Shield} label="Voting Status" value={STATUS_LABELS[profile.status] ?? profile.status} />
            <InfoRow icon={Vote} label="Elections Participated" value={`${profile.votingHistory.length} election${profile.votingHistory.length !== 1 ? "s" : ""}`} />
          </div>
        </div>

        {/* Voting history */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Voting History</h2>
            <span className="text-xs text-muted-foreground">{profile.votingHistory.length} record{profile.votingHistory.length !== 1 ? "s" : ""}</span>
          </div>

          {profile.votingHistory.length === 0 ? (
            <div className="text-center py-8">
              <Vote size={32} className="text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No votes cast yet.</p>
              <Link href="/verify">
                <button className="mt-3 text-xs text-primary hover:underline flex items-center gap-1 mx-auto">
                  Verify identity to vote <ArrowRight size={12} />
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {profile.votingHistory.map((vote) => {
                const partyStyle = getPartyColor(vote.partyAbbreviation);
                const votedDate = new Date(vote.votedAt).toLocaleString("en-NG", {
                  day: "numeric", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                });

                return (
                  <div
                    key={vote.voteId}
                    className="border border-border rounded-xl p-4 space-y-3"
                    data-testid={`vote-record-${vote.voteId}`}
                  >
                    {/* Election */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-tight">{vote.electionTitle}</p>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">
                          {vote.electionType?.replace(/_/g, " ")}
                        </p>
                      </div>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", STATUS_COLORS[vote.electionStatus])}>
                        {STATUS_LABELS[vote.electionStatus] ?? vote.electionStatus}
                      </span>
                    </div>

                    {/* Party voted */}
                    <div className={cn("flex items-center gap-3 rounded-lg border px-3 py-2", partyStyle.bg, partyStyle.border)}>
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0", partyStyle.bg, partyStyle.text, "border", partyStyle.border)}>
                        {vote.partyAbbreviation}
                      </div>
                      <div>
                        <p className={cn("text-sm font-semibold", partyStyle.text)}>{vote.candidateName}</p>
                        <p className="text-xs text-muted-foreground">{vote.party}</p>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock size={11} />
                        {votedDate}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Receipt size={11} />
                        {vote.receiptCode}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Privacy note */}
        <p className="text-xs text-muted-foreground text-center pb-4">
          Your NIN is partially masked for security. Voting records are anonymized and tamper-proof.
        </p>
      </div>
    </div>
  );
}
