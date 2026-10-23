import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegisterVoter } from "@workspace/api-client-react";
import { PublicNav } from "@/components/PublicNav";
import { BiometricCapture } from "@/components/BiometricCapture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { NIGERIAN_STATES, STATE_LGAS } from "@/lib/nigeria-data";
import { CheckCircle2, ArrowLeft, ArrowRight, Fingerprint, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

function calcAge(dob: string): number {
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

// Maximum selectable date: must be at least 18 years old today
function maxDobDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split("T")[0];
}

const schema = z.object({
  nin: z.string().min(11, "NIN must be 11 digits").max(11, "NIN must be 11 digits").regex(/^\d+$/, "NIN must contain only digits"),
  fullName: z.string().min(3, "Full name required"),
  dateOfBirth: z.string()
    .min(1, "Date of birth required")
    .refine((val) => calcAge(val) >= 18, {
      message: "You must be 18 years or older to register as a voter",
    }),
  state: z.string().min(1, "State required"),
  lga: z.string().min(1, "LGA required"),
  pollingUnit: z.string().min(1, "Polling unit required"),
  phoneNumber: z.string().min(11, "Phone number required"),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [success, setSuccess] = useState(false);

  const register = useRegisterVoter();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nin: "", fullName: "", dateOfBirth: "", state: "", lga: "", pollingUnit: "", phoneNumber: "" },
  });

  const selectedState = form.watch("state");
  const lgaOptions = selectedState ? (STATE_LGAS[selectedState] ?? []) : [];

  async function onSubmit(data: FormData) {
    if (!faceDescriptor) {
      toast({ title: "Biometric required", description: "Please capture your face before submitting.", variant: "destructive" });
      return;
    }
    register.mutate(
      { data: { ...data, faceDescriptor } },
      {
        onSuccess: () => setSuccess(true),
        onError: (err) => {
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "Registration failed. Please try again.";
          toast({ title: "Registration Failed", description: msg, variant: "destructive" });
        },
      }
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="registration-success mx-4 md:mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
          </div>
          <p className="register-kicker justify-center">Your details have been submitted</p>
          <h2 className="register-title mx-auto text-3xl md:text-4xl text-foreground mb-3" data-testid="text-registration-success">Registration Successful</h2>
          <p className="text-muted-foreground mb-6">Your voter registration has been submitted. Verify your identity with your face scan to cast your vote.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/verify">
              <Button data-testid="button-go-verify">Verify Identity to Vote</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="register-layout mx-auto px-4 sm:px-6">
        <aside className="register-intro">
          <p className="register-kicker"><span className="w-2 h-2 rounded-full bg-primary" />National voter registration</p>
          <h1 className="register-title text-foreground" data-testid="text-register-heading">Make your voice count.</h1>
          <p className="mt-4 max-w-md text-sm md:text-base leading-relaxed text-muted-foreground">
            Register with your NIN and biometric face data. You must be 18 years or older to vote.
          </p>

          <div className="register-step-list" aria-label="Registration steps">
            {[1, 2].map((s) => (
              <div key={s} className="register-side-step" data-active={s === step} aria-current={s === step ? "step" : undefined}>
                <span className="register-side-step-number">{s}</span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Step 0{s}</span>
                  <span className="block mt-0.5 font-semibold">{s === 1 ? "Personal information" : "Biometric capture"}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="register-assurance">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">A straightforward registration</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Have your 11-digit NIN ready. Your state and LGA help classify your voter registration.</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
              <Fingerprint size={15} className="text-primary" />
              Biometric capture is required to continue.
            </div>
          </div>
        </aside>

        <section className="register-form-column min-w-0">
          <div className="register-form-card border border-border">
            <div className="register-form-heading">
              <span className="text-base font-semibold text-foreground">{step === 1 ? "Personal information" : "Biometric capture"}</span>
              <span>Step {step} of 2</span>
            </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              {step === 1 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="nin" render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIN (11 digits)</FormLabel>
                        <FormControl><Input {...field} placeholder="11-digit NIN" maxLength={11} data-testid="input-nin" inputMode="numeric" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl><Input {...field} placeholder="080XXXXXXXX" data-testid="input-phone" inputMode="tel" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name (as on NIN)</FormLabel>
                      <FormControl><Input {...field} placeholder="Surname First Middle Name" data-testid="input-fullname" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Date of Birth
                        <span className="ml-2 text-xs font-normal text-muted-foreground">(Must be 18 or older)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          max={maxDobDate()}
                          data-testid="input-dob"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="state" render={({ field }) => (
                      <FormItem>
                        <FormLabel>State of Origin</FormLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val);
                            form.setValue("lga", "");
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-state">
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-60">
                            {NIGERIAN_STATES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="lga" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local Government Area</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!selectedState}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-lga">
                              <SelectValue placeholder={selectedState ? "Select LGA" : "Select state first"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-60">
                            {lgaOptions.map((lga) => (
                              <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="pollingUnit" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Polling Unit</FormLabel>
                      <FormControl><Input {...field} placeholder="Your polling unit name" data-testid="input-polling-unit" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button
                    type="button"
                    onClick={async () => {
                      const valid = await form.trigger();
                      if (valid) setStep(2);
                    }}
                    className="w-full"
                    data-testid="button-next-step"
                  >
                    Continue to Biometric Capture
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Biometric Face Capture</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">
                      Allow camera access and position your face clearly in the frame. Good lighting is essential.
                    </p>
                    <BiometricCapture onCapture={setFaceDescriptor} label="Open Camera" />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex items-center gap-2">
                      <ArrowLeft size={16} />Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={!faceDescriptor || register.isPending}
                      className="flex-1"
                      data-testid="button-submit-registration"
                    >
                      {register.isPending ? "Registering..." : "Complete Registration"}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </Form>
        </div>
        </section>
      </main>
    </div>
  );
}
