"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { ShieldAlert } from "lucide-react";

import { ShopHeader } from "~/app/_components/shop-header";
import { AdminSidebar } from "~/app/_components/admin-sidebar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/components/auth/auth-provider";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;

  const { initialized, isAuthenticated, hasRole, login } = useAuth();

  if (!isAdminRoute) {
    return (
      <div className="min-h-dvh">
        <ShopHeader />
        <main className="container mx-auto px-4 py-10">{children}</main>
        <footer className="border-t">
          <div className="text-muted-foreground container mx-auto px-4 py-8 text-sm">
            Bookshop • Gateway-first microservices demo
          </div>
        </footer>
      </div>
    );
  }

  // Admin shell + guards
  if (!initialized) {
    return (
      <div className="min-h-dvh">
        <div className="container mx-auto px-4 py-16">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-dvh">
        <ShopHeader />
        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Admin access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-muted-foreground text-sm">
                Sign in with a Keycloak user that has the{" "}
                <span className="font-medium">admin</span> role.
              </div>
              <Button onClick={() => login()} className="w-full">
                Sign in
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!hasRole("admin")) {
    return (
      <div className="min-h-dvh">
        <ShopHeader />
        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Not authorized
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Your account does not have the admin role.
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh lg:flex">
      <AdminSidebar />
      <div className="flex-1">
        <div className="bg-background sticky top-0 z-30 h-16 border-b" />
        <main className="mx-auto w-full max-w-6xl px-4 py-10">{children}</main>
      </div>
    </div>
  );
}
