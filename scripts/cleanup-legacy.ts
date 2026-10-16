// One-off: removes data the workspaces migration left behind for rollback —
// the TEAM/SETTINGS record and the role / rootFolderId / usedBytes fields on
// user profiles (all of which now live on workspaces and memberships).
// Dry run by default; pass --apply to make the changes.
import { DeleteCommand, GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE } from "@/server/db/table";

const APPLY = process.argv.includes("--apply");
const LEGACY_FIELDS = ["role", "rootFolderId", "usedBytes"];

async function main() {
  const log: string[] = [];

  const team = (await ddb().send(new GetCommand({ TableName: TABLE(), Key: { PK: "TEAM", SK: "SETTINGS" } }))).Item;
  if (team) {
    log.push(`delete TEAM/SETTINGS (quota ${team.quotaBytes}, used ${team.usedBytes})`);
    if (APPLY) await ddb().send(new DeleteCommand({ TableName: TABLE(), Key: { PK: "TEAM", SK: "SETTINGS" } }));
  }

  let start: Record<string, unknown> | undefined;
  do {
    const res = await ddb().send(
      new QueryCommand({
        TableName: TABLE(),
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: { ":pk": "MEMBERS" },
        ExclusiveStartKey: start,
      }),
    );
    for (const u of res.Items ?? []) {
      const fields = LEGACY_FIELDS.filter((f) => f in u);
      if (!fields.length) continue;
      // Every user must have a membership before their old fields go.
      const m = await ddb().send(
        new QueryCommand({ TableName: TABLE(), IndexName: "GSI1", KeyConditionExpression: "GSI1PK = :pk", ExpressionAttributeValues: { ":pk": `USERWS#${u.id}` }, Select: "COUNT" }),
      );
      if (!m.Count) {
        log.push(`SKIP ${u.email}: no workspace membership, keeping ${fields.join(", ")}`);
        continue;
      }
      log.push(`${u.email}: remove ${fields.map((f) => `${f}=${JSON.stringify(u[f])}`).join(", ")}`);
      if (APPLY) {
        await ddb().send(
          new UpdateCommand({
            TableName: TABLE(),
            Key: { PK: u.PK, SK: u.SK },
            UpdateExpression: "REMOVE " + fields.map((f) => `#${f}`).join(", "),
            ExpressionAttributeNames: Object.fromEntries(fields.map((f) => [`#${f}`, f])),
          }),
        );
      }
    }
    start = res.LastEvaluatedKey;
  } while (start);

  console.log(`${APPLY ? "" : "[dry run] "}${log.length} change(s):`);
  for (const l of log) console.log(`  - ${l}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
