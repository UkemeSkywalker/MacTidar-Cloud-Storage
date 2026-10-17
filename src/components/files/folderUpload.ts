"use client";

import { api } from "@/lib/api";

// A file plus the folder it sits in, relative to what was dropped or picked ("" = top level).
export type PickedFile = { file: File; dir: string };

const JUNK = new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);
const keep = (name: string) => !JUNK.has(name);

type Entry = FileSystemEntry;
const isDir = (e: Entry): e is FileSystemDirectoryEntry => e.isDirectory;
const isFile = (e: Entry): e is FileSystemFileEntry => e.isFile;

function readAll(dir: FileSystemDirectoryEntry): Promise<Entry[]> {
  const reader = dir.createReader();
  const out: Entry[] = [];
  // readEntries returns results in batches (about 100 at a time) until empty.
  return new Promise((resolve, reject) => {
    const next = () =>
      reader.readEntries((batch) => {
        if (!batch.length) return resolve(out);
        out.push(...batch);
        next();
      }, reject);
    next();
  });
}

async function walk(entry: Entry, dir: string, files: PickedFile[], dirs: Set<string>) {
  if (isFile(entry)) {
    if (!keep(entry.name)) return;
    const file = await new Promise<File>((res, rej) => entry.file(res, rej));
    files.push({ file, dir });
  } else if (isDir(entry)) {
    const path = dir ? `${dir}/${entry.name}` : entry.name;
    dirs.add(path);
    for (const child of await readAll(entry)) await walk(child, path, files, dirs);
  }
}

// Reads a drop, following dropped folders. Must be called synchronously from the
// drop handler (the browser clears the data transfer afterwards), hence the
// entries are taken first and walked after.
export function readDrop(dt: DataTransfer): Promise<{ files: PickedFile[]; dirs: string[] }> {
  const entries = Array.from(dt.items ?? [])
    .filter((i) => i.kind === "file")
    .map((i) => i.webkitGetAsEntry?.())
    .filter((e): e is Entry => !!e);
  const plain = entries.length ? [] : Array.from(dt.files);
  return (async () => {
    const files: PickedFile[] = plain.map((file) => ({ file, dir: "" }));
    const dirs = new Set<string>();
    for (const e of entries) await walk(e, "", files, dirs);
    return { files, dirs: [...dirs] };
  })();
}

// Files from an <input webkitdirectory> picker carry their path in webkitRelativePath.
export function readPicked(list: FileList): { files: PickedFile[]; dirs: string[] } {
  const files: PickedFile[] = [];
  const dirs = new Set<string>();
  for (const file of Array.from(list)) {
    if (!keep(file.name)) continue;
    const rel = file.webkitRelativePath || file.name;
    const dir = rel.split("/").slice(0, -1).join("/");
    if (dir) dirs.add(dir);
    files.push({ file, dir });
  }
  return { files, dirs: [...dirs] };
}

// Creates the folder structure, then hands each group of files to the uploader.
export async function uploadTree(
  picked: { files: PickedFile[]; dirs: string[] },
  parentId: string,
  add: (files: File[], parentId: string) => void,
) {
  const allDirs = new Set(picked.dirs);
  for (const f of picked.files) if (f.dir) allDirs.add(f.dir);
  let ids: Record<string, string> = {};
  if (allDirs.size) ids = (await api<{ folders: Record<string, string> }>("/api/folders/tree", { body: { parentId, paths: [...allDirs] } })).folders;
  const groups = new Map<string, File[]>();
  for (const f of picked.files) {
    const target = f.dir ? ids[f.dir] : parentId;
    groups.set(target, [...(groups.get(target) ?? []), f.file]);
  }
  for (const [target, files] of groups) add(files, target);
  return { folders: allDirs.size, files: picked.files.length };
}
