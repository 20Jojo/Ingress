import { useId } from "react";

/**
 * Ingress brand assets and restrained visual primitives.
 * No illustrations: just the mark, initials avatars and one subtle
 * contour-line texture used sparingly on brand surfaces.
 */

export function IngressMark({ size = 32, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden focusable={false}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#48DDE0" />
          <stop offset="0.5" stopColor="#10A2A8" />
          <stop offset="1" stopColor="#075985" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${id}-g)`} />
      <path d="M8 16h10.5M14 11.5l4.5 4.5-4.5 4.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23 9v14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

export function IngressLogo({ size = 32, tone = "dark" }: { size?: number; tone?: "dark" | "light" }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={tone === "light" ? "rounded-[9px] ring-1 ring-white/45" : undefined}>
        <IngressMark size={size} className="block" />
      </span>
      <span
        className={`font-display text-[19px] font-bold tracking-[-0.02em] ${tone === "light" ? "text-white" : "text-fg"}`}
      >
        Ingress
      </span>
    </span>
  );
}

/* ───────────────────────── Avatars ───────────────────────── */

const AVATAR_TONES = [
  { bg: "#DDF8F5", fg: "#0D6570" },
  { bg: "#D6EEF8", fg: "#0B4A6C" },
  { bg: "#E2F3F1", fg: "#0E4F59" },
  { bg: "#E7EFF5", fg: "#334A56" },
  { bg: "#D9F2F4", fg: "#075985" },
];

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function initials(label: string | null | undefined): string {
  const clean = (label || "").trim();
  if (!clean) return "?";
  const base = clean.includes("@") ? clean.split("@")[0] : clean;
  const parts = base.split(/[\s._-]+/).filter((p) => /[\p{L}\p{N}]/u.test(p));
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0] ?? base).slice(0, 2).toUpperCase();
}

export function Avatar({
  seed,
  label,
  size = 32,
  shape = "circle",
}: {
  seed: string;
  label?: string | null;
  size?: number;
  shape?: "circle" | "square";
}) {
  const tone = AVATAR_TONES[hashString(seed || "x") % AVATAR_TONES.length];
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 select-none place-items-center font-semibold"
      style={{
        width: size,
        height: size,
        background: tone.bg,
        color: tone.fg,
        borderRadius: shape === "circle" ? 9999 : Math.round(size * 0.25),
        fontSize: Math.max(10, Math.round(size * 0.38)),
        letterSpacing: "0.02em",
      }}
    >
      {initials(label || seed)}
    </span>
  );
}

/* ───────────────────────── Texture ───────────────────────── */

/** Fine contour lines, like light refracting on shallow water. Decorative only. */
export function ContourLines({ className, stroke = "#ffffff", opacity = 0.18 }: { className?: string; stroke?: string; opacity?: number }) {
  const lines = Array.from({ length: 14 }, (_, i) => {
    const y = 40 + i * 42;
    const a = 18 + (i % 4) * 6;
    return `M-20 ${y} C 120 ${y - a}, 260 ${y + a}, 400 ${y} S 680 ${y - a}, 820 ${y + a * 0.6}`;
  });
  return (
    <svg className={className} viewBox="0 0 800 640" preserveAspectRatio="xMidYMid slice" aria-hidden focusable={false}>
      <g fill="none" stroke={stroke} strokeWidth="1" opacity={opacity}>
        {lines.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}
