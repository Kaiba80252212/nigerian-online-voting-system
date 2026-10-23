import { Link } from "wouter";
import { PublicNav } from "@/components/PublicNav";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <div className="flex flex-col items-center justify-center pt-24 px-4 text-center">
        <p className="text-7xl font-bold text-primary/20 mb-4">404</p>
        <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-not-found">Page Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-sm">The page you are looking for does not exist or has been moved.</p>
        <Link href="/">
          <Button data-testid="button-go-home">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
