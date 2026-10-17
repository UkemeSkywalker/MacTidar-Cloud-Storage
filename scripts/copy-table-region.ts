// Copies every item of the table from one region to another (same table name).
// Only adds items the destination doesn't have, so it never overwrites data the
// app has written there. Safe to re-run.
//   node … scripts/copy-table-region.ts --from af-south-1 --to eu-west-1 [--apply]
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const arg = (name: string) => process.argv[process.argv.indexOf(name) + 1];
const FROM = arg("--from");
const TO = arg("--to");
const TABLE = process.env.TABLE_NAME ?? "mactidar";
const APPLY = process.argv.includes("--apply");

const client = (region: string) => DynamoDBDocumentClient.from(new DynamoDBClient({ region }), { marshallOptions: { removeUndefinedValues: true } });

async function main() {
  if (!FROM || !TO || FROM === TO) throw new Error("Pass --from <region> --to <region>.");
  const src = client(FROM);
  const dst = client(TO);
  let scanned = 0, copied = 0, skipped = 0;
  let start: Record<string, unknown> | undefined;
  do {
    const res = await src.send(new ScanCommand({ TableName: TABLE, ExclusiveStartKey: start, ConsistentRead: true }));
    for (const item of res.Items ?? []) {
      scanned++;
      if (!APPLY) continue;
      try {
        await dst.send(new PutCommand({ TableName: TABLE, Item: item, ConditionExpression: "attribute_not_exists(PK)" }));
        copied++;
      } catch (err) {
        if ((err as { name?: string }).name !== "ConditionalCheckFailedException") throw err;
        skipped++;
      }
    }
    start = res.LastEvaluatedKey;
  } while (start);
  console.log(`${APPLY ? "" : "[dry run] "}${TABLE} ${FROM} → ${TO}: ${scanned} scanned, ${copied} copied, ${skipped} already there`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
