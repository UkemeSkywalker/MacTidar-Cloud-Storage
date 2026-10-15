"use client";

import { useCallback, useRef, useState } from "react";
import { api } from "@/lib/api";

export type UploadState = "queued" | "uploading" | "done" | "error" | "cancelled";

export type UploadTask = {
  key: string;
  file: File;
  parentId: string;
  name: string;
  state: UploadState;
  loaded: number;
  error?: string;
  startedAt?: number;
  uploadId?: string;
};

type Start =
  | { id: string; name: string; mode: "single"; url: string }
  | { id: string; name: string; mode: "multipart"; partSize: number; parts: { partNumber: number; url: string }[] };

const PARALLEL_FILES = 2;
const PARALLEL_PARTS = 4;

function put(url: string, body: Blob, contentType: string | undefined, onProgress: (n: number) => void, signal: AbortSignal) {
  return new Promise<string | null>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    if (contentType) xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () => (xhr.status < 300 ? resolve(xhr.getResponseHeader("ETag")) : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.onabort = () => reject(new DOMException("Cancelled", "AbortError"));
    signal.addEventListener("abort", () => xhr.abort());
    xhr.send(body);
  });
}

export function useUploads(onFileDone: () => void) {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const running = useRef(0);
  const queue = useRef<UploadTask[]>([]);
  const controllers = useRef(new Map<string, AbortController>());

  const update = useCallback((key: string, patch: Partial<UploadTask>) => {
    setTasks((ts) => ts.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  }, []);

  const run = useCallback(
    async (task: UploadTask) => {
      const ctrl = new AbortController();
      controllers.current.set(task.key, ctrl);
      update(task.key, { state: "uploading", startedAt: Date.now(), loaded: 0, error: undefined });
      let uploadId: string | undefined;
      try {
        const type = task.file.type || "application/octet-stream";
        const start = await api<Start>("/api/uploads", {
          body: { parentId: task.parentId, name: task.file.name, size: task.file.size, type },
        });
        uploadId = start.id;
        update(task.key, { name: start.name, uploadId });
        if (start.mode === "single") {
          await put(start.url, task.file, type, (n) => update(task.key, { loaded: n }), ctrl.signal);
          await api(`/api/uploads/${start.id}/complete`, { body: {} });
        } else {
          const loaded = new Map<number, number>();
          const etags: { partNumber: number; etag: string }[] = [];
          const pending = [...start.parts];
          const worker = async () => {
            for (let p = pending.shift(); p; p = pending.shift()) {
              const from = (p.partNumber - 1) * start.partSize;
              const blob = task.file.slice(from, Math.min(from + start.partSize, task.file.size));
              const etag = await put(
                p.url,
                blob,
                undefined,
                (n) => {
                  loaded.set(p!.partNumber, n);
                  update(task.key, { loaded: [...loaded.values()].reduce((a, b) => a + b, 0) });
                },
                ctrl.signal,
              );
              if (!etag) throw new Error("Upload blocked: missing ETag (check bucket CORS).");
              etags.push({ partNumber: p.partNumber, etag });
            }
          };
          await Promise.all(Array.from({ length: PARALLEL_PARTS }, worker));
          await api(`/api/uploads/${start.id}/complete`, { body: { parts: etags } });
        }
        update(task.key, { state: "done", loaded: task.file.size });
        onFileDone();
      } catch (err) {
        const cancelled = (err as Error).name === "AbortError";
        if (uploadId) api(`/api/uploads/${uploadId}`, { method: "DELETE" }).catch(() => {});
        update(task.key, { state: cancelled ? "cancelled" : "error", error: cancelled ? undefined : (err as Error).message });
      } finally {
        controllers.current.delete(task.key);
        running.current--;
        pump();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [update, onFileDone],
  );

  const pump = useCallback(() => {
    while (running.current < PARALLEL_FILES && queue.current.length) {
      running.current++;
      run(queue.current.shift()!);
    }
  }, [run]);

  const add = useCallback(
    (files: File[], parentId: string) => {
      const created = files.map((file) => ({
        key: `${Date.now()}-${Math.random()}`,
        file,
        parentId,
        name: file.name,
        state: "queued" as const,
        loaded: 0,
      }));
      setTasks((ts) => [...ts, ...created]);
      queue.current.push(...created);
      pump();
    },
    [pump],
  );

  const cancel = useCallback(
    (key: string) => {
      const ctrl = controllers.current.get(key);
      if (ctrl) ctrl.abort();
      else {
        queue.current = queue.current.filter((t) => t.key !== key);
        update(key, { state: "cancelled" });
      }
    },
    [update],
  );

  const retry = useCallback(
    (key: string) => {
      const task = tasks.find((t) => t.key === key);
      if (!task) return;
      update(key, { state: "queued", loaded: 0, error: undefined });
      queue.current.push({ ...task, state: "queued" });
      pump();
    },
    [tasks, update, pump],
  );

  const clear = useCallback(() => {
    setTasks((ts) => ts.filter((t) => t.state === "uploading" || t.state === "queued"));
  }, []);

  return { tasks, add, cancel, retry, clear };
}
