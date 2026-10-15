import "server-only";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { SESv2Client } from "@aws-sdk/client-sesv2";
import { SSMClient } from "@aws-sdk/client-ssm";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { config } from "./config";

// All data services live in af-south-1, even though the app itself runs on
// Amplify in eu-west-1. Credentials come from the Amplify compute role.
const region = () => config().DATA_REGION;

let clients:
  | {
      ddb: DynamoDBDocumentClient;
      s3: S3Client;
      cognito: CognitoIdentityProviderClient;
      ses: SESv2Client;
      ssm: SSMClient;
    }
  | undefined;

export function aws() {
  clients ??= {
    ddb: DynamoDBDocumentClient.from(new DynamoDBClient({ region: region() }), {
      marshallOptions: { removeUndefinedValues: true },
    }),
    s3: new S3Client({ region: region() }),
    cognito: new CognitoIdentityProviderClient({ region: region() }),
    ses: new SESv2Client({ region: region() }),
    ssm: new SSMClient({ region: region() }),
  };
  return clients;
}
