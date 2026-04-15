import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { buttonVariants } from "~/components/ui/button";

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Bookshop
        </h1>
        <p className="text-muted-foreground max-w-2xl text-pretty">
          A microservices-based bookshop UI wired through the API Gateway.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Books</CardTitle>
            <CardDescription>
              Browse all books and popular picks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              className={buttonVariants({ variant: "default" })}
              href="/books"
            >
              Explore books
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              List and manage customer accounts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              className={buttonVariants({ variant: "secondary" })}
              href="/users"
            >
              View users
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>Track order status and totals.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              className={buttonVariants({ variant: "secondary" })}
              href="/orders"
            >
              View orders
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Carts</CardTitle>
            <CardDescription>Inspect carts and totals.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              className={buttonVariants({ variant: "secondary" })}
              href="/carts"
            >
              View carts
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
            <CardDescription>See reviews and average ratings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              className={buttonVariants({ variant: "secondary" })}
              href="/reviews"
            >
              View reviews
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
