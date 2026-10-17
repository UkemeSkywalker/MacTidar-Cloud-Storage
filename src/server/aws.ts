import "server-only";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { LambdaClient } from "@aws-sdk/client-lambda";
import { S3Client } from "@aws-sdk/client-s3";
import { SESv2Client } from "@aws-sdk/client-sesv2";
import { SSMClient } from "@aws-sdk/client-ssm";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { config } from "./config";

// Files, the table and the zip worker live in DATA_REGION; sign-in (Cognito),
// email (SES) and secrets (SSM) live in AUTH_REGION. Credentials come from the
// Amplify compute role.
const region = () => config().DATA_REGION;
const authRegion = () => config().AUTH_REGION;

let clients:
  | {
      ddb: DynamoDBDocumentClient;
      s3: S3Client;
      cognito: CognitoIdentityProviderClient;
      ses: SESv2Client;
      ssm: SSMClient;
      lambda: LambdaClient;
    }
  | undefined;

export function aws() {
  clients ??= {
    ddb: DynamoDBDocumentClient.from(new DynamoDBClient({ region: region() }), {
      marshallOptions: { removeUndefinedValues: true },
    }),
    s3: new S3Client({ region: region() }),
    cognito: new CognitoIdentityProviderClient({ region: authRegion() }),
    ses: new SESv2Client({ region: authRegion() }),
    ssm: new SSMClient({ region: authRegion() }),
    lambda: new LambdaClient({ region: region() }),
  };
  return clients;
}
