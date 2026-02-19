import type { CSSProperties, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

const buttonStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    border: "1px solid var(--brand)",
    background: "var(--brand)",
    color: "var(--brand-contrast)",
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
      style={{
        maxWidth: wide ? 1120 : 900,
        margin: "40px auto",
        padding: 16,
      }}
    >
      {children}
    </main>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>{title}</h1>
      {subtitle && <div style={{ opacity: 0.75, marginBottom: 16 }}>{subtitle}</div>}
    </>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>{children}</div>;
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <section
      style={{
        border: "1px solid var(--border)",
        background: "var(--surface)",
        borderRadius: 12,
        padding: 12,
      }}
    >
      {children}
    </section>
  );
}

export function DataList({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        marginTop: 16,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

export function DataRow({ children }: { children: ReactNode }) {
  return <div style={{ padding: 12, borderBottom: "1px solid var(--border-soft)" }}>{children}</div>;
}

export function Label({ children }: { children: ReactNode }) {
  return <label style={{ display: "block", marginBottom: 6 }}>{children}</label>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputStyle, ...props.style }} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...inputStyle, minHeight: 90, resize: "vertical", ...props.style }} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...inputStyle, ...props.style }} />;
}

export function Button({
  children,
  variant = "primary",
  ...props
}: {
  children: ReactNode;
  variant?: ButtonVariant;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
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

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 10,
        border: "1px solid var(--error-border)",
      }}
    >
      {children}
    </div>
  );
}

export function SuccessBox({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 10,
        border: "1px solid var(--ok-border)",
      }}
    >
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div style={{ color: "var(--text-muted)" }}>{children}</div>;
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
    <Card>
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
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--foreground)",
};

const baseButton: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
};
