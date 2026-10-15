import "server-only";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, keys, TABLE } from "./table";

export type TeamSettings = {
  quotaBytes: number;
  usedBytes: number;
  freeBytes: number;
  maxFileBytes: number;
  alertPercent: number;
  alertSentAt?: string;
};

export async function getTeamSettings(): Promise<TeamSettings> {
  const res = await ddb().send(new GetCommand({ TableName: TABLE(), Key: keys.team() }));
  if (!res.Item) throw new Error("Team settings record is missing.");
  const { quotaBytes, usedBytes, freeBytes, maxFileBytes, alertPercent, alertSentAt } = res.Item;
  return { quotaBytes, usedBytes, freeBytes, maxFileBytes, alertPercent, alertSentAt };
}
