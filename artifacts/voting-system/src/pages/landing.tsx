import { Link } from "wouter";
import { PublicNav } from "@/components/PublicNav";
import { NigeriaCoatOfArms } from "@/components/NigeriaCoatOfArms";
import { useListElections } from "@workspace/api-client-react";
import { ShieldCheck, Fingerprint, BarChart3, ArrowRight, CheckCircle2, Lock, Globe } from "lucide-react";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/nigeria-data";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const { data: elections } = useListElections({ status: "active" });

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Hero */}
      <section className="civic-hero text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-green-300 rounded-full blur-3xl" />
        </div>
        <div className="civic-hero-inner relative mx-auto px-4 sm:px-6">
          <div className="civic-hero-layout relative flex flex-col md:flex-row items-center">
            <div className="civic-hero-copy flex-1 text-center md:text-left">
              <div className="civic-hero-kicker mb-7 justify-center md:justify-start">
                <NigeriaCoatOfArms className="w-12 h-12" />
                <div>
                  <p className="text-xs font-medium tracking-widest text-green-300 uppercase">Federal Republic of Nigeria</p>
                  <p className="text-sm text-white/80 mt-0.5">Independent National Electoral Commission</p>
                </div>
              </div>
              <h1 className="civic-hero-title mb-6" data-testid="text-hero-title">
                Secure Biometric<br />
                <span className="text-green-300">Online Voting</span>
              </h1>
              <p className="civic-hero-description text-white/80 mb-8 mx-auto md:mx-0">
                Vote securely from anywhere in Nigeria using advanced facial recognition technology. Your identity is verified. Your vote is protected.
              </p>
              <div className="civic-hero-actions flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link href="/register">
                  <button
                    data-testid="button-register-hero"
                    className="civic-hero-action-primary flex items-center justify-center gap-2 px-7 py-3 bg-white text-[hsl(153,60%,20%)] font-semibold hover:bg-green-50"
                  >
                    Register to Vote
                    <ArrowRight size={16} />
                  </button>
                </Link>
                <Link href="/verify">
                  <button
                    data-testid="button-vote-hero"
                    className="civic-hero-action-secondary flex items-center justify-center gap-2 px-7 py-3 bg-white/10 text-white font-semibold hover:bg-white/20 border border-white/20"
                  >
                    Verify & Vote
                  </button>
                </Link>
              </div>
            </div>
            <div className="civic-overview-card shrink-0 text-left">
              <p className="text-xs font-semibold tracking-[0.16em] uppercase text-green-300">A clear path to participation</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Your vote, step by step</h2>
              <div className="mt-6">
                <div className="civic-journey-step">
                  <span className="civic-journey-number">01</span>
                  <div>
                    <p className="text-sm font-semibold text-white">Register securely</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/65">Provide your voter details and capture your biometric profile.</p>
                  </div>
                </div>
                <div className="civic-journey-divider" />
                <div className="civic-journey-step">
                  <span className="civic-journey-number">02</span>
                  <div>
                    <p className="text-sm font-semibold text-white">Verify your identity</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/65">Confirm it is you before accessing an eligible ballot.</p>
                  </div>
                </div>
                <div className="civic-journey-divider" />
                <div className="civic-journey-step">
                  <span className="civic-journey-number">03</span>
                  <div>
                    <p className="text-sm font-semibold text-white">Cast your vote</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/65">Make your choice and keep your vote receipt for reference.</p>
                  </div>
                </div>
              </div>
              <div className="civic-overview-metrics mt-6">
                <div className="civic-overview-metric">
                  <p className="text-lg font-bold text-green-300">36+</p>
                  <p className="mt-0.5 text-[10px] leading-tight text-white/65">States Covered</p>
                </div>
                <div className="civic-overview-metric">
                  <p className="text-lg font-bold text-green-300">256-bit</p>
                  <p className="mt-0.5 text-[10px] leading-tight text-white/65">Encryption</p>
                </div>
                <div className="civic-overview-metric">
                  <p className="text-lg font-bold text-green-300">Live</p>
                  <p className="mt-0.5 text-[10px] leading-tight text-white/65">Result Updates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Elections */}
      {elections && elections.length > 0 && (
        <section className="landing-section mx-auto px-4 sm:px-6 py-16 md:py-20">
          <div className="mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] uppercase text-primary mb-2">Participate</p>
              <h2 className="landing-section-heading text-foreground" data-testid="text-active-elections-heading">Active elections</h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">Choose an active election to verify your identity and continue to the ballot.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {elections.map((e) => (
              <Link href="/verify" key={e.id}>
                <div
                  data-testid={`card-election-${e.id}`}
                  className="election-card border border-border p-5 bg-card hover:shadow-md cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[e.status])}>
                      {STATUS_LABELS[e.status]}
                    </span>
                    <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">{e.title}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{e.type?.replace(/_/g, " ")}</p>
                  {e.candidateCount != null && (
                    <p className="text-xs text-muted-foreground mt-2">{e.candidateCount} candidates</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="landing-section mx-auto px-4 sm:px-6 py-16 md:py-20 border-t border-border">
        <div className="max-w-2xl mx-auto text-center mb-10 md:mb-12">
          <p className="text-xs font-semibold tracking-[0.16em] uppercase text-primary mb-3">Trust in every step</p>
          <h2 className="landing-section-heading text-foreground mb-3">A voting experience built around you</h2>
          <p className="text-sm md:text-base leading-relaxed text-muted-foreground">A more accessible way to take part, with identity checks and clear confirmation at each stage.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: Fingerprint,
              title: "Biometric Verification",
              desc: "Facial recognition ensures only registered voters can cast ballots — no impersonation, no fraud.",
            },
            {
              icon: Lock,
              title: "End-to-End Security",
              desc: "Your vote is encrypted and anonymized. No one can trace your vote back to you.",
            },
            {
              icon: ShieldCheck,
              title: "Tamper-Proof Receipts",
              desc: "Every voter receives a unique receipt code to verify their vote was recorded.",
            },
            {
              icon: Globe,
              title: "Vote from Anywhere",
              desc: "Cast your vote from any device, anywhere in Nigeria, during the election window.",
            },
            {
              icon: BarChart3,
              title: "Real-Time Results",
              desc: "Watch election results update live as votes are counted transparently.",
            },
            {
              icon: CheckCircle2,
              title: "INEC Accredited",
              desc: "Built to meet INEC standards for electronic voting and biometric identification.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="feature-card flex gap-4 border border-border">
              <div className="feature-icon shrink-0 bg-primary/10 flex items-center justify-center">
                <Icon size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="civic-cta bg-primary/5 border-t border-primary/20 py-16 md:py-20">
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-semibold tracking-[0.16em] uppercase text-primary mb-3">Be part of the process</p>
          <h2 className="landing-section-heading text-foreground mb-3">Your Vote Is Your Voice</h2>
          <p className="text-muted-foreground mb-7 max-w-xl mx-auto">
            Register now to participate in shaping Nigeria's future through secure, transparent digital democracy.
          </p>
          <Link href="/register">
            <button
              data-testid="button-register-cta"
              className="px-8 py-3.5 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-md"
            >
              Register to Vote
            </button>
          </Link>
        </div>
      </section>

      <footer className="landing-footer border-t border-border py-7">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <NigeriaCoatOfArms className="w-6 h-6" />
            <span className="text-sm text-muted-foreground">Nigeria Votes — INEC Digital Platform</span>
          </div>
          <p className="text-xs text-muted-foreground">Federal Republic of Nigeria</p>
        </div>
      </footer>
    </div>
  );
}
