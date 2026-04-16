import Link from "next/link";

import { cn } from "~/lib/utils";
import type { Category } from "~/server/services/bookshop";

function normalizeCssColor(color?: string | null) {
  const trimmed = color?.trim();
  if (!trimmed) return undefined;

  // Accept: #RRGGBB or RRGGBB
  const hex = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  if (/^[0-9a-fA-F]{6}$/.test(hex)) return `#${hex}`;

  // Fallback: allow CSS named colors / rgb() / etc.
  return trimmed;
}

function readableTextColor(hexColor: string) {
  // hexColor must be #RRGGBB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Relative luminance approximation
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? "#111827" : "#ffffff"; // slate-900 vs white
}

export function CategoryBadge({
  category,
  href,
  active,
  className,
}: {
  category: Category;
  href?: string;
  active?: boolean;
  className?: string;
}) {
  const bg = normalizeCssColor(category.color);
  const text = bg?.startsWith("#") ? readableTextColor(bg) : undefined;

  const base = cn(
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition",
    active ? "ring-2 ring-offset-2" : "hover:opacity-90",
    className,
  );

  const style = bg
    ? ({
        backgroundColor: bg,
        borderColor: bg,
        color: text,
      } as const)
    : undefined;

  if (href) {
    return (
      <Link href={href} className={base} style={style}>
        {category.name}
      </Link>
    );
  }

  return (
    <span className={base} style={style}>
      {category.name}
    </span>
  );
}
