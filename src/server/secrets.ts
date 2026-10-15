import "server-only";
import { GetParametersCommand } from "@aws-sdk/client-ssm";
import { aws } from "./aws";
import { config } from "./config";

type Secrets = { cognitoClientSecret: string; sessionSecret: string };

let cached: Promise<Secrets> | undefined;

// Read once per server instance from SSM Parameter Store.
export function secrets(): Promise<Secrets> {
  cached ??= load().catch((err) => {
    cached = undefined;
    throw err;
  });
  return cached;
}

async function load(): Promise<Secrets> {
  const prefix = config().SSM_PREFIX;
  const names = {
    cognitoClientSecret: `${prefix}/cognito-client-secret`,
    sessionSecret: `${prefix}/session-secret`,
  };
  const res = await aws().ssm.send(
    new GetParametersCommand({ Names: Object.values(names), WithDecryption: true }),
  );
  const value = (name: string) => {
    const v = res.Parameters?.find((p) => p.Name === name)?.Value;
    if (!v) throw new Error(`Missing SSM parameter ${name}`);
    return v;
  };
  return {
    cognitoClientSecret: value(names.cognitoClientSecret),
    sessionSecret: value(names.sessionSecret),
  };
}
