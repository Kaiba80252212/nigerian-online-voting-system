import { useState } from "react";
import { useListElections, useListCandidates, useCastVote, getListElectionsQueryKey, getListCandidatesQueryKey } from "@workspace/api-client-react";
import { PublicNav } from "@/components/PublicNav";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getVoterToken, clearVoterToken } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Vote, CheckCircle2, AlertCircle, User, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VotePage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const voterToken = getVoterToken();
  const [selectedElectionId, setSelectedElectionId] = useState<number | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [receipt, setReceipt] = useState<{ receiptCode: string; timestamp: string } | null>(null);

  const { data: elections, isLoading: loadingElections } = useListElections({ status: "active" });
  const { data: candidates, isLoading: loadingCandidates } = useListCandidates(
    selectedElectionId ?? 0,
    { query: { enabled: !!selectedElectionId, queryKey: getListCandidatesQueryKey(selectedElectionId ?? 0) } }
  );

  const castVote = useCastVote();

  if (!voterToken) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Identity Verification Required</h2>
          <p className="text-muted-foreground mb-6">You must verify your identity with biometric face scan before voting.</p>
          <Button onClick={() => setLocation("/verify")} data-testid="button-go-verify">Verify Identity</Button>
        </div>
      </div>
    );
  }

  if (receipt) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="text-vote-success">Vote Cast Successfully</h2>
          <p className="text-muted-foreground mb-6">Your vote has been recorded and encrypted. Save your receipt code.</p>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6">
            <p className="text-xs text-muted-foreground mb-1">Receipt Code</p>
            <p className="text-2xl font-mono font-bold text-primary tracking-widest" data-testid="text-receipt-code">{receipt.receiptCode}</p>
            <p className="text-xs text-muted-foreground mt-2">{new Date(receipt.timestamp).toLocaleString()}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => setLocation(`/verify-receipt?receipt=${encodeURIComponent(receipt.receiptCode)}`)}
              className="flex items-center gap-2"
              data-testid="button-verify-receipt"
            >
              <Receipt size={15} />
              Verify My Receipt
            </Button>
            <Button variant="outline" onClick={() => setLocation("/results")} data-testid="button-view-results">
              View Live Results
            </Button>
            <Button
              onClick={() => setLocation(`/certificate?receipt=${encodeURIComponent(receipt.receiptCode)}`)}
              className="flex items-center gap-2"
              data-testid="button-get-certificate"
            >
              <Receipt size={15} />
              Get Certificate
            </Button>
            <Button variant="outline" onClick={() => setLocation("/dashboard")} data-testid="button-view-dashboard">
              My Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  function handleConfirmVote() {
    if (!selectedElectionId || !selectedCandidateId || !voterToken) return;
    castVote.mutate(
      { data: { electionId: selectedElectionId, candidateId: selectedCandidateId, voterToken } },
      {
        onSuccess: (res) => {
          clearVoterToken();
          setReceipt({ receiptCode: res.receiptCode, timestamp: res.timestamp });
          setConfirmOpen(false);
          queryClient.invalidateQueries({ queryKey: getListElectionsQueryKey() });
        },
        onError: (err) => {
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to cast vote.";
          toast({ title: "Vote Failed", description: msg, variant: "destructive" });
          setConfirmOpen(false);
        },
      }
    );
  }

  const selectedCandidate = candidates?.find((c) => c.id === selectedCandidateId);
  const selectedElection = elections?.find((e) => e.id === selectedElectionId);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <Vote size={24} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-vote-heading">Cast Your Vote</h1>
          <p className="text-muted-foreground mt-1">Select an election, then choose your candidate</p>
        </div>

        {/* Election selection */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Step 1: Select Election</h2>
          {loadingElections ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : elections?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border border-border rounded-xl">
              No active elections at this time.
            </div>
          ) : (
            <div className="space-y-3">
              {elections?.map((e) => (
                <button
                  key={e.id}
                  data-testid={`card-election-${e.id}`}
                  onClick={() => { setSelectedElectionId(e.id); setSelectedCandidateId(null); }}
                  className={cn(
                    "w-full text-left border rounded-xl px-5 py-4 transition-all",
                    selectedElectionId === e.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{e.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{e.type?.replace(/_/g, " ")} • {e.candidateCount} candidates</p>
                    </div>
                    {selectedElectionId === e.id && <CheckCircle2 size={18} className="text-primary shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Candidate selection */}
        {selectedElectionId && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-3">Step 2: Select Candidate</h2>
            {loadingCandidates ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {candidates?.map((c) => (
                  <button
                    key={c.id}
                    data-testid={`card-candidate-${c.id}`}
                    onClick={() => setSelectedCandidateId(c.id)}
                    className={cn(
                      "text-left border rounded-xl p-4 transition-all",
                      selectedCandidateId === c.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        {c.photoUrl ? (
                          <img src={c.photoUrl} alt={c.fullName} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <User size={18} className="text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{c.fullName}</p>
                        <p className="text-xs text-muted-foreground">{c.partyAbbreviation} — {c.party}</p>
                        {c.state && <p className="text-xs text-muted-foreground">{c.state}</p>}
                      </div>
                      {selectedCandidateId === c.id && <CheckCircle2 size={16} className="text-primary ml-auto shrink-0" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedCandidateId && selectedElectionId && (
          <Button
            className="w-full"
            onClick={() => setConfirmOpen(true)}
            data-testid="button-confirm-vote"
          >
            Review and Cast Vote
          </Button>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Vote</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="bg-muted/50 rounded-lg px-4 py-3">
              <p className="text-xs text-muted-foreground">Election</p>
              <p className="font-semibold text-foreground text-sm mt-0.5">{selectedElection?.title}</p>
            </div>
            <div className="bg-muted/50 rounded-lg px-4 py-3">
              <p className="text-xs text-muted-foreground">Your Candidate</p>
              <p className="font-semibold text-foreground text-sm mt-0.5">{selectedCandidate?.fullName}</p>
              <p className="text-xs text-muted-foreground">{selectedCandidate?.partyAbbreviation} — {selectedCandidate?.party}</p>
            </div>
            <p className="text-xs text-muted-foreground text-center pt-1">
              This action is irreversible. Once submitted, your vote cannot be changed.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} data-testid="button-cancel-vote">Cancel</Button>
            <Button
              onClick={handleConfirmVote}
              disabled={castVote.isPending}
              data-testid="button-submit-vote"
            >
              {castVote.isPending ? "Casting..." : "Cast My Vote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
