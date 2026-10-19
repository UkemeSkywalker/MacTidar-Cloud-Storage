"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { btn, Dialog } from "./Dialog";
import { Icon } from "./Icon";
import { toast } from "./toast";

// Confirmation before a personal workspace can create public links.
export function TurnOnSharingDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="max-w-[520px]"
      title="Turn on sharing?"
      icon={
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-fixed text-primary-container">
          <Icon name="share" className="text-[22px]" />
        </div>
      }
      footer={
        <>
          <button className={btn.secondary} onClick={onClose}>Cancel</button>
          <button
            className={btn.primary}
            disabled={!ack || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api("/api/workspaces/current", { method: "PATCH", body: { sharingEnabled: true } });
                toast("Sharing is on for your personal workspace");
                onDone();
              } catch (e) {
                toast((e as Error).message, { tone: "error" });
              } finally {
                setBusy(false);
              }
            }}
          >
            Turn on sharing
          </button>
        </>
      }
    >
      <ul className="mb-5 space-y-3">
        {[
          ["mail", "You can share files and folders with specific people by email."],
          ["link", "You can create public links with passwords and expiry dates."],
          ["lock", "Only items you choose are shared — everything else stays private."],
          ["toggle_off", "You can turn sharing off again at any time."],
        ].map(([icon, text]) => (
          <li key={icon} className="flex items-start gap-3 font-body-md text-[15px] text-text-primary">
            <Icon name={icon} className="mt-0.5 text-[20px] text-primary" /> {text}
          </li>
        ))}
      </ul>
      <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-surface-container-low p-4">
        <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary-container" />
        <span className="font-body-md text-body-md text-on-surface-variant">I understand that people I share with can download and keep copies of files.</span>
      </label>
    </Dialog>
  );
}
