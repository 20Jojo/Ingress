"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastApi = {
  push: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={stackStyle}>
        {toasts.map((toast) => (
          <div key={toast.id} style={{ ...toastStyle, ...toastTone[toast.type] }}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return ctx;
}

const stackStyle: React.CSSProperties = {
  position: "fixed",
  right: 16,
  bottom: 16,
  display: "grid",
  gap: 8,
  zIndex: 60,
  width: "min(360px, calc(100vw - 32px))",
};

const toastStyle: React.CSSProperties = {
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--foreground)",
  padding: "10px 12px",
  fontSize: 14,
  boxShadow: "0 3px 14px rgba(0,0,0,0.08)",
};

const toastTone: Record<ToastType, React.CSSProperties> = {
  success: {
    borderColor: "var(--ok-border)",
  },
  error: {
    borderColor: "var(--error-border)",
  },
  info: {},
};
