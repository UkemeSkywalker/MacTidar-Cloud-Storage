"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

type Toast = { id: number; message: string; tone: "success" | "error" | "info"; action?: { label: string; onClick: () => void } };

let nextId = 1;

export function toast(message: string, opts: { tone?: Toast["tone"]; action?: Toast["action"] } = {}) {
  window.dispatchEvent(
    new CustomEvent<Toast>("mt-toast", { detail: { id: nextId++, message, tone: opts.tone ?? "success", action: opts.action } }),
  );
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const t = (e as CustomEvent<Toast>).detail;
      setToasts((ts) => [...ts, t]);
      setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== t.id)), 5000);
    };
    window.addEventListener("mt-toast", onToast);
    return () => window.removeEventListener("mt-toast", onToast);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex max-w-[560px] items-center gap-3 rounded-xl bg-inverse-surface px-4 py-3 text-inverse-on-surface shadow-xl"
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${t.tone === "error" ? "bg-danger/20 text-[#fca5a5]" : t.tone === "info" ? "bg-primary-container/30 text-primary-fixed-dim" : "bg-file-sheet/20 text-tertiary-fixed-dim"}`}
          >
            <Icon name={t.tone === "error" ? "error" : t.tone === "info" ? "info" : "check"} className="text-[18px]" />
          </span>
          <span className="font-title-md text-title-md">{t.message}</span>
          {t.action && (
            <>
              <span className="h-5 w-px bg-white/20" />
              <button
                className="font-title-md text-title-md text-primary-fixed-dim hover:text-white"
                onClick={() => {
                  t.action!.onClick();
                  setToasts((ts) => ts.filter((x) => x.id !== t.id));
                }}
              >
                {t.action.label}
              </button>
            </>
          )}
          <button aria-label="Dismiss" className="ml-1 text-white/60 hover:text-white" onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))}>
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>
      ))}
    </div>
  );
}
