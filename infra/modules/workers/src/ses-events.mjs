// SNS → Lambda: when an email hard-bounces or the recipient complains, cancel
// any pending invites to that address so we never email it again.
import { batchDelete, scanAll, TABLE } from "./shared.mjs";

function addressesFrom(message) {
  const type = message.eventType ?? message.notificationType;
  if (type === "Bounce" && message.bounce?.bounceType === "Permanent") {
    return message.bounce.bouncedRecipients.map((r) => r.emailAddress.toLowerCase());
  }
  if (type === "Complaint") {
    return message.complaint.complainedRecipients.map((r) => r.emailAddress.toLowerCase());
  }
  return [];
}

export async function handler(event) {
  const addresses = new Set();
  for (const record of event.Records ?? []) {
    try {
      for (const a of addressesFrom(JSON.parse(record.Sns.Message))) addresses.add(a);
    } catch {
      // CloudWatch alarm notifications share the topic; ignore anything that isn't an SES event.
    }
  }
  if (!addresses.size) return { cancelled: 0 };

  const invites = await scanAll({
    TableName: TABLE,
    FilterExpression: "begins_with(PK, :p) AND SK = :meta",
    ExpressionAttributeValues: { ":p": "INVITE#", ":meta": "META" },
    ProjectionExpression: "PK, SK, email",
  });
  const doomed = invites.filter((i) => addresses.has(String(i.email).toLowerCase()));
  await batchDelete(doomed.map((i) => ({ PK: i.PK, SK: i.SK })));
  console.log(JSON.stringify({ addresses: [...addresses], cancelled: doomed.length }));
  return { cancelled: doomed.length };
}
