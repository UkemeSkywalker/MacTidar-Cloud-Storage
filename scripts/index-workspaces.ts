// One-off: adds the platform admin index (GSI2 "WORKSPACES") to existing workspaces.
import { ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE } from "@/server/db/table";

async function main() {
  let start: Record<string, unknown> | undefined;
  let count = 0;
  do {
    const res = await ddb().send(
      new ScanCommand({
        TableName: TABLE(),
        FilterExpression: "begins_with(PK, :ws) AND SK = :meta",
        ExpressionAttributeValues: { ":ws": "WS#", ":meta": "META" },
        ExclusiveStartKey: start,
      }),
    );
    for (const w of res.Items ?? []) {
      if (w.GSI2PK === "WORKSPACES") continue;
      await ddb().send(
        new UpdateCommand({
          TableName: TABLE(),
          Key: { PK: w.PK, SK: w.SK },
          UpdateExpression: "SET GSI2PK = :pk, GSI2SK = :sk",
          ExpressionAttributeValues: { ":pk": "WORKSPACES", ":sk": w.createdAt ?? "2026-01-01T00:00:00.000Z" },
        }),
      );
      count++;
    }
    start = res.LastEvaluatedKey;
  } while (start);
  console.log(`Indexed ${count} workspace(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
