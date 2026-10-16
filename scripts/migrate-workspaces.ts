// Phase 1 migration: moves the original single team into the first company
// workspace. Additive and idempotent — see docs/architecture.md §16.5.
//
//   npm run migrate:workspaces -- --dry-run
//   npm run migrate:workspaces
import { GetCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, keys, TABLE } from "@/server/db/table";

const WS = "ws-mactidar";
const DRY = process.argv.includes("--dry-run");
type Rec = Record<string, unknown> & { PK: string; SK: string };

const log: string[] = [];
async function update(Key: { PK: string; SK: string }, expr: string, values: Record<string, unknown>, what: string) {
  log.push(what);
  if (DRY) return;
  await ddb().send(new UpdateCommand({ TableName: TABLE(), Key, UpdateExpression: expr, ExpressionAttributeValues: values }));
}

async function main() {
  const all: Rec[] = [];
  let start: Record<string, unknown> | undefined;
  do {
    const res = await ddb().send(new ScanCommand({ TableName: TABLE(), ExclusiveStartKey: start }));
    all.push(...((res.Items ?? []) as Rec[]));
    start = res.LastEvaluatedKey;
  } while (start);

  // 1. Workspace record from the old team settings.
  const team = (await ddb().send(new GetCommand({ TableName: TABLE(), Key: { PK: "TEAM", SK: "SETTINGS" } }))).Item;
  const users = all.filter((r) => r.PK.startsWith("USER#") && r.SK === "PROFILE");
  const owner = users.filter((u) => u.role === "ADMIN").sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))[0];
  const existing = (await ddb().send(new GetCommand({ TableName: TABLE(), Key: keys.workspace(WS) }))).Item;
  if (!existing) {
    if (!team || !owner) throw new Error("Missing TEAM/SETTINGS or an admin user; nothing to migrate.");
    const ws = {
      ...keys.workspace(WS),
      id: WS,
      name: "MacTidar",
      type: "COMPANY",
      ownerId: owner.id,
      status: "ACTIVE",
      quotaBytes: team.quotaBytes,
      usedBytes: team.usedBytes,
      freeBytes: team.freeBytes,
      maxFileBytes: team.maxFileBytes,
      alertPercent: team.alertPercent ?? 80,
      ...(team.alertSentAt ? { alertSentAt: team.alertSentAt } : {}),
      externalSharing: false,
      createdAt: owner.createdAt,
    };
    log.push(`create workspace ${WS} (quota ${team.quotaBytes}, used ${team.usedBytes}, owner ${owner.email})`);
    if (!DRY) await ddb().send(new PutCommand({ TableName: TABLE(), Item: ws, ConditionExpression: "attribute_not_exists(PK)" }));
  }

  // 2. Memberships from the old per-user role / root folder / usage.
  const members = new Set(all.filter((r) => r.PK === `WS#${WS}` && r.SK.startsWith("MEMBER#")).map((r) => r.SK.slice(7)));
  for (const u of users) {
    if (members.has(u.id as string) || !u.rootFolderId) continue;
    const m = {
      ...keys.member(WS, u.id as string),
      GSI1PK: `USERWS#${u.id}`,
      GSI1SK: WS,
      workspaceId: WS,
      userId: u.id,
      role: u.role ?? "MEMBER",
      status: u.status === "DISABLED" ? "DISABLED" : "ACTIVE",
      rootFolderId: u.rootFolderId,
      usedBytes: u.usedBytes ?? 0,
      joinedAt: u.createdAt,
    };
    log.push(`add member ${u.email} as ${m.role}`);
    if (!DRY) await ddb().send(new PutCommand({ TableName: TABLE(), Item: m, ConditionExpression: "attribute_not_exists(PK)" }));
  }

  // 3. Tag records with the workspace and rewrite workspace-scoped index keys.
  for (const r of all) {
    const key = { PK: r.PK, SK: r.SK };
    if (r.PK.startsWith("ITEM#") && r.SK === "META") {
      if (!r.workspaceId) await update(key, "SET workspaceId = :ws", { ":ws": WS }, `item ${r.name}: workspaceId`);
      const g2 = r.GSI2PK as string | undefined;
      if (g2?.startsWith("TRASH#") && !g2.startsWith(`TRASH#${WS}#`)) {
        await update(key, "SET GSI2PK = :pk", { ":pk": `TRASH#${WS}#${g2.slice(6)}` }, `item ${r.name}: trash index`);
      }
    } else if (r.PK.startsWith("ITEM#") && r.SK.startsWith("SHARE#")) {
      const g1 = r.GSI1PK as string;
      if (!r.workspaceId || !g1.startsWith(`SHAREDWITH#${WS}#`)) {
        await update(key, "SET workspaceId = :ws, GSI1PK = :pk", { ":ws": WS, ":pk": `SHAREDWITH#${WS}#${r.userId}` }, `share ${r.PK} → ${r.userId}`);
      }
    } else if (r.PK.startsWith("INVITE#")) {
      if (!r.workspaceId) await update(key, "SET workspaceId = :ws, GSI1PK = :pk", { ":ws": WS, ":pk": `INVITES#${WS}` }, `invite ${r.email}`);
    } else if (r.PK.startsWith("USER#") && r.SK.startsWith("RECENT#")) {
      const g2 = r.GSI2PK as string;
      if (!g2.startsWith(`RECENT#${WS}#`)) {
        await update(key, "SET GSI2PK = :pk", { ":pk": `RECENT#${WS}#${r.PK.slice(5)}` }, `recent ${r.PK} ${r.SK}`);
      }
    } else if (r.PK.startsWith("LINK#")) {
      if (!r.workspaceId) await update(key, "SET workspaceId = :ws", { ":ws": WS }, `link ${r.PK}`);
    }
  }

  console.log(`${DRY ? "[dry run] " : ""}${log.length} change(s):`);
  for (const l of log) console.log(`  - ${l}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
