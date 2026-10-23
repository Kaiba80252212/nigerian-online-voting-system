import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useVerifyVoterBiometric } from "@workspace/api-client-react";
import { PublicNav } from "@/components/PublicNav";
import { BiometricCapture } from "@/components/BiometricCapture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { getVoterToken, setVoterToken } from "@/lib/auth";
import { useLocation } from "wouter";
import { ShieldCheck } from "lucide-react";

const schema = z.object({
  nin: z.string().min(11).max(11).regex(/^\d+$/),
});

export default function VerifyPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"nin" | "biometric">("nin");
  const [nin, setNinValue] = useState("");
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);

  const verify = useVerifyVoterBiometric();

  const form = useForm({ resolver: zodResolver(schema), defaultValues: { nin: "" } });

  function onNinSubmit(data: { nin: string }) {
    setNinValue(data.nin);
    setStep("biometric");
  }

  function onCapture(descriptor: number[]) {
    setFaceDescriptor(descriptor);
    verify.mutate(
      { data: { nin, faceDescriptor: descriptor } },
      {
        onSuccess: (res) => {
          setVoterToken(res.token);
          toast({ title: "Identity Verified", description: `Welcome, ${res.voter.fullName}. Your dashboard is ready.` });
          setLocation("/dashboard");
        },
        onError: (err) => {
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "Verification failed. Please try again.";
          toast({ title: "Verification Failed", description: msg, variant: "destructive" });
          setStep("nin");
          setFaceDescriptor(null);
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <div className="max-w-lg mx-auto px-4 py-8 md:py-10">
        <div className="mb-6 md:mb-8">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3 md:mb-4">
            <ShieldCheck size={22} className="text-primary" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground" data-testid="text-verify-heading">Identity Verification</h1>
          <p className="text-muted-foreground mt-1 text-sm">Verify your identity with NIN and face scan to access your dashboard</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm">
          {step === "nin" && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onNinSubmit)} className="space-y-5">
                <FormField control={form.control} name="nin" render={({ field }) => (
                  <FormItem>
                    <FormLabel>National Identification Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your 11-digit NIN"
                        maxLength={11}
                        inputMode="numeric"
                        data-testid="input-nin-verify"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" data-testid="button-nin-continue">
                  Continue to Face Scan
                </Button>
              </form>
            </Form>
          )}

          {step === "biometric" && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-foreground mb-1">NIN: <span className="text-primary">{nin}</span></p>
                <p className="text-sm text-muted-foreground mb-4">Now capture your face to verify your identity.</p>
              </div>
              {verify.isPending ? (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm text-muted-foreground">Verifying your identity...</p>
                </div>
              ) : (
                <BiometricCapture onCapture={onCapture} label="Scan Face" />
              )}
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep("nin")} className="text-muted-foreground">
                Change NIN
              </Button>
            </div>
          )}
        </div>

        {!getVoterToken() && (
          <div className="mt-4 text-center text-xs text-muted-foreground">
            Not registered yet?{" "}
            <a href="/register" className="text-primary hover:underline">Register here</a>
          </div>
        )}
      </div>
    </div>
  );
}
