"use client";

import { toast } from "@/components/toast";
import { api } from "./api";
import { formatBytes } from "./format";

type Status = { status: "PENDING" | "RUNNING" | "READY" | "FAILED"; url?: string; error?: string };

// Starts a server-side zip of a folder, waits for it, then downloads it.
export async function downloadFolderZip(name: string, base: { start: string; status: (jobId: string) => string }, folderId?: string) {
  try {
    const job = await api<{ jobId: string; files: number; totalBytes: number }>(base.start, { body: folderId ? { folderId } : {} });
    toast(`Preparing "${name}.zip" (${job.files} file${job.files === 1 ? "" : "s"}, ${formatBytes(job.totalBytes)})…`, { tone: "info" });
    const deadline = Date.now() + 16 * 60_000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000));
      const s = await api<Status>(base.status(job.jobId));
      if (s.status === "READY" && s.url) {
        const a = document.createElement("a");
        a.href = s.url;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast(`"${name}.zip" is downloading`);
        return;
      }
      if (s.status === "FAILED") throw new Error(s.error ?? "Couldn't build the zip.");
    }
    throw new Error("The zip is taking too long. Try a smaller folder.");
  } catch (err) {
    toast((err as Error).message, { tone: "error" });
  }
}

export const appZip = { start: "/api/zips", status: (id: string) => `/api/zips/${id}` };
export const linkZip = (token: string) => ({ start: `/api/public/${token}/zips`, status: (id: string) => `/api/public/${token}/zips/${id}` });
