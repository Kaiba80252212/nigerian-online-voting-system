import { useState } from "react";
import { useParams } from "wouter";
import {
  useGetElection, useListCandidates, useCreateCandidate, useUpdateCandidate, useDeleteCandidate,
  getListCandidatesQueryKey, getGetElectionQueryKey,
} from "@workspace/api-client-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { NIGERIAN_STATES } from "@/lib/nigeria-data";
import { Plus, Pencil, Trash2, User, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const schema = z.object({
  fullName: z.string().min(3),
  party: z.string().min(2),
  partyAbbreviation: z.string().min(1).max(10),
  state: z.string().optional(),
  photoUrl: z.string().optional(),
  manifesto: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function AdminCandidates() {
  const params = useParams<{ id: string }>();
  const electionId = parseInt(params.id ?? "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: election } = useGetElection(electionId, { query: { enabled: !!electionId, queryKey: getGetElectionQueryKey(electionId) } });
  const { data: candidates, isLoading } = useListCandidates(electionId, { query: { enabled: !!electionId, queryKey: getListCandidatesQueryKey(electionId) } });
  const createCandidate = useCreateCandidate();
  const updateCandidate = useUpdateCandidate();
  const deleteCandidate = useDeleteCandidate();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", party: "", partyAbbreviation: "", state: "", photoUrl: "", manifesto: "" },
  });

  function openCreate() {
    setEditId(null);
    form.reset({ fullName: "", party: "", partyAbbreviation: "", state: "", photoUrl: "", manifesto: "" });
    setModalOpen(true);
  }

  function openEdit(c: { id: number; fullName: string; party: string; partyAbbreviation: string; state?: string | null; photoUrl?: string | null; manifesto?: string | null }) {
    setEditId(c.id);
    form.reset({ fullName: c.fullName, party: c.party, partyAbbreviation: c.partyAbbreviation, state: c.state ?? "", photoUrl: c.photoUrl ?? "", manifesto: c.manifesto ?? "" });
    setModalOpen(true);
  }

  function onSubmit(data: FormData) {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getListCandidatesQueryKey(electionId) });
    if (editId) {
      updateCandidate.mutate(
        { electionId, id: editId, data },
        {
          onSuccess: () => { setModalOpen(false); invalidate(); toast({ title: "Candidate updated" }); },
          onError: () => toast({ title: "Failed", variant: "destructive" }),
        }
      );
    } else {
      createCandidate.mutate(
        { electionId, data },
        {
          onSuccess: () => { setModalOpen(false); invalidate(); toast({ title: "Candidate added" }); },
          onError: () => toast({ title: "Failed", variant: "destructive" }),
        }
      );
    }
  }

  function confirmDelete() {
    if (!deleteId) return;
    deleteCandidate.mutate(
      { electionId, id: deleteId },
      {
        onSuccess: () => {
          setDeleteId(null);
          queryClient.invalidateQueries({ queryKey: getListCandidatesQueryKey(electionId) });
          toast({ title: "Candidate removed" });
        },
        onError: () => toast({ title: "Failed", variant: "destructive" }),
      }
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="mb-7">
            <Link href="/admin/elections">
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors" data-testid="button-back">
                <ArrowLeft size={15} />Elections
              </button>
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground" data-testid="text-candidates-heading">
                  {election?.title ?? "Candidates"}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">Manage candidates for this election</p>
              </div>
              <Button onClick={openCreate} className="flex items-center gap-2" data-testid="button-add-candidate">
                <Plus size={16} />Add Candidate
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates?.map((c) => (
                <div key={c.id} data-testid={`card-candidate-${c.id}`} className="border border-border bg-card rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      {c.photoUrl ? (
                        <img src={c.photoUrl} alt={c.fullName} className="w-11 h-11 rounded-full object-cover" />
                      ) : (
                        <User size={20} className="text-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground leading-tight">{c.fullName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.partyAbbreviation} — {c.party}</p>
                      {c.state && <p className="text-xs text-muted-foreground">{c.state}</p>}
                    </div>
                  </div>
                  {c.manifesto && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{c.manifesto}</p>}
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)} className="flex items-center gap-1.5 text-xs flex-1" data-testid={`button-edit-candidate-${c.id}`}>
                      <Pencil size={12} />Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(c.id)} className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive" data-testid={`button-delete-candidate-${c.id}`}>
                      <Trash2 size={12} />Remove
                    </Button>
                  </div>
                </div>
              ))}
              {candidates?.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                  No candidates yet. Add the first one.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Candidate" : "Add Candidate"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input {...field} placeholder="Surname First Middle Name" data-testid="input-candidate-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="party" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Party Name</FormLabel>
                    <FormControl><Input {...field} placeholder="All Progressives Congress" data-testid="input-party" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="partyAbbreviation" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Party Code</FormLabel>
                    <FormControl><Input {...field} placeholder="APC" maxLength={10} data-testid="input-party-abbr" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="state" render={({ field }) => (
                <FormItem>
                  <FormLabel>State (optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {NIGERIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="photoUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo URL (optional)</FormLabel>
                  <FormControl><Input {...field} placeholder="https://..." data-testid="input-photo-url" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="manifesto" render={({ field }) => (
                <FormItem>
                  <FormLabel>Manifesto Summary (optional)</FormLabel>
                  <FormControl><Textarea {...field} rows={2} data-testid="input-manifesto" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createCandidate.isPending || updateCandidate.isPending} data-testid="button-save-candidate">
                  {editId ? "Save" : "Add Candidate"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove Candidate</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">This will permanently remove the candidate from the election.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteCandidate.isPending} data-testid="button-confirm-delete-candidate">
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
