import { listReports } from "@/server/db/abuse";
import { reportsByStatus } from "@/server/platform";
import { AbuseQueue } from "./AbuseQueue";

const TABS = { open: "OPEN", resolved: "RESOLVED", dismissed: "DISMISSED" } as const;

export default async function PlatformAbusePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "open" } = await searchParams;
  const key = (tab in TABS ? tab : "open") as keyof typeof TABS;
  const [reports, counts] = await Promise.all([
    reportsByStatus(TABS[key]),
    Promise.all(Object.values(TABS).map(async (s) => (await listReports(s)).length)),
  ]);
  return <AbuseQueue tab={key} counts={{ open: counts[0], resolved: counts[1], dismissed: counts[2] }} reports={reports} />;
}
