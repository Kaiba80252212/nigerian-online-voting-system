import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAdminLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { setAdminToken, isAdminLoggedIn } from "@/lib/auth";
import { useLocation } from "wouter";
import { NigeriaCoatOfArms } from "@/components/NigeriaCoatOfArms";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";

const schema = z.object({
  username: z.string().min(1, "Username required"),
  password: z.string().min(1, "Password required"),
});

export default function AdminLoginPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showPwd, setShowPwd] = useState(false);
  const login = useAdminLogin();

  // If already logged in, redirect to dashboard immediately
  useEffect(() => {
    if (isAdminLoggedIn()) {
      setLocation("/admin/dashboard");
    }
  }, [setLocation]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  function onSubmit(data: { username: string; password: string }) {
    login.mutate(
      { data },
      {
        onSuccess: (res) => {
          setAdminToken(res.token);
          setLocation("/admin/dashboard");
        },
        onError: () => {
          toast({ title: "Login Failed", description: "Invalid username or password.", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(153,60%,10%)] via-[hsl(153,50%,14%)] to-[hsl(215,30%,10%)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <NigeriaCoatOfArms className="w-14 h-14 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-white" data-testid="text-admin-login-heading">Admin Portal</h1>
          <p className="text-sm text-white/60 mt-1">Nigeria Votes — INEC Administration</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
            <ShieldCheck size={16} className="text-primary" />
            <p className="text-sm font-medium text-foreground">Secure Administrator Login</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="admin" autoComplete="username" data-testid="input-username" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPwd ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        data-testid="input-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full mt-2" disabled={login.isPending} data-testid="button-admin-login">
                {login.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-xs text-white/40 mt-6">
          Default credentials: admin / nigeria2025
        </p>
      </div>
    </div>
  );
}
