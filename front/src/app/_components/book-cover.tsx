"use client";

/* eslint-disable @next/next/no-img-element */

import * as React from "react";

import { cn } from "~/lib/utils";

function normalizeCssColor(color?: string | null) {
  const trimmed = color?.trim();
  if (!trimmed) return undefined;

  const hex = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  if (/^[0-9a-fA-F]{6}$/.test(hex)) return `#${hex}`;

  return trimmed;
}

function readableTextColor(hexColor: string) {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? "#111827" : "#ffffff";
}

export function BookCover({
  title,
  imageUrl,
  fallbackColor,
  className,
}: {
  title: string;
  imageUrl?: string | null;
  fallbackColor?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = React.useState(false);

  const bg = normalizeCssColor(fallbackColor);
  const text = bg?.startsWith("#") ? readableTextColor(bg) : undefined;

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt={title}
        loading="lazy"
        className={cn("h-44 w-full object-cover", className)}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-44 w-full items-center justify-center px-3 text-center text-sm font-semibold",
        className,
      )}
      style={
        bg
          ? ({ backgroundColor: bg, color: text } as const)
          : ({ backgroundColor: "hsl(var(--muted))" } as const)
      }
    >
      <span className="line-clamp-3">{title}</span>
    </div>
  );
}
