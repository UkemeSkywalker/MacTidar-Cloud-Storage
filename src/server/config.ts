import "server-only";
import { z } from "zod";

// Server-side configuration. Amplify forbids env var names starting with
// "AWS", so the data region uses DATA_REGION.
const schema = z.object({
  DATA_REGION: z.string().default("af-south-1"),
  TABLE_NAME: z.string().min(1),
  FILES_BUCKET: z.string().min(1),
  COGNITO_USER_POOL_ID: z.string().min(1),
  COGNITO_CLIENT_ID: z.string().min(1),
  SES_FROM_EMAIL: z.string().email(),
  SSM_PREFIX: z.string().default("/mactidar"),
  APP_URL: z.string().url(),
  ZIP_FUNCTION: z.string().default("mactidar-zip-folder"),
});

export type Config = z.infer<typeof schema>;

let cached: Config | undefined;

// Parsed lazily so `next build` doesn't need runtime values.
export function config(): Config {
  cached ??= schema.parse(process.env);
  return cached;
}
