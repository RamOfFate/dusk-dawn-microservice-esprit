import Link from "next/link";

import {
  Settings,
  BookOpen,
  Layers,
  ShoppingCart,
  Star,
  Truck,
  Users,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";

const shopLinks = [
  { href: "/books", label: "Books", Icon: BookOpen },
  { href: "/categories", label: "Categories", Icon: Layers },
  { href: "/carts", label: "Cart", Icon: ShoppingCart },
];

const adminLinks = [
  { href: "/users", label: "Users", Icon: Users },
  { href: "/orders", label: "Orders", Icon: Truck },
  { href: "/reviews", label: "Reviews", Icon: Star },
];

export function SiteHeader() {
  return (
    <header className="bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold tracking-tight">
            Bookshop
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <nav className="hidden items-center gap-1 md:flex">
            {shopLinks.map(({ href, label, Icon }) => (
              <Button key={href} asChild variant="ghost" size="sm">
                <Link href={href} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </Button>
            ))}
            <Separator orientation="vertical" className="mx-1 h-6" />
            {adminLinks.map(({ href, label, Icon }) => (
              <Button key={href} asChild variant="ghost" size="sm">
                <Link href={href} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/carts" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Cart
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/users" className="gap-2">
              <Settings className="h-4 w-4" />
              Admin
            </Link>
          </Button>
        </div>
      </div>

      <nav className="container mx-auto flex flex-wrap gap-1 px-4 pb-2 md:hidden">
        {shopLinks.map(({ href, label }) => (
          <Button key={href} asChild variant="ghost" size="sm">
            <Link href={href}>{label}</Link>
          </Button>
        ))}
        <Separator className="my-1 w-full" />
        {adminLinks.map(({ href, label }) => (
          <Button key={href} asChild variant="ghost" size="sm">
            <Link href={href}>{label}</Link>
          </Button>
        ))}
      </nav>
    </header>
  );
}
