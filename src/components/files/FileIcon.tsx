import { Icon } from "../Icon";

type Kind = "folder" | "pdf" | "image" | "video" | "audio" | "doc" | "sheet" | "slides" | "archive" | "code" | "text" | "file";

const STYLE: Record<Kind, { icon: string; color: string; bg: string; label: string }> = {
  folder: { icon: "folder", color: "text-file-folder", bg: "bg-primary-fixed/60", label: "Folder" },
  pdf: { icon: "picture_as_pdf", color: "text-file-pdf", bg: "bg-error-container/60", label: "PDF Document" },
  image: { icon: "image", color: "text-file-image", bg: "bg-[#f3e8ff]", label: "Image" },
  video: { icon: "movie", color: "text-file-video", bg: "bg-[#fce7f3]", label: "Video" },
  audio: { icon: "music_note", color: "text-file-video", bg: "bg-[#fce7f3]", label: "Audio" },
  doc: { icon: "description", color: "text-file-doc", bg: "bg-[#e0e7ff]", label: "Document" },
  sheet: { icon: "table_chart", color: "text-file-sheet", bg: "bg-[#dcfce7]", label: "Spreadsheet" },
  slides: { icon: "slideshow", color: "text-warning", bg: "bg-[#fef3c7]", label: "Presentation" },
  archive: { icon: "folder_zip", color: "text-file-archive", bg: "bg-surface-container-high", label: "Archive" },
  code: { icon: "code", color: "text-on-surface-variant", bg: "bg-surface-container-high", label: "Code" },
  text: { icon: "article", color: "text-on-surface-variant", bg: "bg-surface-container-high", label: "Text" },
  file: { icon: "draft", color: "text-on-surface-variant", bg: "bg-surface-container-high", label: "File" },
};

export function fileKind(type: "folder" | "file", name: string, mime?: string): Kind {
  if (type === "folder") return "folder";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const m = mime ?? "";
  if (m === "application/pdf" || ext === "pdf") return "pdf";
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (["doc", "docx", "odt", "rtf", "pages"].includes(ext)) return "doc";
  if (["xls", "xlsx", "csv", "ods", "numbers"].includes(ext)) return "sheet";
  if (["ppt", "pptx", "key", "odp"].includes(ext)) return "slides";
  if (["zip", "rar", "7z", "tar", "gz", "tgz"].includes(ext)) return "archive";
  if (["js", "ts", "tsx", "json", "py", "html", "css", "sh", "yml", "yaml", "tf", "go", "java"].includes(ext)) return "code";
  if (m.startsWith("text/") || ["txt", "md", "log"].includes(ext)) return "text";
  return "file";
}

export function kindLabel(type: "folder" | "file", name: string, mime?: string) {
  const kind = fileKind(type, name, mime);
  if (kind === "image" || kind === "video" || kind === "audio") {
    const ext = name.split(".").pop()?.toUpperCase();
    return ext && name.includes(".") ? `${ext} ${STYLE[kind].label}` : STYLE[kind].label;
  }
  return STYLE[kind].label;
}

export function FileIcon({ type, name, mime, size = "md" }: { type: "folder" | "file"; name: string; mime?: string; size?: "md" | "lg" | "xl" }) {
  const s = STYLE[fileKind(type, name, mime)];
  const box = size === "xl" ? "h-16 w-16 rounded-2xl" : size === "lg" ? "h-12 w-12 rounded-xl" : "h-10 w-10 rounded-lg";
  const icon = size === "xl" ? "text-[36px]" : size === "lg" ? "text-[26px]" : "text-[22px]";
  return (
    <div className={`${box} ${s.bg} flex shrink-0 items-center justify-center`}>
      <Icon name={s.icon} className={`${icon} ${s.color}`} />
    </div>
  );
}

export const isPreviewable = (name: string, mime?: string) =>
  ["pdf", "image", "video", "audio", "text"].includes(fileKind("file", name, mime)) && !/svg|html/i.test(mime ?? "");
