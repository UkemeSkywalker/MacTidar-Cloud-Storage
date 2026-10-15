export type Row = {
  id: string;
  type: "folder" | "file";
  name: string;
  size: number;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  ownerName: string;
  sharedCount: number;
  hasLink: boolean;
  starred?: boolean;
  location?: string;
};

export type Crumb = { id: string; name: string };
export type AccessRole = "VIEWER" | "EDITOR" | "OWNER";
