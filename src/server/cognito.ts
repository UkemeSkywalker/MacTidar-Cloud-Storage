import "server-only";
import {
  AdminCreateUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminSetUserPasswordCommand,
  ConfirmForgotPasswordCommand,
  ForgotPasswordCommand,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { createHmac } from "node:crypto";
import { aws } from "./aws";
import { config } from "./config";
import { badRequest, conflict, HttpError } from "./errors";
import { secrets } from "./secrets";

async function secretHash(username: string) {
  const { cognitoClientSecret } = await secrets();
  return createHmac("sha256", cognitoClientSecret)
    .update(username + config().COGNITO_CLIENT_ID)
    .digest("base64");
}

function decodeSub(idToken: string): string {
  const payload = JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString("utf8"));
  return payload.sub as string;
}

const name = (err: unknown) => (err as { name?: string })?.name;

// Verifies email + password with Cognito; returns the Cognito user id (sub).
export async function verifyPassword(email: string, password: string): Promise<string> {
  try {
    const res = await aws().cognito.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: config().COGNITO_CLIENT_ID,
        AuthParameters: { USERNAME: email, PASSWORD: password, SECRET_HASH: await secretHash(email) },
      }),
    );
    const idToken = res.AuthenticationResult?.IdToken;
    if (!idToken) throw new HttpError(401, "Sign-in needs an extra step that isn't supported.");
    return decodeSub(idToken);
  } catch (err) {
    if (["NotAuthorizedException", "UserNotFoundException"].includes(name(err) ?? "")) {
      throw new HttpError(401, "Incorrect email or password", "invalid_credentials");
    }
    if (name(err) === "TooManyRequestsException" || name(err) === "LimitExceededException") {
      throw new HttpError(429, "Too many attempts. Please wait a few minutes and try again.");
    }
    throw err;
  }
}

export async function startPasswordReset(email: string) {
  try {
    await aws().cognito.send(
      new ForgotPasswordCommand({
        ClientId: config().COGNITO_CLIENT_ID,
        Username: email,
        SecretHash: await secretHash(email),
      }),
    );
  } catch (err) {
    // Don't reveal whether the account exists.
    if (name(err) === "UserNotFoundException") return;
    if (name(err) === "LimitExceededException") {
      throw new HttpError(429, "Too many reset requests. Please wait a few minutes and try again.");
    }
    throw err;
  }
}

export async function confirmPasswordReset(email: string, code: string, password: string) {
  try {
    await aws().cognito.send(
      new ConfirmForgotPasswordCommand({
        ClientId: config().COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
        Password: password,
        SecretHash: await secretHash(email),
      }),
    );
  } catch (err) {
    switch (name(err)) {
      case "CodeMismatchException":
        throw badRequest("That code isn't right. Check the email and try again.", "bad_code");
      case "ExpiredCodeException":
        throw badRequest("That code has expired. Request a new one.", "expired_code");
      case "InvalidPasswordException":
        throw badRequest("Password doesn't meet the requirements.", "weak_password");
      case "LimitExceededException":
        throw new HttpError(429, "Too many attempts. Please wait a few minutes and try again.");
    }
    throw err;
  }
}

// Creates a confirmed Cognito user with a permanent password; returns its id (sub).
export async function createCognitoUser(email: string, password: string): Promise<string> {
  const pool = config().COGNITO_USER_POOL_ID;
  try {
    const res = await aws().cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: pool,
        Username: email,
        MessageAction: "SUPPRESS",
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
        ],
      }),
    );
    const sub = res.User?.Attributes?.find((a) => a.Name === "sub")?.Value;
    if (!sub) throw new Error("Cognito did not return a user id.");
    await setPassword(sub, password);
    return sub;
  } catch (err) {
    if (name(err) === "UsernameExistsException") throw conflict("An account with this email already exists.");
    if (name(err) === "InvalidPasswordException") throw badRequest("Password doesn't meet the requirements.");
    throw err;
  }
}

export async function setPassword(username: string, password: string) {
  try {
    await aws().cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: config().COGNITO_USER_POOL_ID,
        Username: username,
        Password: password,
        Permanent: true,
      }),
    );
  } catch (err) {
    if (name(err) === "InvalidPasswordException") throw badRequest("Password doesn't meet the requirements.");
    throw err;
  }
}

export async function setCognitoUserEnabled(username: string, enabled: boolean) {
  const Cmd = enabled ? AdminEnableUserCommand : AdminDisableUserCommand;
  await aws().cognito.send(new Cmd({ UserPoolId: config().COGNITO_USER_POOL_ID, Username: username }));
}
