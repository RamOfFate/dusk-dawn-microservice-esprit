"use client";

import * as React from "react";
import Link from "next/link";

import { PageHeader } from "~/app/_components/page-header";
import { ErrorState } from "~/app/_components/error-state";
import { useAuth } from "~/components/auth/auth-provider";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { gatewayGet } from "~/lib/gateway-client";

type RecommendationItem = {
  bookId: string;
  title: string;
  author?: string | null;
  categoryName?: string | null;
  imageUrl?: string | null;
  price?: number | null;
};

type RecommendationsResponse = {
  userId: string;
  strategy: string;
  results: RecommendationItem[];
  categories?: string[];
};

export default function RecommendationsPage() {
  const { initialized, isAuthenticated, login, token, userId } = useAuth();

  const [data, setData] = React.useState<RecommendationsResponse | null>(null);
  const [error, setError] = React.useState<unknown>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) return;
    if (!token) return;

    const uid = (userId ?? "").trim();
    if (!uid) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    void gatewayGet<RecommendationsResponse>(
      `/recommendations/user/${encodeURIComponent(uid)}?limit=12`,
      token,
    )
      .then((res) => {
        if (cancelled) return;
        setData(res ?? null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialized, isAuthenticated, token, userId]);

  if (!initialized) {
    return (
      <div className="space-y-4">
        <PageHeader title="Recommendations" description="Loading session…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Recommendations"
          description="Sign in to get personalized recommendations."
          actions={
            <button
              className={buttonVariants({ variant: "default" })}
              onClick={() => login(window.location.href)}
            >
              Sign in
            </button>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Why sign in?</CardTitle>
            <CardDescription>
              Recommendations are served by the recommendation-search-service
              and require a Keycloak access token.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm">
              After login, this page calls
              <span className="font-medium">
                {" "}
                /recommendations/user/&lt;sub&gt;
              </span>
              through the API Gateway.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} title="Recommendations are unavailable" />;
  }

  const results = data?.results ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Recommendations"
        description="Books picked for you (LLM if configured; otherwise fallback strategy)."
        actions={
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/books"
          >
            Browse catalog
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>For you</CardTitle>
          <CardDescription>
            Strategy:{" "}
            <span className="font-medium">{data?.strategy ?? "—"}</span>
            <span className="text-muted-foreground ml-2 text-xs">
              User: {(userId ?? "").trim() || "—"}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <div className="text-muted-foreground text-sm">
              {loading ? "Loading…" : "Showing recommended books"}
            </div>
            <Badge variant="outline">{results.length}</Badge>
          </div>

          {data?.categories?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {data.categories.map((c) => (
                <Badge key={c} variant="secondary">
                  {c}
                </Badge>
              ))}
            </div>
          ) : null}

          <Separator className="my-6" />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => (
              <Card key={r.bookId} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{r.title}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    {r.author ?? "Unknown author"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {r.categoryName ? (
                      <Badge variant="secondary">{r.categoryName}</Badge>
                    ) : (
                      <Badge variant="outline">No category</Badge>
                    )}
                    {r.price != null ? (
                      <Badge variant="outline">{r.price.toFixed(2)} DT</Badge>
                    ) : null}
                  </div>

                  <Link
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                    href={`/books/${encodeURIComponent(r.bookId)}`}
                  >
                    Details
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {!results.length && !loading ? (
            <div className="text-muted-foreground pt-6 text-sm">
              No recommendations yet. Create a few events (VIEW/PURCHASE) and
              try again.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
