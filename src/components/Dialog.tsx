"use client";

import { useEffect } from "react";
import { Icon } from "./Icon";

export function Dialog({
  open,
  onClose,
  title,
  icon,
  children,
  footer,
  width = "max-w-[520px]",
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative flex max-h-[90vh] w-full ${width} flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_10px_30px_rgba(0,0,0,0.12)]`}>
        <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
          <div className="flex items-center gap-3">
            {icon}
            <h2 className="font-headline-sm text-headline-sm text-text-primary">{title}</h2>
          </div>
          <button aria-label="Close" onClick={onClose} className="rounded-lg p-1 text-outline hover:bg-surface-container-low hover:text-text-primary">
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-3">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-3">{footer}</div>}
      </div>
    </div>
  );
}

export const btn = {
  primary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary-container px-5 font-title-md text-title-md text-on-primary shadow-sm transition-colors hover:bg-primary disabled:opacity-60",
  secondary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-surface px-5 font-title-md text-title-md text-text-primary shadow-[inset_0_0_0_1px_#E5E7EB] transition-colors hover:bg-surface-container-low disabled:opacity-60",
  danger:
    "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-danger px-5 font-title-md text-title-md text-white shadow-sm transition-colors hover:bg-error disabled:opacity-60",
  text: "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 font-title-md text-title-md text-on-surface-variant hover:bg-surface-container-low",
};
