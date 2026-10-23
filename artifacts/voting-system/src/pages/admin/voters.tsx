import { useState } from "react";
import { useListVoters, getListVotersQueryKey } from "@workspace/api-client-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { STATUS_COLORS, STATUS_LABELS, NIGERIAN_STATES } from "@/lib/nigeria-data";
import { cn } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight, Users } from "lucide-react";

export default function AdminVoters() {
  const [page, setPage] = useState(1);
  const [stateFilter, setStateFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading } = useListVoters(
    { page, limit: 20, state: stateFilter || undefined, status: statusFilter || undefined },
    { query: { queryKey: getListVotersQueryKey({ page, limit: 20, state: stateFilter || undefined, status: statusFilter || undefined }) } }
  );

  const queryClient = useQueryClient();

  function clearFilters() {
    setStateFilter("");
    setStatusFilter("");
    setPage(1);
    queryClient.invalidateQueries({ queryKey: getListVotersQueryKey() });
  }

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-voters-heading">Registered Voters</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {data ? `${data.total.toLocaleString()} total voters` : "Loading..."}
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by state..." className="pl-8 w-48" value={stateFilter} onChange={(e) => { setStateFilter(e.target.value); setPage(1); }} data-testid="input-search-state" />
            </div>
            <Select value={stateFilter} onValueChange={(v) => { setStateFilter(v === "_all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-44" data-testid="select-state-filter">
                <SelectValue placeholder="Filter by state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All states</SelectItem>
                {NIGERIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "_all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All statuses</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="voted">Voted</SelectItem>
              </SelectContent>
            </Select>
            {(stateFilter || statusFilter) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                Clear filters
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Full Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">NIN</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">State</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">LGA</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Registered</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-muted animate-pulse rounded w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data?.voters.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Users size={32} className="mx-auto mb-2 opacity-30" />
                      No voters found
                    </td>
                  </tr>
                ) : (
                  data?.voters.map((v) => (
                    <tr key={v.id} data-testid={`row-voter-${v.id}`} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{v.fullName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{v.nin}</td>
                      <td className="px-4 py-3 text-muted-foreground">{v.state}</td>
                      <td className="px-4 py-3 text-muted-foreground">{v.lga}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[v.status])}>
                          {STATUS_LABELS[v.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.total > 20 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} data-testid="button-prev-page">
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} data-testid="button-next-page">
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
