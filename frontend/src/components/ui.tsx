import Link from "next/link";
import type { ReactNode } from "react";
import { IconAlert, IconCheckCircle, IconInfo } from "@/components/icons";

/**
 * Ingress component library.
 * All pages compose these primitives; styling decisions live here and in the
 * tokens in globals.css — never ad hoc on individual pages.
 */

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ───────────────────────── Page layout ───────────────────────── */

/** Standard page container: one content width and gutter for the whole app. */
export function PageShell({ children, size = "default" }: { children: ReactNode; size?: "default" | "narrow" }) {
  return (
    <main
      id="main"
      className={cx(
        "mx-auto w-full animate-fade-in px-5 pb-16 pt-8 sm:px-8 lg:px-10",
        size === "narrow" ? "max-w-[880px]" : "max-w-[1200px]",
      )}
    >
      {children}
    </main>
  );
}

/** Every page starts with this header: title, one-line description, primary actions on the right. */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  meta,
  leading,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  meta?: ReactNode;
  leading?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        {leading}
        <div className="min-w-0">
          {eyebrow && <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">{eyebrow}</div>}
          <h1 className="break-words text-[26px] font-semibold leading-tight sm:text-[28px]">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-[14.5px] text-fg-muted">{description}</p>}
          {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** A titled region within a page. */
export function Section({
  title,
  description,
  actions,
  children,
  className,
  id,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section aria-labelledby={title && id ? id : undefined} className={cx("mb-10 last:mb-0", className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            {title && (
              <h2 id={id} className="text-[16px] font-semibold">
                {title}
              </h2>
            )}
            {description && <p className="mt-0.5 text-[13.5px] text-fg-muted">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("flex flex-wrap items-center gap-2", className)}>{children}</div>;
}

/* ───────────────────────── Surfaces ───────────────────────── */

export function Card({
  children,
  className,
  padded = true,
  ...rest
}: { children: ReactNode; padded?: boolean } & React.HTMLAttributes<HTMLElement>) {
  return (
    <section {...rest} className={cx("rounded-xl border border-line bg-surface shadow-xs", padded && "p-5 sm:p-6", className)}>
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  actions,
  icon,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700" aria-hidden>
            {icon}
          </span>
        )}
        <div>
          <h3 className="text-[15px] font-semibold">{title}</h3>
          {description && <p className="mt-0.5 text-[13px] text-fg-muted">{description}</p>}
        </div>
      </div>
      {actions}
    </div>
  );
}

/* ───────────────────────── Tables ───────────────────────── */

export function Table({ children, caption }: { children: ReactNode; caption?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13.5px]">
          {caption && <caption className="sr-only">{caption}</caption>}
          {children}
        </table>
      </div>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-line bg-subtle/70">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children, className, align }: { children?: ReactNode; className?: string; align?: "right" }) {
  return (
    <th
      scope="col"
      className={cx(
        "whitespace-nowrap px-5 py-3 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-muted",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Tr({ children, className, ...rest }: { children: ReactNode } & React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr {...rest} className={cx("border-b border-line transition-colors last:border-b-0 hover:bg-brand-25", className)}>
      {children}
    </tr>
  );
}

export function Td({ children, className, align }: { children?: ReactNode; className?: string; align?: "right" }) {
  return <td className={cx("px-5 py-3.5 align-middle", align === "right" && "text-right", className)}>{children}</td>;
}

/* ───────────────────────── Forms ───────────────────────── */

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-fg-secondary">
      {children}
    </label>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="mt-1.5 text-[12.5px] text-fg-muted">{hint}</p>}
    </div>
  );
}

const fieldBase =
  "block w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-[14px] text-fg shadow-xs outline-none transition placeholder:text-fg-subtle hover:border-fg-subtle focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-subtle disabled:text-fg-muted";

export function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cx(fieldBase, "h-10", className)} />;
}

export function TextArea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={cx(fieldBase, "min-h-[96px] resize-y py-2.5", className)} />;
}

export function Select({ className, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...rest} className={cx(fieldBase, "ing-select h-10 cursor-pointer", className)} />;
}

/* ───────────────────────── Buttons ───────────────────────── */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "danger-ghost" | "danger-solid";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-brand-700 text-white shadow-xs hover:bg-brand-800 active:bg-brand-900",
  secondary: "border border-line-strong bg-surface text-fg-secondary shadow-xs hover:border-fg-subtle hover:bg-subtle hover:text-fg",
  ghost: "text-fg-secondary hover:bg-subtle hover:text-fg",
  danger: "border border-danger-200 bg-surface text-danger-700 shadow-xs hover:bg-danger-50",
  "danger-ghost": "text-danger-700 hover:bg-danger-50",
  "danger-solid": "bg-danger-600 text-white shadow-xs hover:bg-danger-700",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-md px-3 text-[13px]",
  md: "h-10 gap-2 rounded-lg px-4 text-[14px]",
  lg: "h-11 gap-2 rounded-lg px-5 text-[14.5px]",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return cx(
    "inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
    buttonVariants[variant],
    buttonSizes[size],
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...rest
}: { children: ReactNode; variant?: ButtonVariant; size?: ButtonSize } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} type={type} className={cx(buttonClass(variant, size), "cursor-pointer", className)}>
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = "secondary",
  size = "md",
  className,
  ...rest
}: { children: ReactNode; href: string; variant?: ButtonVariant; size?: ButtonSize } & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
>) {
  return (
    <Link {...rest} href={href} className={cx(buttonClass(variant, size), className)}>
      {children}
    </Link>
  );
}

export function TextLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cx("font-medium text-brand-700 hover:text-brand-800 hover:underline", className)}>
      {children}
    </Link>
  );
}

/* ───────────────────────── Feedback ───────────────────────── */

function Alert({
  tone,
  children,
  className,
  role,
  live,
  ...rest
}: {
  tone: "danger" | "success" | "info";
  children: ReactNode;
  role: "alert" | "status";
  live: "assertive" | "polite";
} & React.HTMLAttributes<HTMLDivElement>) {
  const styles = {
    danger: "border-danger-200 bg-danger-50 text-danger-700",
    success: "border-success-600/25 bg-success-50 text-success-700",
    info: "border-brand-200 bg-brand-50 text-brand-900",
  }[tone];
  const Icon = tone === "danger" ? IconAlert : tone === "success" ? IconCheckCircle : IconInfo;
  return (
    <div
      {...rest}
      role={role}
      aria-live={live}
      className={cx("my-4 flex items-start gap-3 rounded-lg border px-4 py-3 text-[13.5px]", styles, className)}
    >
      <Icon size={18} className="mt-px shrink-0" />
      <div className="min-w-0 flex-1 break-words">{children}</div>
    </div>
  );
}

export function ErrorBox(props: { children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return <Alert {...props} tone="danger" role="alert" live="assertive" />;
}

export function SuccessBox(props: { children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return <Alert {...props} tone="success" role="status" live="polite" />;
}

export function InfoBox(props: { children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return <Alert {...props} tone="info" role="status" live="polite" />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-center rounded-xl border border-dashed border-line-strong bg-surface text-center",
        compact ? "px-6 py-8" : "px-6 py-14",
      )}
    >
      {icon && (
        <span className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-700 ring-8 ring-brand-25" aria-hidden>
          {icon}
        </span>
      )}
      <div className="text-[15px] font-semibold text-fg">{title}</div>
      {description && <p className="mt-1 max-w-sm text-[13.5px] text-fg-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cx("inline-block shrink-0 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-md bg-subtle", className)} />;
}

export function LoadingCard({ label = "Loading…", rows = 4 }: { label?: string; rows?: number }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
      <span className="sr-only">{label}</span>
      <div className="border-b border-line bg-subtle/70 px-5 py-3">
        <Skeleton className="h-3 w-32" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── Badges ───────────────────────── */

export type BadgeTone = "neutral" | "brand" | "ocean" | "success" | "warning" | "danger";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-subtle text-fg-secondary ring-line-strong/70",
  brand: "bg-brand-50 text-brand-800 ring-brand-200",
  ocean: "bg-ocean-50 text-ocean-700 ring-ocean-100",
  success: "bg-success-50 text-success-700 ring-success-600/20",
  warning: "bg-warning-50 text-warning-700 ring-warning-500/30",
  danger: "bg-danger-50 text-danger-700 ring-danger-200",
};

const dotTones: Record<BadgeTone, string> = {
  neutral: "bg-fg-subtle",
  brand: "bg-brand-500",
  ocean: "bg-ocean-600",
  success: "bg-success-600",
  warning: "bg-warning-500",
  danger: "bg-danger-600",
};

export function Badge({
  children,
  tone = "neutral",
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset",
        badgeTones[tone],
        className,
      )}
    >
      {dot && <span aria-hidden className={cx("h-1.5 w-1.5 rounded-full", dotTones[tone])} />}
      {children}
    </span>
  );
}

export const STATUS_META: Record<string, { label: string; tone: BadgeTone; color: string }> = {
  Todo: { label: "To do", tone: "ocean", color: "#0369a1" },
  InProgress: { label: "In progress", tone: "warning", color: "#e0a127" },
  Done: { label: "Done", tone: "success", color: "#138a5e" },
};

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status || "Unknown", tone: "neutral" as BadgeTone };
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}

export const ROLE_META: Record<string, { tone: BadgeTone; color: string; description: string }> = {
  Owner: { tone: "ocean", color: "#075985", description: "Full control, including billing and deletion" },
  Admin: { tone: "brand", color: "#10a2a8", description: "Manages people, projects and invitations" },
  Member: { tone: "neutral", color: "#94a3b8", description: "Works on projects and tasks" },
};

export function RoleBadge({ role }: { role: string }) {
  return <Badge tone={ROLE_META[role]?.tone ?? "neutral"}>{role}</Badge>;
}

/* ───────────────────────── Metrics ───────────────────────── */

export function StatCard({
  label,
  value,
  icon,
  hint,
  hintTone = "muted",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  hintTone?: "muted" | "success" | "danger";
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[13px] font-medium text-fg-muted">{label}</div>
        {icon && (
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-700" aria-hidden>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 font-display text-[30px] font-semibold leading-none tracking-[-0.02em] text-fg">{value}</div>
      {hint && (
        <div
          className={cx(
            "mt-2 text-[12.5px]",
            hintTone === "success" ? "text-success-700" : hintTone === "danger" ? "text-danger-700" : "text-fg-muted",
          )}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <code className={cx("break-all font-mono text-[12px] text-fg-muted", className)}>{children}</code>;
}

/** Definition list used for metadata panels. */
export function MetaList({ items }: { items: { term: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-line">
      {items.map((it) => (
        <div key={it.term} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <dt className="shrink-0 text-[13px] text-fg-muted">{it.term}</dt>
          <dd className="m-0 min-w-0 text-right text-[13px] font-medium text-fg">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
