import { useState } from "react";
import {
  useListElections, useCreateElection, useUpdateElection, useDeleteElection,
  getListElectionsQueryKey,
} from "@workspace/api-client-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { STATUS_COLORS, STATUS_LABELS, ELECTION_TYPES } from "@/lib/nigeria-data";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Users, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const schema = z.object({
  title: z.string().min(3, "Title required"),
  description: z.string().optional(),
  type: z.string().min(1, "Type required"),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().min(1, "End date required"),
  status: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function AdminElections() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: elections, isLoading } = useListElections();
  const createElection = useCreateElection();
  const updateElection = useUpdateElection();
  const deleteElection = useDeleteElection();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", type: "", startDate: "", endDate: "", status: "upcoming" },
  });

  function openCreate() {
    setEditId(null);
    form.reset({ title: "", description: "", type: "", startDate: "", endDate: "", status: "upcoming" });
    setModalOpen(true);
  }

  function openEdit(e: { id: number; title: string; description?: string | null; type: string; startDate: string; endDate: string; status: string }) {
    setEditId(e.id);
    form.reset({ title: e.title, description: e.description ?? "", type: e.type, startDate: e.startDate, endDate: e.endDate, status: e.status });
    setModalOpen(true);
  }

  function onSubmit(data: FormData) {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getListElectionsQueryKey() });
    if (editId) {
      updateElection.mutate(
        { id: editId, data },
        {
          onSuccess: () => { setModalOpen(false); invalidate(); toast({ title: "Election updated" }); },
          onError: () => toast({ title: "Update failed", variant: "destructive" }),
        }
      );
    } else {
      createElection.mutate(
        { data: { title: data.title, description: data.description, type: data.type, startDate: data.startDate, endDate: data.endDate } },
        {
          onSuccess: () => { setModalOpen(false); invalidate(); toast({ title: "Election created" }); },
          onError: () => toast({ title: "Create failed", variant: "destructive" }),
        }
      );
    }
  }

  function confirmDelete() {
    if (!deleteId) return;
    deleteElection.mutate(
      { id: deleteId },
      {
        onSuccess: () => {
          setDeleteId(null);
          queryClient.invalidateQueries({ queryKey: getListElectionsQueryKey() });
          toast({ title: "Election deleted" });
        },
        onError: () => toast({ title: "Delete failed", variant: "destructive" }),
      }
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-elections-heading">Elections</h1>
              <p className="text-muted-foreground text-sm mt-1">Create and manage elections</p>
            </div>
            <Button onClick={openCreate} className="flex items-center gap-2" data-testid="button-create-election">
              <Plus size={16} />New Election
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {elections?.map((e) => (
                <div key={e.id} data-testid={`row-election-${e.id}`} className="border border-border bg-card rounded-xl px-5 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[e.status])}>
                        {STATUS_LABELS[e.status]}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">{e.type?.replace(/_/g, " ")}</span>
                    </div>
                    <p className="font-semibold text-foreground text-sm">{e.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {e.startDate} — {e.endDate} · {e.candidateCount} candidates · {e.totalVotes} votes
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/admin/elections/${e.id}/candidates`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs" data-testid={`button-candidates-${e.id}`}>
                        <Users size={13} />Candidates<ChevronRight size={12} />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(e)} data-testid={`button-edit-${e.id}`}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(e.id)} className="text-destructive hover:text-destructive" data-testid={`button-delete-${e.id}`}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
              {elections?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                  No elections yet. Create your first one.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Election" : "Create Election"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} placeholder="2027 Presidential Election" data-testid="input-election-title" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl><Textarea {...field} rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Election Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-election-type"><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {ELECTION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl><Input {...field} type="date" data-testid="input-start-date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="endDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl><Input {...field} type="date" data-testid="input-end-date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              {editId && (
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="ended">Ended</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createElection.isPending || updateElection.isPending} data-testid="button-save-election">
                  {editId ? "Save Changes" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Election</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">This will permanently delete the election and all associated candidates and votes. This action cannot be undone.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteElection.isPending} data-testid="button-confirm-delete">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
