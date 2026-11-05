"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { IconAlert, IconCheckCircle, IconInfo, IconX } from "@/components/icons";

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

const TONE: Record<ToastType, { icon: ReactNode; accent: string; title: string }> = {
  success: { icon: <IconCheckCircle size={18} />, accent: "text-success-600", title: "Success" },
  error: { icon: <IconAlert size={18} />, accent: "text-danger-600", title: "Something went wrong" },
  info: { icon: <IconInfo size={18} />, accent: "text-brand-600", title: "Notice" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => dismiss(id), 3600);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-5 right-5 z-[60] grid w-[min(380px,calc(100vw-40px))] gap-2.5"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => {
          const tone = TONE[toast.type];
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex animate-fade-in items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-lg"
              role={toast.type === "error" ? "alert" : "status"}
              aria-live={toast.type === "error" ? "assertive" : "polite"}
            >
              <span className={`mt-px shrink-0 ${tone.accent}`}>{tone.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-fg">{tone.title}</div>
                <div className="mt-0.5 break-words text-[13px] text-fg-muted">{toast.message}</div>
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="-mr-1 grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded text-fg-subtle hover:bg-subtle hover:text-fg"
              >
                <IconX size={14} />
              </button>
            </div>
          );
        })}
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
