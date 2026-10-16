import "server-only";
import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { newId } from "../ids";
import { ddb, epochSeconds, now, strip, TABLE } from "./table";

export type AbuseReason = "COPYRIGHT" | "MALWARE" | "SPAM" | "ILLEGAL" | "OTHER";
export type AbuseStatus = "OPEN" | "REVIEWING" | "RESOLVED" | "DISMISSED";

export type AbuseReport = {
  id: string;
  token: string;
  itemId: string;
  itemName: string;
  workspaceId: string;
  ownerId: string;
  reason: AbuseReason;
  details?: string;
  reporterEmail?: string;
  status: AbuseStatus;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
};

const key = (id: string) => ({ PK: `ABUSE#${id}`, SK: "META" });
const statusIndex = (status: AbuseStatus) => ({ GSI1PK: `ABUSE#${status}` });

export async function createReport(input: Omit<AbuseReport, "id" | "status" | "createdAt">) {
  const report: AbuseReport = { ...input, id: newId(), status: "OPEN", createdAt: now() };
  await ddb().send(new PutCommand({ TableName: TABLE(), Item: { ...key(report.id), ...statusIndex("OPEN"), GSI1SK: report.createdAt, ...report } }));
  return report;
}

export async function getReport(id: string): Promise<AbuseReport | null> {
  const res = await ddb().send(new GetCommand({ TableName: TABLE(), Key: key(id) }));
  return res.Item ? (strip(res.Item) as AbuseReport) : null;
}

export async function listReports(status: AbuseStatus): Promise<AbuseReport[]> {
  const res = await ddb().send(
    new QueryCommand({
      TableName: TABLE(),
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": `ABUSE#${status}` },
      ScanIndexForward: false,
    }),
  );
  return (res.Items ?? []).map((i) => strip(i) as AbuseReport);
}

export async function setReportStatus(id: string, status: AbuseStatus, resolution?: string) {
  await ddb().send(
    new UpdateCommand({
      TableName: TABLE(),
      Key: key(id),
      UpdateExpression: "SET #s = :s, GSI1PK = :pk, resolvedAt = :at" + (resolution ? ", resolution = :r" : ""),
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":s": status, ":pk": `ABUSE#${status}`, ":at": now(), ...(resolution ? { ":r": resolution } : {}) },
    }),
  );
}

// Open reports for one link from distinct reporters.
export async function openReportsForLink(token: string): Promise<number> {
  return (await listReports("OPEN")).filter((r) => r.token === token).length;
}

// One report per reporter (IP fingerprint) per link per day.
export async function claimReportSlot(fingerprint: string) {
  try {
    await ddb().send(
      new PutCommand({
        TableName: TABLE(),
        Item: { PK: `ABUSEFP#${fingerprint}`, SK: "META", expiresAt: epochSeconds(new Date(Date.now() + 86400_000)) },
        ConditionExpression: "attribute_not_exists(PK)",
      }),
    );
    return true;
  } catch (err) {
    if ((err as { name?: string }).name === "ConditionalCheckFailedException") return false;
    throw err;
  }
}
