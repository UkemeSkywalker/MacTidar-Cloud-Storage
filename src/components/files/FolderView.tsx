"use client";

import { Icon } from "../Icon";
import { Breadcrumbs, FileBrowser, type BrowserRow } from "./FileBrowser";
import type { AccessRole, Crumb } from "./types";

export function FolderView({
  folder,
  crumbs,
  viaShare,
  rows,
  meId,
}: {
  folder: { id: string; name: string; role: AccessRole; path: string };
  crumbs: Crumb[];
  viaShare: boolean;
  rows: BrowserRow[];
  meId: string;
}) {
  const isRoot = folder.id.startsWith("root-") && !viaShare;
  return (
    <FileBrowser
      rows={rows}
      meId={meId}
      folder={folder}
      locationLabel={crumbs.map((c) => c.name).join(" / ")}
      header={
        <div className="mb-5">
          {!isRoot && <Breadcrumbs crumbs={crumbs} rootLabel={viaShare ? "Shared with me" : undefined} rootHref="/shared" />}
          <div className="flex items-center gap-3">
            <h1 className="font-headline-lg text-headline-lg text-text-primary">{isRoot ? "My Files" : folder.name}</h1>
            {viaShare && (
              <span className="flex items-center gap-1 rounded-full bg-primary-fixed px-2.5 py-0.5 font-label-md text-label-md text-primary">
                <Icon name="group" className="text-[14px]" /> {folder.role === "VIEWER" ? "Viewer" : "Editor"} access
              </span>
            )}
          </div>
        </div>
      }
    />
  );
}
