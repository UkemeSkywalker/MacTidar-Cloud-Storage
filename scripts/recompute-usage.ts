// Recalculates each workspace's and member's storage usage from the files
// themselves. Safe to run any time.
//
//   npm run recompute:usage -- --dry-run
//   npm run recompute:usage
import { ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, keys, TABLE } from "@/server/db/table";

const DRY = process.argv.includes("--dry-run");

async function main() {
  const all: Record<string, unknown>[] = [];
  let start: Record<string, unknown> | undefined;
  do {
    const res = await ddb().send(new ScanCommand({ TableName: TABLE(), ExclusiveStartKey: start }));
    all.push(...(res.Items ?? []));
    start = res.LastEvaluatedKey;
  } while (start);

  const workspaces = all.filter((r) => String(r.PK).startsWith("WS#") && r.SK === "META");
  for (const ws of workspaces) {
    const id = ws.id as string;
    const files = all.filter((r) => String(r.PK).startsWith("ITEM#") && r.SK === "META" && r.workspaceId === id && r.type === "file");
    const used = files.filter((f) => f.status === "ACTIVE" || f.status === "TRASHED");
    const reserved = files.filter((f) => f.status === "UPLOADING").reduce((a, f) => a + Number(f.size ?? 0), 0);
    const usedBytes = used.reduce((a, f) => a + Number(f.size ?? 0), 0);
    const freeBytes = Number(ws.quotaBytes) - usedBytes - reserved;
    console.log(`${id}: used ${ws.usedBytes} → ${usedBytes}, free ${ws.freeBytes} → ${freeBytes}`);
    if (!DRY) {
      await ddb().send(
        new UpdateCommand({
          TableName: TABLE(),
          Key: keys.workspace(id),
          UpdateExpression: "SET usedBytes = :u, freeBytes = :f",
          ExpressionAttributeValues: { ":u": usedBytes, ":f": freeBytes },
        }),
      );
    }
    const members = all.filter((r) => r.PK === `WS#${id}` && String(r.SK).startsWith("MEMBER#"));
    for (const m of members) {
      const mine = used.filter((f) => f.createdBy === m.userId).reduce((a, f) => a + Number(f.size ?? 0), 0);
      if (mine !== Number(m.usedBytes ?? 0)) console.log(`  member ${m.userId}: ${m.usedBytes} → ${mine}`);
      if (!DRY) {
        await ddb().send(
          new UpdateCommand({ TableName: TABLE(), Key: keys.member(id, m.userId as string), UpdateExpression: "SET usedBytes = :u", ExpressionAttributeValues: { ":u": mine } }),
        );
      }
    }
  }
  if (DRY) console.log("[dry run] no changes written");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
