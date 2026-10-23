import { useEffect } from "react";
import { useLocation } from "wouter";
import { isAdminLoggedIn } from "@/lib/auth";

interface RequireAdminProps {
  children: React.ReactNode;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      setLocation("/admin/login");
    }
  });

  if (!isAdminLoggedIn()) {
    return null;
  }

  return <>{children}</>;
}
