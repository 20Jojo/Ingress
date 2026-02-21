import type { CSSProperties, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

const buttonStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    border: "1px solid var(--brand)",
    background: "var(--brand)",
    color: "var(--brand-contrast)",
    boxShadow: "var(--shadow-strong)",
  },
  secondary: {
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--foreground)",
  },
  danger: {
    border: "1px solid var(--danger-border)",
    background: "var(--surface)",
    color: "var(--danger)",
  },
};

export function PageShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <main
      className="wf-page-shell"
      style={{
        maxWidth: wide ? 1160 : 920,
        margin: "28px auto 42px",
        padding: "0 18px",
      }}
    >
      {children}
    </main>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <>
      <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>{title}</h1>
      {subtitle && <div style={{ color: "var(--text-muted)", marginBottom: 16 }}>{subtitle}</div>}
    </>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return (
    <div className="wf-row" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
      {children}
    </div>
  );
}

export function Card({
  children,
  ...props
}: { children: ReactNode } & React.HTMLAttributes<HTMLElement>) {
  const { className, ...rest } = props;
  return (
    <section
      {...rest}
      className={mergeClassNames("wf-card", className)}
      style={{
        border: "1px solid var(--border)",
        background: "var(--surface)",
        borderRadius: 14,
        boxShadow: "var(--shadow-soft)",
        padding: 14,
        ...(props.style ?? {}),
      }}
    >
      {children}
    </section>
  );
}

export function DataList({ children }: { children: ReactNode }) {
  return (
    <div className="wf-data-list"
      style={{
        marginTop: 16,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        borderRadius: 14,
        boxShadow: "var(--shadow-soft)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

export function DataRow({
  children,
  ...props
}: { children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return (
    <div
      {...rest}
      className={mergeClassNames("wf-data-row", className)}
      style={{ padding: 12, borderBottom: "1px solid var(--border-soft)", ...(props.style ?? {}) }}
    >
      {children}
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="wf-label" style={{ display: "block", marginBottom: 6 }}>
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      className={mergeClassNames("wf-input", className)}
      style={{ ...inputStyle, outline: "none", ...props.style }}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={mergeClassNames("wf-input", className)}
      style={{ ...inputStyle, minHeight: 90, resize: "vertical", outline: "none", ...props.style }}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return (
    <select
      {...rest}
      className={mergeClassNames("wf-input", className)}
      style={{ ...inputStyle, outline: "none", ...props.style }}
    />
  );
}

export function Button({
  children,
  variant = "primary",
  ...props
}: {
  children: ReactNode;
  variant?: ButtonVariant;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className, ...rest } = props;
  return (
    <button
      {...rest}
      className={mergeClassNames("wf-btn", `wf-btn-${variant}`, className)}
      style={{
        ...baseButton,
        ...buttonStyles[variant],
        opacity: props.disabled ? 0.65 : 1,
        ...(props.style ?? {}),
      }}
    >
      {children}
    </button>
  );
}

export function ErrorBox({
  children,
  ...props
}: { children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return (
    <div
      {...rest}
      className={mergeClassNames("wf-alert", "wf-alert-error", className)}
      role="alert"
      aria-live="assertive"
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 10,
        border: "1px solid var(--error-border)",
        ...(props.style ?? {}),
      }}
    >
      {children}
    </div>
  );
}

export function SuccessBox({
  children,
  ...props
}: { children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return (
    <div
      {...rest}
      className={mergeClassNames("wf-alert", "wf-alert-success", className)}
      role="status"
      aria-live="polite"
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 10,
        border: "1px solid var(--ok-border)",
        ...(props.style ?? {}),
      }}
    >
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="wf-empty" style={{ color: "var(--text-muted)" }}>
      {children}
    </div>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        display: "inline-block",
        borderRadius: "50%",
        border: "2px solid var(--border)",
        borderTopColor: "var(--brand)",
        animation: "wf-spin 0.85s linear infinite",
      }}
    />
  );
}

export function LoadingCard({ label = "Loading..." }: { label?: string }) {
  return (
    <Card role="status" aria-live="polite" aria-busy="true">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Spinner />
        <span style={{ color: "var(--text-muted)" }}>{label}</span>
      </div>
    </Card>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "color-mix(in srgb, var(--surface) 95%, var(--brand-soft) 5%)",
  color: "var(--foreground)",
};

const baseButton: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  fontWeight: 600,
  transition: "transform 120ms ease, box-shadow 160ms ease, opacity 120ms ease",
  cursor: "pointer",
};

function mergeClassNames(...parts: Array<string | undefined>): string | undefined {
  const value = parts.filter(Boolean).join(" ").trim();
  return value.length > 0 ? value : undefined;
}
