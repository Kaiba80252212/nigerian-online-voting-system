import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { PublicNav } from "@/components/PublicNav";
import { getVoterToken, clearVoterToken } from "@/lib/auth";
import {
  User, MapPin, Building2, Hash, Phone, Calendar,
  Vote, CheckCircle2, Clock, Shield, Receipt,
  ArrowRight, LogOut, Bell, Settings, BarChart3,
  Fingerprint, Home, ChevronRight, Star, Activity, Award
} from "lucide-react";
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

const PARTY_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  APC: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-700", glow: "#3b82f6" },
  PDP: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-700", glow: "#ef4444" },
  LP: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-400", border: "border-green-200 dark:border-green-700", glow: "#22c55e" },
  NNPP: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-700", glow: "#a855f7" },
};

function getPartyColor(abbr: string) {
  return PARTY_COLORS[abbr] ?? { bg: "bg-muted", text: "text-foreground", border: "border-border", glow: "#008751" };
}

function maskNin(nin: string) {
  if (nin.length < 7) return "***-***-****";
  return nin.slice(0, 3) + "-***-" + nin.slice(-4);
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join("");
}

function Card3D({ children, className = "", glowColor = "#008751" }: { children: React.ReactNode; className?: string; glowColor?: string }) {
  const [transform, setTransform] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)");

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTransform(`perspective(1000px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) scale(1.015)`);
  }

  function onMouseLeave() {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)");
  }

  return (
    <div
      className={cn("transition-transform duration-200 ease-out cursor-default", className)}
      style={{ transform, willChange: "transform" }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300"
        style={{ boxShadow: `0 4px 20px ${glowColor}15` }}
      >
        {children}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

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
        if (!res.ok) throw new Error(data.error ?? "Failed to load dashboard");
        return data as ProfileData;
      })
      .then((data) => {
        setProfile(data);
        setLoading(false);
        setTimeout(() => setMounted(true), 50);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  function handleLogout() {
    clearVoterToken();
    navigate("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
          <div className="h-40 md:h-48 bg-muted animate-pulse rounded-3xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />)}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="h-64 bg-muted animate-pulse rounded-2xl" />
            <div className="h-64 bg-muted animate-pulse rounded-2xl" />
          </div>
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
            Please verify your identity with your NIN and face scan to access your dashboard.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/verify">
              <button className="w-full px-5 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                Verify Identity <ArrowRight size={15} />
              </button>
            </Link>
            <Link href="/register">
              <button className="w-full px-5 py-3 border border-border text-sm font-medium rounded-xl hover:bg-muted transition-colors">
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
          <p className="text-destructive text-sm">{error ?? "Something went wrong."}</p>
          <button onClick={() => navigate("/verify")} className="mt-4 text-primary text-sm hover:underline">
            Re-verify identity
          </button>
        </div>
      </div>
    );
  }

  const initials = getInitials(profile.fullName);
  const joinDate = new Date(profile.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  const dob = profile.dateOfBirth
    ? new Date(profile.dateOfBirth).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })
    : "Not provided";
  const latestVote = profile.votingHistory.length > 0 ? profile.votingHistory[profile.votingHistory.length - 1] : null;
  const latestParty = latestVote ? getPartyColor(latestVote.partyAbbreviation) : null;

  const notifications = [
    profile.status === "voted"
      ? { icon: CheckCircle2, text: "Your vote has been recorded successfully", color: "text-green-500", time: "Today" }
      : profile.status === "verified"
      ? { icon: Activity, text: "Identity verified — ready to cast your vote", color: "text-blue-500", time: "Today" }
      : { icon: Bell, text: "Complete identity verification to vote", color: "text-yellow-500", time: "Today" },
    { icon: Shield, text: "Your account is secure and protected", color: "text-primary", time: "Always" },
    { icon: Star, text: "Welcome to Nigeria Votes — INEC Digital Platform", color: "text-orange-500", time: "" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-6 md:py-8 space-y-5 md:space-y-6">

        {/* ─── Hero Profile Card ─── */}
        <div
          className={cn(
            "relative overflow-hidden rounded-3xl transition-all duration-700",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
          style={{
            background: "linear-gradient(135deg, hsl(153,60%,14%) 0%, hsl(153,55%,20%) 40%, hsl(215,30%,18%) 100%)",
            boxShadow: "0 20px 60px rgba(0,135,81,0.35), 0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          {/* Animated background orbs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 md:w-64 md:h-64 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "4s" }} />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 md:w-48 md:h-48 bg-green-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "6s" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 bg-white/3 rounded-full blur-3xl" />
          </div>

          <div className="relative p-5 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {/* 3D Avatar */}
              <div
                className="relative shrink-0"
                style={{
                  filter: "drop-shadow(0 8px 24px rgba(0,135,81,0.5))",
                  animation: "float 3s ease-in-out infinite",
                }}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-white/15 border-2 border-white/30 flex items-center justify-center backdrop-blur-sm"
                  style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3), 0 8px 32px rgba(0,0,0,0.3)" }}>
                  <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white select-none">{initials}</span>
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-[hsl(153,60%,14%)] flex items-center justify-center"
                  style={{ background: profile.status === "voted" ? "#22c55e" : profile.status === "verified" ? "#3b82f6" : "#f59e0b" }}>
                  {profile.status === "voted"
                    ? <CheckCircle2 size={11} className="text-white" />
                    : profile.status === "verified"
                    ? <Shield size={11} className="text-white" />
                    : <Clock size={11} className="text-white" />}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold tracking-widest text-green-300 uppercase mb-1">Voter Dashboard</p>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight truncate" data-testid="text-dashboard-name">
                  {profile.fullName}
                </h1>
                <p className="text-sm text-white/70 mt-1">{profile.state} · {profile.lga}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className={cn("text-xs px-3 py-1.5 rounded-full font-semibold border backdrop-blur-sm", {
                    "bg-green-400/20 text-green-300 border-green-400/40": profile.status === "voted",
                    "bg-blue-400/20 text-blue-300 border-blue-400/40": profile.status === "verified",
                    "bg-amber-400/20 text-amber-300 border-amber-400/40": profile.status === "registered",
                  })}>
                    {STATUS_LABELS[profile.status] ?? profile.status}
                  </span>
                  <span className="text-xs text-white/50">ID: #{profile.id.toString().padStart(6, "0")}</span>
                </div>
              </div>

              {/* Logout — desktop */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all border border-white/20 hover:border-white/40 shrink-0"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>

            {/* Mobile logout */}
            <button
              onClick={handleLogout}
              className="sm:hidden mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all border border-white/20"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <div
          className={cn(
            "grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 transition-all duration-700 delay-100",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          {[
            {
              label: "Voting Status",
              value: STATUS_LABELS[profile.status] ?? profile.status,
              icon: Shield,
              color: profile.status === "voted" ? "#22c55e" : profile.status === "verified" ? "#3b82f6" : "#f59e0b",
              sub: profile.status === "voted" ? "Vote recorded" : profile.status === "verified" ? "Ready to vote" : "Pending verification",
            },
            {
              label: "Elections Voted",
              value: profile.votingHistory.length.toString(),
              icon: Vote,
              color: "#008751",
              sub: `${profile.votingHistory.length} participation${profile.votingHistory.length !== 1 ? "s" : ""}`,
            },
            {
              label: "State",
              value: profile.state.split(" ")[0],
              icon: MapPin,
              color: "#f97316",
              sub: profile.lga,
            },
            {
              label: "Member Since",
              value: new Date(profile.createdAt).getFullYear().toString(),
              icon: Calendar,
              color: "#8b5cf6",
              sub: joinDate,
            },
          ].map(({ label, value, icon: Icon, color, sub }, i) => (
            <Card3D key={label} glowColor={color}>
              <div className="p-3 sm:p-4 md:p-5">
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <p className="text-xs text-muted-foreground font-medium">{label}</p>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${color}18` }}>
                    <Icon size={14} style={{ color }} />
                  </div>
                </div>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground leading-none truncate" style={{ color }}>
                  {value}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>
              </div>
            </Card3D>
          ))}
        </div>

        {/* ─── Main Content Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">

          {/* Left column: Personal info + Party voted */}
          <div className={cn(
            "lg:col-span-1 space-y-4 transition-all duration-700 delay-200",
            mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
          )}>

            {/* Personal Information */}
            <Card3D glowColor="#008751">
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                    <User size={14} className="text-primary" />
                  </div>
                  <h2 className="text-sm font-semibold text-foreground">Personal Information</h2>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: Hash, label: "NIN", value: maskNin(profile.nin) },
                    { icon: Calendar, label: "Date of Birth", value: dob },
                    { icon: Phone, label: "Phone", value: profile.phoneNumber ?? "Not provided" },
                    { icon: MapPin, label: "State", value: profile.state },
                    { icon: Building2, label: "LGA", value: profile.lga },
                    { icon: Building2, label: "Polling Unit", value: profile.pollingUnit },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        <Icon size={13} className="text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-xs sm:text-sm font-medium text-foreground truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card3D>

            {/* Quick Navigation */}
            <Card3D glowColor="#8b5cf6">
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Home size={14} className="text-purple-500" />
                  </div>
                  <h2 className="text-sm font-semibold text-foreground">Quick Navigation</h2>
                </div>
                <div className="space-y-1.5">
                  {[
                    { href: "/vote", icon: Vote, label: "Cast Your Vote", color: "#008751" },
                    { href: "/results", icon: BarChart3, label: "Live Results", color: "#3b82f6" },
                    { href: "/verify-receipt", icon: Receipt, label: "Verify Receipt", color: "#f97316" },
                    { href: "/verify", icon: Fingerprint, label: "Re-verify Identity", color: "#8b5cf6" },
                    { href: "/", icon: Home, label: "Home", color: "#6b7280" },
                  ].map(({ href, icon: Icon, label, color }) => (
                    <Link key={href} href={href}>
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted transition-colors cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                            <Icon size={13} style={{ color }} />
                          </div>
                          <span className="text-sm text-foreground font-medium">{label}</span>
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </Card3D>
          </div>

          {/* Right column: Voting history + Notifications + Party */}
          <div className={cn(
            "lg:col-span-2 space-y-4 transition-all duration-700 delay-300",
            mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
          )}>

            {/* Party Voted For */}
            {latestVote && latestParty && (
              <Card3D glowColor={latestParty.glow}>
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Star size={14} className="text-primary" />
                    </div>
                    <h2 className="text-sm font-semibold text-foreground">Latest Vote</h2>
                  </div>
                  <div className={cn("flex items-center gap-4 rounded-xl border p-3 sm:p-4", latestParty.bg, latestParty.border)}>
                    <div className={cn("w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-bold text-sm sm:text-base border-2 shrink-0", latestParty.bg, latestParty.text, latestParty.border)}
                      style={{ boxShadow: `0 4px 12px ${latestParty.glow}30` }}>
                      {latestVote.partyAbbreviation}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("font-bold text-sm sm:text-base truncate", latestParty.text)}>{latestVote.candidateName}</p>
                      <p className="text-xs text-muted-foreground truncate">{latestVote.party}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{latestVote.electionTitle}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={cn("text-xs px-2 py-1 rounded-full font-medium", STATUS_COLORS[latestVote.electionStatus])}>
                        {STATUS_LABELS[latestVote.electionStatus] ?? latestVote.electionStatus}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">{latestVote.receiptCode}</p>
                    </div>
                  </div>
                </div>
              </Card3D>
            )}

            {/* Voting History */}
            <Card3D glowColor="#008751">
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Vote size={14} className="text-primary" />
                    </div>
                    <h2 className="text-sm font-semibold text-foreground">Voting History</h2>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {profile.votingHistory.length} record{profile.votingHistory.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {profile.votingHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Vote size={22} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">No votes cast yet</p>
                    <Link href="/vote">
                      <button className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto font-medium">
                        Cast your first vote <ArrowRight size={12} />
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-0.5">
                    {[...profile.votingHistory].reverse().map((vote) => {
                      const pStyle = getPartyColor(vote.partyAbbreviation);
                      const votedDate = new Date(vote.votedAt).toLocaleString("en-NG", {
                        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                      });
                      return (
                        <div key={vote.voteId} className={cn("border rounded-xl p-3 sm:p-4 transition-all hover:shadow-sm", pStyle.border)}>
                          <div className="flex items-start gap-3">
                            <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border", pStyle.bg, pStyle.text, pStyle.border)}>
                              {vote.partyAbbreviation}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{vote.electionTitle}</p>
                              <p className={cn("text-xs font-medium truncate", pStyle.text)}>{vote.candidateName}</p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock size={10} />{votedDate}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                                  <Receipt size={10} />{vote.receiptCode}
                                </span>
                              </div>
                            </div>
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", STATUS_COLORS[vote.electionStatus])}>
                              {STATUS_LABELS[vote.electionStatus] ?? vote.electionStatus}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card3D>

            {/* Notifications */}
            <Card3D glowColor="#f97316">
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <Bell size={14} className="text-orange-500" />
                  </div>
                  <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
                  <span className="ml-auto text-xs bg-orange-500/10 text-orange-500 font-medium px-2 py-0.5 rounded-full">
                    {notifications.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {notifications.map(({ icon: Icon, text, color, time }, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-background">
                        <Icon size={13} className={color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-foreground">{text}</p>
                        {time && <p className="text-xs text-muted-foreground mt-0.5">{time}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card3D>

            {/* Account Settings */}
            <Card3D glowColor="#6b7280">
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center">
                    <Settings size={14} className="text-muted-foreground" />
                  </div>
                  <h2 className="text-sm font-semibold text-foreground">Account Settings</h2>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-2.5">
                      <Shield size={13} className="text-primary" />
                      <span className="text-sm text-foreground">Biometric Security</span>
                    </div>
                    <span className="text-xs bg-green-500/10 text-green-500 font-medium px-2 py-0.5 rounded-full">Active</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-2.5">
                      <Hash size={13} className="text-primary" />
                      <span className="text-sm text-foreground">NIN Verification</span>
                    </div>
                    <span className="text-xs bg-green-500/10 text-green-500 font-medium px-2 py-0.5 rounded-full">Verified</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-2.5">
                      <Calendar size={13} className="text-muted-foreground" />
                      <span className="text-sm text-foreground">Account Created</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{joinDate}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-destructive/10 text-destructive transition-colors mt-1"
                  >
                    <LogOut size={13} />
                    <span className="text-sm font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </Card3D>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center pb-4">
          Your NIN is partially masked for security. Session expires in 30 minutes.
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
