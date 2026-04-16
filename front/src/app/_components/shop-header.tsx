"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  BookOpen,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Search,
  Shield,
  ShoppingCart,
  Sparkles,
  Tags,
  Truck,
  User,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import { useAuth } from "~/components/auth/auth-provider";

const shopLinks = [
  { href: "/books", label: "Books", Icon: BookOpen },
  { href: "/categories", label: "Categories", Icon: Tags },
  { href: "/carts", label: "Cart", Icon: ShoppingCart },
  { href: "/orders", label: "Orders", Icon: Truck },
  { href: "/search", label: "Search", Icon: Search },
  { href: "/recommendations", label: "For you", Icon: Sparkles },
];

function initials(value: string | null) {
  if (!value) return "?";
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

function ShopHeaderFallback() {
  return (
    <header className="bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur" />
  );
}

export function ShopHeader() {
  return (
    <React.Suspense fallback={<ShopHeaderFallback />}>
      <ShopHeaderInner />
    </React.Suspense>
  );
}

function ShopHeaderInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    initialized,
    isAuthenticated,
    username,
    roles,
    login,
    logout,
    hasRole,
  } = useAuth();

  const [query, setQuery] = React.useState(searchParams.get("q") ?? "");

  React.useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      router.push("/search");
      return;
    }
    const params = new URLSearchParams();
    params.set("q", q);
    router.push(`/search?${params.toString()}`);
  }

  const showAdmin = hasRole("admin");

  return (
    <header className="bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="bg-primary text-primary-foreground inline-flex h-8 w-8 items-center justify-center rounded-lg">
              B
            </span>
            <span className="hidden sm:inline">Bookshop</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {shopLinks.map(({ href, label, Icon }) => {
              const active =
                pathname === href || pathname?.startsWith(`${href}/`);
              return (
                <Button
                  key={href}
                  asChild
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                >
                  <Link href={href} className="gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>

        <div className="hidden flex-1 items-center justify-center md:flex">
          <form onSubmit={onSubmit} className="relative w-full max-w-md">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, authors…"
              className="pl-9"
            />
          </form>
        </div>

        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <div className="p-6">
                <div className="font-semibold">Bookshop</div>
                <div className="text-muted-foreground mt-1 text-sm">
                  Browse & manage the store
                </div>
              </div>
              <Separator />
              <div className="grid gap-1 p-2">
                {shopLinks.map(({ href, label, Icon }) => (
                  <Button
                    key={href}
                    asChild
                    variant="ghost"
                    className="justify-start"
                  >
                    <Link href={href} className="gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  </Button>
                ))}
                {showAdmin ? (
                  <>
                    <Separator className="my-2" />
                    <Button asChild variant="ghost" className="justify-start">
                      <Link href="/admin" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Admin
                      </Link>
                    </Button>
                  </>
                ) : null}
              </div>
            </SheetContent>
          </Sheet>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden md:inline-flex"
          >
            <Link href="/search" className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Account">
                <Avatar>
                  <AvatarFallback>{initials(username)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{username ?? "Guest"}</span>
                </div>
                {roles.length ? (
                  <div className="text-muted-foreground text-xs">
                    {roles.join(", ")}
                  </div>
                ) : null}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {showAdmin ? (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Admin dashboard
                  </Link>
                </DropdownMenuItem>
              ) : null}

              {initialized && isAuthenticated ? (
                <DropdownMenuItem onClick={() => logout()} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => login()} className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign in
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-3 md:hidden">
        <form onSubmit={onSubmit} className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, authors…"
            className="pl-9"
          />
        </form>
      </div>
    </header>
  );
}
