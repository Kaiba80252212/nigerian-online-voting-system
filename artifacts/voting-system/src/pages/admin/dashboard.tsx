import { useGetDashboardStats, useGetRecentActivity, useGetVoterTurnout } from "@workspace/api-client-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Users, Vote, Activity, CheckCircle2, TrendingUp, UserPlus } from "lucide-react";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5" data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}

const ACTIVITY_ICONS: Record<string, typeof Activity> = {
  voter_registered: UserPlus,
  vote_cast: Vote,
  election_created: Activity,
  election_started: TrendingUp,
  election_ended: CheckCircle2,
};

const COLORS = ["#008751", "#1a6b9a", "#f59e0b", "#8b5cf6", "#ef4444"];

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity } = useGetRecentActivity();
  const { data: turnout } = useGetVoterTurnout();

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-heading">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">System-wide statistics and recent activity</p>
          </div>

          {/* Stats */}
          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <StatCard label="Total Voters" value={stats.totalVoters} icon={Users} color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
              <StatCard label="Verified Voters" value={stats.verifiedVoters} icon={CheckCircle2} color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" />
              <StatCard label="Total Elections" value={stats.totalElections} icon={Activity} color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
              <StatCard label="Active Elections" value={stats.activeElections} icon={TrendingUp} color="bg-primary/10 text-primary" />
              <StatCard label="Votes Cast" value={stats.totalVotesCast} icon={Vote} color="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" />
              <StatCard label="Registered Today" value={stats.registeredToday} icon={UserPlus} color="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400" />
            </div>
          ) : null}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Voter Turnout by State */}
            {turnout && turnout.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4">Voter Turnout by State</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={turnout.slice(0, 10)} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="state" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Turnout"]}
                      contentStyle={{ fontSize: 11 }}
                    />
                    <Bar dataKey="turnoutPercentage" radius={[0, 3, 3, 0]}>
                      {turnout.slice(0, 10).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h2>
              {!activity || activity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {activity.map((a) => {
                    const Icon = ACTIVITY_ICONS[a.type] ?? Activity;
                    return (
                      <div key={a.id} data-testid={`activity-${a.id}`} className="flex items-start gap-3">
                        <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          <Icon size={13} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-foreground leading-snug">{a.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {a.state && <span className="text-xs text-muted-foreground">{a.state}</span>}
                            <span className="text-xs text-muted-foreground">
                              {new Date(a.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
