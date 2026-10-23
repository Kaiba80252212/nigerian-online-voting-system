import { useState, useEffect, useRef } from "react";
import { useListElections, useGetElectionResults, getGetElectionResultsQueryKey, getListElectionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PublicNav } from "@/components/PublicNav";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/nigeria-data";
import { Trophy, Users, ArrowLeft, RefreshCw, Radio, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLORS = ["#008751", "#1a6b9a", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];
const LIVE_REFRESH_MS = 30_000;

function LiveBadge({ lastUpdated }: { lastUpdated: Date | null }) {
  const [countdown, setCountdown] = useState(LIVE_REFRESH_MS / 1000);

  useEffect(() => {
    setCountdown(LIVE_REFRESH_MS / 1000);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) return LIVE_REFRESH_MS / 1000;
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-semibold text-green-600 dark:text-green-400">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        LIVE
      </span>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock size={11} />
        Refreshes in {countdown}s
      </span>
      {lastUpdated && (
        <span className="text-xs text-muted-foreground hidden sm:inline">
          · Updated {lastUpdated.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      )}
    </div>
  );
}

function AnimatedCount({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value === prevRef.current) return;
    const diff = value - prevRef.current;
    const steps = Math.min(Math.abs(diff), 20);
    const step = diff / steps;
    let current = prevRef.current;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      current += step;
      setDisplayed(Math.round(i === steps ? value : current));
      if (i >= steps) {
        clearInterval(timer);
        prevRef.current = value;
      }
    }, 40);
    return () => clearInterval(timer);
  }, [value]);

  return <>{displayed.toLocaleString()}</>;
}

export default function ResultsPage() {
  const [selectedElectionId, setSelectedElectionId] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: elections, isLoading, dataUpdatedAt: electionsUpdatedAt } = useListElections({}, {
    query: {
      queryKey: getListElectionsQueryKey(),
      refetchInterval: LIVE_REFRESH_MS,
    },
  });

  const selectedElection = selectedElectionId
    ? (elections ?? []).find((e) => e.id === selectedElectionId)
    : null;
  const isActiveElection = selectedElection?.status === "active";

  const { data: results, isLoading: loadingResults, dataUpdatedAt: resultsUpdatedAt } = useGetElectionResults(
    selectedElectionId ?? 0,
    {
      query: {
        enabled: !!selectedElectionId,
        queryKey: getGetElectionResultsQueryKey(selectedElectionId ?? 0),
        refetchInterval: isActiveElection ? LIVE_REFRESH_MS : false,
      },
    }
  );

  useEffect(() => {
    if (electionsUpdatedAt) setLastUpdated(new Date(electionsUpdatedAt));
  }, [electionsUpdatedAt]);

  useEffect(() => {
    if (resultsUpdatedAt) setLastUpdated(new Date(resultsUpdatedAt));
  }, [resultsUpdatedAt]);

  async function handleManualRefresh() {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: getListElectionsQueryKey() });
    if (selectedElectionId) {
      await queryClient.invalidateQueries({ queryKey: getGetElectionResultsQueryKey(selectedElectionId) });
    }
    setLastUpdated(new Date());
    setTimeout(() => setIsRefreshing(false), 600);
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-8 md:py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6 md:mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground" data-testid="text-results-heading">
              Election Results
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Live vote counts updated every 30 seconds</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedElectionId && isActiveElection && (
              <LiveBadge lastUpdated={lastUpdated} />
            )}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw size={13} className={cn(isRefreshing && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>

        {!selectedElectionId ? (
          <>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {elections?.map((e) => (
                  <button
                    key={e.id}
                    data-testid={`card-election-results-${e.id}`}
                    onClick={() => setSelectedElectionId(e.id)}
                    className="w-full text-left border border-border bg-card hover:border-primary/40 rounded-xl px-4 sm:px-5 py-4 transition-all group hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[e.status])}>
                            {STATUS_LABELS[e.status]}
                          </span>
                          {e.status === "active" && (
                            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                              <Radio size={11} className="animate-pulse" />
                              Live
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground capitalize">{e.type?.replace(/_/g, " ")}</span>
                        </div>
                        <p className="font-semibold text-foreground text-sm leading-snug">{e.title}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-primary">{(e.totalVotes ?? 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">votes cast</p>
                      </div>
                    </div>

                    {/* Mini progress bar for vote activity */}
                    {(e.totalVotes ?? 0) > 0 && (
                      <div className="mt-3 w-full h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(100, ((e.totalVotes ?? 0) / Math.max(...(elections?.map((x) => x.totalVotes ?? 0) ?? [1]))) * 100)}%`,
                            backgroundColor: e.status === "active" ? "#008751" : "#6b7280",
                          }}
                        />
                      </div>
                    )}
                  </button>
                ))}
                {elections?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground border border-border rounded-xl">
                    No elections found.
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedElectionId(null)}
                className="flex items-center gap-2 text-muted-foreground -ml-2"
                data-testid="button-back-elections"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">All Elections</span>
                <span className="sm:hidden">Back</span>
              </Button>

              {isActiveElection && <LiveBadge lastUpdated={lastUpdated} />}
            </div>

            {loadingResults ? (
              <div className="space-y-4">
                <div className="h-8 w-64 bg-muted animate-pulse rounded" />
                <div className="h-64 bg-muted animate-pulse rounded-xl" />
              </div>
            ) : results ? (
              <div className="space-y-5 md:space-y-6">

                {/* Election header */}
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-foreground" data-testid="text-election-title">
                    {results.election.title}
                  </h2>
                  <div className="flex items-center gap-2 sm:gap-4 mt-2 flex-wrap">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[results.election.status])}>
                      {STATUS_LABELS[results.election.status]}
                    </span>
                    {results.election.status === "active" && (
                      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-semibold">
                        <Radio size={11} className="animate-pulse" />
                        Live counting
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users size={13} />
                      <AnimatedCount value={results.totalVotes} /> votes
                    </span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <TrendingUp size={13} />
                      {results.turnoutPercentage}% turnout
                    </span>
                  </div>
                </div>

                {/* Winner banner */}
                {results.winner && results.totalVotes > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                      <Trophy size={20} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        {results.election.status === "active" ? "Currently Leading" : "Winner"}
                      </p>
                      <p className="font-bold text-foreground text-base sm:text-lg leading-tight truncate" data-testid="text-winner-name">
                        {results.winner.fullName}
                      </p>
                      <p className="text-sm text-muted-foreground">{results.winner.partyAbbreviation} — {results.winner.party}</p>
                    </div>
                    <div className="ml-auto text-right shrink-0">
                      <p className="text-2xl font-bold text-primary">
                        <AnimatedCount value={results.candidates.find((c) => c.candidate.id === results.winner?.id)?.voteCount ?? 0} />
                      </p>
                      <p className="text-xs text-muted-foreground">votes</p>
                    </div>
                  </div>
                )}

                {/* Bar chart */}
                {results.candidates.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-foreground">Vote Distribution</h3>
                      {results.election.status === "active" && (
                        <span className="text-xs text-muted-foreground">Updates every 30s</span>
                      )}
                    </div>
                    <ResponsiveContainer width="100%" height={Math.max(200, results.candidates.length * 52)}>
                      <BarChart
                        data={[...results.candidates].sort((a, b) => b.voteCount - a.voteCount)}
                        layout="vertical"
                        margin={{ left: 0, right: 30, top: 4, bottom: 4 }}
                      >
                        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} />
                        <YAxis
                          type="category"
                          dataKey="candidate.partyAbbreviation"
                          tick={{ fontSize: 12, fontWeight: 600 }}
                          width={46}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "hsl(var(--muted))" }}
                          formatter={(value, _name, props) => [
                            `${(value as number).toLocaleString()} votes (${props.payload.percentage}%)`,
                            props.payload.candidate.fullName,
                          ]}
                          contentStyle={{
                            fontSize: 12,
                            borderRadius: 8,
                            border: "1px solid hsl(var(--border))",
                            background: "hsl(var(--card))",
                            color: "hsl(var(--foreground))",
                          }}
                        />
                        <Bar dataKey="voteCount" radius={[0, 6, 6, 0]} isAnimationActive={true} animationDuration={600}>
                          {results.candidates.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Candidate breakdown */}
                <div className="space-y-2 sm:space-y-3">
                  {[...results.candidates]
                    .sort((a, b) => b.voteCount - a.voteCount)
                    .map((r, i) => (
                      <div
                        key={r.candidate.id}
                        data-testid={`card-result-${r.candidate.id}`}
                        className={cn(
                          "border rounded-xl p-3 sm:p-4 transition-all",
                          i === 0 && results.totalVotes > 0
                            ? "border-primary/30 bg-primary/3"
                            : "border-border bg-card"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <span
                              className="text-xs font-bold w-5 shrink-0"
                              style={{ color: i === 0 && results.totalVotes > 0 ? "#008751" : "hsl(var(--muted-foreground))" }}
                            >
                              #{i + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-foreground truncate">{r.candidate.fullName}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {r.candidate.partyAbbreviation} — {r.candidate.party}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-foreground text-sm sm:text-base">
                              <AnimatedCount value={r.voteCount} />
                            </p>
                            <p className="text-xs text-muted-foreground">{r.percentage}%</p>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${r.percentage}%`,
                              backgroundColor: COLORS[i % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>

                {results.election.status === "active" && (
                  <p className="text-center text-xs text-muted-foreground py-2 flex items-center justify-center gap-1.5">
                    <Radio size={11} className="text-green-500 animate-pulse" />
                    Results update automatically every 30 seconds while voting is active
                  </p>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
