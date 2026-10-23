import { useState, useEffect, useCallback } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import {
  ScrollText, Search, RefreshCw, ChevronLeft, ChevronRight,
  Filter, X, Clock, MapPin, BarChart3, Download, ShieldCheck,
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { NIGERIAN_STATES } from "@/lib/nigeria-data";

interface AuditVoteEntry {
  id: number;
  receiptCode: string;
  electionId: number;
  electionTitle: string;
  electionType: string;
  candidateName: string;
  party: string;
  partyAbbreviation: string;
  state: string | null;
  votedAt: string;
}

interface AuditPartyBreakdown {
  partyAbbreviation: string;
  party: string;
  candidateName: string;
  voteCount: number;
  percentage: number;
}

interface AuditElectionSummary {
  electionId: number;
  electionTitle: string;
  totalVotes: number;
  partyBreakdown: AuditPartyBreakdown[];
}

interface AuditHourlyBucket {
  hour: string;
  voteCount: number;
}

interface AuditLogResponse {
  votes: AuditVoteEntry[];
  totalCount: number;
  page: number;
  totalPages: number;
  elections: AuditElectionSummary[];
  hourlyTimeline: AuditHourlyBucket[];
}

interface ElectionOption {
  id: number;
  title: string;
}

const PARTY_COLORS: Record<string, string> = {
  APC: "#1d4ed8",
  PDP: "#dc2626",
  LP: "#008751",
  NNPP: "#7c3aed",
};

function partyColor(abbr: string) {
  return PARTY_COLORS[abbr] ?? "#6b7280";
}

function getAdminToken() {
  return sessionStorage.getItem("adminToken");
}

const PARTIES = ["APC", "PDP", "LP", "NNPP"];

export default function AdminAuditLogPage() {
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [elections, setElections] = useState<ElectionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [electionId, setElectionId] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [party, setParty] = useState<string>("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"timeline" | "votes" | "breakdown">("timeline");

  const fetchData = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const token = getAdminToken();
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (electionId) params.set("electionId", electionId);
      if (state) params.set("state", state);
      if (party) params.set("party", party);

      const res = await fetch(`/api/dashboard/audit-log?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load audit log");
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [electionId, state, party, page]);

  // Also load elections list for the filter dropdown
  useEffect(() => {
    const token = getAdminToken();
    fetch("/api/elections", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((list: { id: number; title: string }[]) => setElections(list))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function applyFilters() { setPage(1); fetchData(); }
  function clearFilters() {
    setElectionId(""); setState(""); setParty(""); setPage(1);
  }
  const hasFilters = !!(electionId || state || party);

  function formatHour(h: string) {
    try {
      return new Date(h).toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit" });
    } catch { return h; }
  }

  // CSV export
  function exportCSV() {
    if (!data) return;
    const header = "ID,Receipt Code,Election,Type,Candidate,Party,State,Voted At\n";
    const rows = data.votes.map((v) =>
      [v.id, v.receiptCode, `"${v.electionTitle}"`, v.electionType, `"${v.candidateName}"`, v.partyAbbreviation, v.state ?? "", v.votedAt].join(",")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nigeria-votes-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-border px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ScrollText size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Election Audit Log</h1>
              <p className="text-xs text-muted-foreground">
                Full vote timeline · INEC integrity monitoring
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              disabled={!data || data.votes.length === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              data-testid="button-export-csv"
            >
              <Download size={14} />
              Export CSV
            </button>
            <button
              onClick={() => fetchData({ silent: true })}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              data-testid="button-refresh-audit"
            >
              <RefreshCw size={14} className={cn(refreshing && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Filters */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={14} className="text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Filter Audit Log</p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  data-testid="button-clear-filters"
                >
                  <X size={12} /> Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Election</label>
                <select
                  value={electionId}
                  onChange={(e) => setElectionId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="filter-election"
                >
                  <option value="">All elections</option>
                  {elections.map((e) => (
                    <option key={e.id} value={String(e.id)}>{e.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="filter-state"
                >
                  <option value="">All states</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Party</label>
                <select
                  value={party}
                  onChange={(e) => setParty(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="filter-party"
                >
                  <option value="">All parties</option>
                  {PARTIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <button
                onClick={applyFilters}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                data-testid="button-apply-filters"
              >
                <Search size={13} />
                Apply Filters
              </button>
            </div>
          </div>

          {/* Summary stats */}
          {data && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Votes", value: data.totalCount.toLocaleString(), icon: ScrollText, color: "bg-primary/10 text-primary" },
                { label: "Elections", value: data.elections.length, icon: BarChart3, color: "bg-blue-500/10 text-blue-600" },
                { label: "Hourly Buckets", value: data.hourlyTimeline.length, icon: Clock, color: "bg-amber-500/10 text-amber-600" },
                { label: "Integrity", value: "Verified", icon: ShieldCheck, color: "bg-green-500/10 text-green-600" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", color)}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{label}</p>
                    <p className="text-lg font-bold text-foreground">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
            {(["timeline", "votes", "breakdown"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
                  activeTab === tab
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`tab-${tab}`}
              >
                {tab === "timeline" ? "Vote Timeline" : tab === "votes" ? "Vote Log" : "Party Breakdown"}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading audit data...</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
              <p className="text-sm text-destructive font-medium">{error}</p>
              <button onClick={() => fetchData()} className="text-xs text-muted-foreground hover:underline mt-2">Try again</button>
            </div>
          )}

          {/* Timeline tab */}
          {!loading && !error && data && activeTab === "timeline" && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock size={15} className="text-primary" />
                  Votes per Hour
                  {data.hourlyTimeline.length === 0 && (
                    <span className="text-xs text-muted-foreground font-normal ml-1">— No data yet</span>
                  )}
                </p>
                {data.hourlyTimeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={data.hourlyTimeline} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="voteGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#008751" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#008751" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="hour"
                        tickFormatter={formatHour}
                        tick={{ fontSize: 11 }}
                        stroke="hsl(var(--muted-foreground))"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        stroke="hsl(var(--muted-foreground))"
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        formatter={(v: number) => [`${v} votes`, "Votes"]}
                        labelFormatter={formatHour}
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: 12,
                        }}
                      />
                      <Area type="monotone" dataKey="voteCount" stroke="#008751" strokeWidth={2} fill="url(#voteGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Cast some votes to see the timeline</p>
                  </div>
                )}
              </div>

              {/* Per-election summaries as horizontal bar charts */}
              {data.elections.map((election) => (
                <div key={election.electionId} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-start justify-between mb-4 gap-2">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{election.electionTitle}</p>
                      <p className="text-xs text-muted-foreground">{election.totalVotes.toLocaleString()} total votes recorded</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={Math.max(120, election.partyBreakdown.length * 48)}>
                    <BarChart
                      data={election.partyBreakdown}
                      layout="vertical"
                      margin={{ top: 0, right: 40, left: 50, bottom: 0 }}
                    >
                      <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                      <YAxis
                        type="category"
                        dataKey="partyAbbreviation"
                        tick={{ fontSize: 12, fontWeight: 600 }}
                        tickLine={false}
                        axisLine={false}
                        width={48}
                      />
                      <Tooltip
                        formatter={(v: number, _name, props) => [`${v} votes (${props.payload.percentage}%)`, props.payload.candidateName]}
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="voteCount" radius={[0, 6, 6, 0]} label={{ position: "right", fontSize: 11, fill: "hsl(var(--muted-foreground))" }}>
                        {election.partyBreakdown.map((pb) => (
                          <Cell key={pb.partyAbbreviation} fill={partyColor(pb.partyAbbreviation)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          )}

          {/* Vote log tab */}
          {!loading && !error && data && activeTab === "votes" && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  Vote Log
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {data.totalCount.toLocaleString()} total · page {data.page} of {data.totalPages}
                  </span>
                </p>
              </div>

              {data.votes.length === 0 ? (
                <div className="py-16 text-center">
                  <ScrollText size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No votes found for the current filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Receipt</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Election</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Candidate</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Party</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">State</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.votes.map((vote) => (
                        <tr key={vote.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{vote.receiptCode}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground text-xs leading-snug max-w-[160px] truncate" title={vote.electionTitle}>
                              {vote.electionTitle}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">{vote.electionType.replace(/_/g, " ")}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-foreground font-medium">{vote.candidateName}</td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold text-white"
                              style={{ background: partyColor(vote.partyAbbreviation) }}
                            >
                              {vote.partyAbbreviation}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin size={11} />
                              {vote.state ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(vote.votedAt).toLocaleString("en-NG", {
                              month: "short", day: "numeric",
                              hour: "2-digit", minute: "2-digit", second: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Showing {((data.page - 1) * 50) + 1}–{Math.min(data.page * 50, data.totalCount)} of {data.totalCount.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { setPage((p) => Math.max(1, p - 1)); }}
                      disabled={data.page <= 1}
                      className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-xs font-medium text-foreground px-1">
                      {data.page} / {data.totalPages}
                    </span>
                    <button
                      onClick={() => { setPage((p) => Math.min(data.totalPages, p + 1)); }}
                      disabled={data.page >= data.totalPages}
                      className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      data-testid="button-next-page"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Party breakdown tab */}
          {!loading && !error && data && activeTab === "breakdown" && (
            <div className="space-y-4">
              {data.elections.length === 0 ? (
                <div className="bg-card border border-border rounded-xl py-16 text-center">
                  <BarChart3 size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No election data to display</p>
                </div>
              ) : data.elections.map((election) => (
                <div key={election.electionId} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{election.electionTitle}</p>
                      <p className="text-xs text-muted-foreground">{election.totalVotes.toLocaleString()} votes cast</p>
                    </div>
                  </div>
                  <div className="divide-y divide-border">
                    {election.partyBreakdown.map((pb, i) => (
                      <div key={pb.partyAbbreviation} className="px-5 py-4">
                        <div className="flex items-center justify-between mb-2 gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-extrabold shrink-0"
                              style={{ background: partyColor(pb.partyAbbreviation) }}
                            >
                              {i === 0 && <span className="absolute text-[8px] -top-1 -right-1">👑</span>}
                              {pb.partyAbbreviation}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground text-sm truncate">{pb.candidateName}</p>
                              <p className="text-xs text-muted-foreground">{pb.party}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xl font-bold text-foreground">{pb.voteCount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{pb.percentage}%</p>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pb.percentage}%`, background: partyColor(pb.partyAbbreviation) }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
