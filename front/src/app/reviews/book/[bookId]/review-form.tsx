"use client";

import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useAuth } from "~/components/auth/auth-provider";
import { gatewayPost } from "~/lib/gateway-client";

type ReviewCreateRequest = {
  customerName: string;
  bookId: number;
  rating: number;
  comment?: string;
};

export function ReviewForm({ bookId }: { bookId: number }) {
  const { initialized, isAuthenticated, login, token, username } = useAuth();

  const [rating, setRating] = React.useState<string>("5");
  const [comment, setComment] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const ratingNum = Number(rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      setError("Rating must be a number between 1 and 5.");
      return;
    }

    if (!token) {
      setError("Please sign in to submit a review.");
      return;
    }

    const customerName = username?.trim() ?? "";
    if (!customerName) {
      setError("Missing username in your session. Please re-login.");
      return;
    }

    const payload: ReviewCreateRequest = {
      customerName,
      bookId,
      rating: ratingNum,
      comment: comment.trim() || undefined,
    };

    setSubmitting(true);
    try {
      await gatewayPost("/reviews", payload, token);
      setSuccess("Review submitted.");
      setComment("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  if (!initialized) {
    return <div className="text-muted-foreground text-sm">Loading…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-3">
        <Alert>
          <AlertTitle>Sign in required</AlertTitle>
          <AlertDescription>
            You need to sign in (customer or admin) to submit a review.
          </AlertDescription>
        </Alert>
        <Button onClick={() => login()} variant="secondary">
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn’t submit review</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert>
          <AlertTitle>Done</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="rating">Rating (1-5)</Label>
          <Input
            id="rating"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            inputMode="numeric"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="comment">Comment</Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional…"
          />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit"}
        </Button>
      </form>
    </div>
  );
}
