"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BookOpen,
  LayoutDashboard,
  Star,
  Store,
  Truck,
  Users,
} from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";

const nav = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/orders", label: "Orders", Icon: Truck },
  { href: "/admin/books", label: "Books", Icon: BookOpen },
  { href: "/admin/reviews", label: "Reviews", Icon: Star },
  { href: "/books", label: "Storefront", Icon: Store },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-background hidden w-64 border-r lg:block">
      <div className="flex h-16 items-center px-6">
        <Link href="/admin" className="font-semibold tracking-tight">
          Bookshop Admin
        </Link>
      </div>
      <nav className="grid gap-1 px-3">
        {nav.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Button
              key={href}
              asChild
              variant={active ? "secondary" : "ghost"}
              className={cn("justify-start gap-2", href === "/books" && "mt-2")}
            >
              <Link href={href}>
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </Button>
          );
        })}
      </nav>
      <div className="text-muted-foreground mt-6 px-6 text-xs">
        Admin endpoints are secured via Keycloak roles.
      </div>
    </aside>
  );
}
