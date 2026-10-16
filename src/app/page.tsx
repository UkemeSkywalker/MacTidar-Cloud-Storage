import { redirect } from "next/navigation";
import { HomePage } from "./(marketing)/HomePage";
import { currentUser } from "@/server/session";

export const metadata = {
  title: "MacTidar Cloud — Your work, safely in one place",
  description: "Free cloud storage for you and your team. Store, preview and share files — 3 GB free, data stored in Africa.",
};

export default async function Home() {
  if (await currentUser()) redirect("/files");
  return <HomePage />;
}
