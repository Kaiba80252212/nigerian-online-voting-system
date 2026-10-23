import { useState, useCallback } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RequireAdmin } from "@/components/RequireAdmin";
import { SplashLoader } from "@/components/SplashLoader";
import { PageTransitionLoader } from "@/components/PageTransitionLoader";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import RegisterPage from "@/pages/register";
import VerifyPage from "@/pages/verify";
import VotePage from "@/pages/vote";
import ResultsPage from "@/pages/results";
import ProfilePage from "@/pages/profile";
import DashboardPage from "@/pages/dashboard";
import VerifyReceiptPage from "@/pages/verify-receipt";
import CertificatePage from "@/pages/certificate";
import AdminAuditLogPage from "@/pages/admin/audit-log";
import AdminLoginPage from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminElections from "@/pages/admin/elections";
import AdminCandidates from "@/pages/admin/candidates";
import AdminVoters from "@/pages/admin/voters";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function Router() {
  return (
    <>
      <PageTransitionLoader />
      <Switch>
        {/* Public routes */}
        <Route path="/" component={LandingPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/verify" component={VerifyPage} />
        <Route path="/vote" component={VotePage} />
        <Route path="/results" component={ResultsPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/verify-receipt" component={VerifyReceiptPage} />
        <Route path="/certificate" component={CertificatePage} />

        <Route path="/admin/audit-log" component={AdminAuditLogPage} />

        {/* Admin login — public */}
        <Route path="/admin/login" component={AdminLoginPage} />

        {/* Protected admin routes */}
        <Route path="/admin/dashboard">
          <RequireAdmin><AdminDashboard /></RequireAdmin>
        </Route>
        <Route path="/admin/elections">
          <RequireAdmin><AdminElections /></RequireAdmin>
        </Route>
        <Route path="/admin/elections/:id/candidates">
          <RequireAdmin><AdminCandidates /></RequireAdmin>
        </Route>
        <Route path="/admin/voters">
          <RequireAdmin><AdminVoters /></RequireAdmin>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashComplete = useCallback(() => setSplashDone(true), []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {!splashDone && <SplashLoader onComplete={handleSplashComplete} />}
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
