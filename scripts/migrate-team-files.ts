// One-off: gives every company workspace a shared "Team Files" folder and moves
// each member's private My Files contents into it. Dry run by default; pass --apply.
import { BatchWriteCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getItem, listingSortKey, listSubtree, setItemFields, withUniqueName } from "@/server/db/items";
import { ddb, keys, now, TABLE } from "@/server/db/table";
import { listAllWorkspaces, listWorkspaceMembers, rootFolderRecord, TEAM_FILES } from "@/server/db/workspaces";
import { newId } from "@/server/ids";

const APPLY = process.argv.includes("--apply");
// --only <workspaceId> limits the run to one workspace.
const ONLY = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;

async function main() {
  const log: string[] = [];
  for (const ws of (await listAllWorkspaces()).filter((w) => w.type === "COMPANY" && !w.teamRootId && (!ONLY || w.id === ONLY))) {
    const teamId = `team-${newId()}`;
    const teamPath = `/${teamId}/`;
    log.push(`[${ws.name}] create ${TEAM_FILES} (${teamId}), owner ${ws.ownerId}`);
    if (APPLY) await ddb().send(new PutCommand({ TableName: TABLE(), Item: rootFolderRecord(ws.id, teamId, ws.ownerId, now(), TEAM_FILES), ConditionExpression: "attribute_not_exists(PK)" }));

    for (const m of await listWorkspaceMembers(ws.id)) {
      const oldRoot = await getItem(m.rootFolderId);
      if (oldRoot && !oldRoot.parentId) {
        const subtree = (await listSubtree(oldRoot.rootId, oldRoot.path)).filter((it) => it.id !== oldRoot.id);
        for (const it of subtree) {
          const path = teamPath + it.path.slice(oldRoot.path.length);
          const moved = { path, rootId: teamId, GSI3PK: `ROOT#${teamId}`, GSI3SK: path };
          if (it.parentId === oldRoot.id && it.status === "ACTIVE") {
            // Top-level items: claim a name in Team Files (renaming on a clash).
            if (!APPLY) {
              log.push(`[${ws.name}] move "${it.name}" from ${m.name}'s My Files`);
              continue;
            }
            const finalName = await withUniqueName(
              teamId,
              it.name,
              (name) => [
                {
                  Update: {
                    TableName: TABLE(),
                    Key: keys.item(it.id),
                    UpdateExpression: "SET parentId = :p, #n = :n, nameLower = :nl, GSI1PK = :g1, GSI1SK = :g1s, #path = :path, rootId = :r, GSI3PK = :g3, GSI3SK = :path",
                    ExpressionAttributeNames: { "#n": "name", "#path": "path" },
                    ExpressionAttributeValues: { ":p": teamId, ":n": name, ":nl": name.toLowerCase(), ":g1": `PARENT#${teamId}`, ":g1s": listingSortKey(it.type, name.toLowerCase()), ":path": path, ":r": teamId, ":g3": `ROOT#${teamId}` },
                  },
                },
              ],
              { autoRename: true, releaseOld: { parentId: oldRoot.id, nameLower: it.nameLower } },
            );
            log.push(`[${ws.name}] moved "${it.name}"${finalName !== it.name ? ` as "${finalName}"` : ""} from ${m.name}'s My Files`);
          } else {
            if (APPLY) await setItemFields(it.id, it.parentId === oldRoot.id ? { ...moved, parentId: teamId } : moved);
            log.push(`[${ws.name}]   re-root ${it.status.toLowerCase()} ${it.type} "${it.name}"`);
          }
        }
        // Remove the old empty root and anything left in its partition (name locks).
        log.push(`[${ws.name}] remove ${m.name}'s old My Files root ${oldRoot.id}`);
        if (APPLY) {
          const rest = await ddb().send(new QueryCommand({ TableName: TABLE(), KeyConditionExpression: "PK = :pk", ExpressionAttributeValues: { ":pk": `ITEM#${oldRoot.id}` }, ProjectionExpression: "PK, SK" }));
          const del = rest.Items ?? [];
          for (let i = 0; i < del.length; i += 25) {
            await ddb().send(new BatchWriteCommand({ RequestItems: { [TABLE()]: del.slice(i, i + 25).map((r) => ({ DeleteRequest: { Key: { PK: r.PK, SK: r.SK } } })) } }));
          }
        }
      }
      log.push(`[${ws.name}] point ${m.name}'s membership at ${TEAM_FILES}`);
      if (APPLY) await ddb().send(new UpdateCommand({ TableName: TABLE(), Key: keys.member(ws.id, m.id), UpdateExpression: "SET rootFolderId = :t", ExpressionAttributeValues: { ":t": teamId } }));
    }
    log.push(`[${ws.name}] set teamRootId`);
    if (APPLY) await ddb().send(new UpdateCommand({ TableName: TABLE(), Key: keys.workspace(ws.id), UpdateExpression: "SET teamRootId = :t", ExpressionAttributeValues: { ":t": teamId } }));
  }
  console.log(`${APPLY ? "" : "[dry run] "}${log.length} step(s):`);
  for (const l of log) console.log(`  - ${l}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
