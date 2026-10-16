import "server-only";
import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  SignUpCommand,
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
    if (name(err) === "UserNotConfirmedException") {
      throw new HttpError(403, "Please verify your email address first.", "not_confirmed");
    }
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

// Public self sign-up. Cognito emails a 6-digit verification code.
export async function signUp(email: string, password: string, fullName: string) {
  const attempt = async () =>
    aws().cognito.send(
      new SignUpCommand({
        ClientId: config().COGNITO_CLIENT_ID,
        SecretHash: await secretHash(email),
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "name", Value: fullName },
        ],
      }),
    );
  try {
    await attempt();
  } catch (err) {
    if (name(err) === "UsernameExistsException") {
      // An abandoned, never-verified sign-up can be replaced; a real account can't.
      const existing = await aws()
        .cognito.send(new AdminGetUserCommand({ UserPoolId: config().COGNITO_USER_POOL_ID, Username: email }))
        .catch(() => null);
      if (existing?.UserStatus === "UNCONFIRMED") {
        await aws().cognito.send(new AdminDeleteUserCommand({ UserPoolId: config().COGNITO_USER_POOL_ID, Username: email }));
        await attempt();
        return;
      }
      throw conflict("An account with this email already exists. Sign in instead.", "exists");
    }
    if (name(err) === "InvalidPasswordException") throw badRequest("Password doesn't meet the requirements.");
    if (name(err) === "LimitExceededException" || name(err) === "TooManyRequestsException") {
      throw new HttpError(429, "Too many attempts. Please wait a few minutes and try again.");
    }
    throw err;
  }
}

export async function confirmSignUp(email: string, code: string) {
  try {
    await aws().cognito.send(
      new ConfirmSignUpCommand({
        ClientId: config().COGNITO_CLIENT_ID,
        SecretHash: await secretHash(email),
        Username: email,
        ConfirmationCode: code,
      }),
    );
  } catch (err) {
    switch (name(err)) {
      case "CodeMismatchException":
        throw badRequest("That code isn't right. Check the email and try again.", "bad_code");
      case "ExpiredCodeException":
        throw badRequest("That code has expired. Request a new one.", "expired_code");
      case "NotAuthorizedException":
        return; // already confirmed
      case "UserNotFoundException":
        throw badRequest("We couldn't find a sign-up for this email. Create your account again.");
      case "LimitExceededException":
      case "TooManyFailedAttemptsException":
        throw new HttpError(429, "Too many attempts. Please wait a few minutes and try again.");
    }
    throw err;
  }
}

export async function resendSignUpCode(email: string) {
  try {
    await aws().cognito.send(
      new ResendConfirmationCodeCommand({ ClientId: config().COGNITO_CLIENT_ID, SecretHash: await secretHash(email), Username: email }),
    );
  } catch (err) {
    if (name(err) === "UserNotFoundException" || name(err) === "InvalidParameterException") return;
    if (name(err) === "LimitExceededException") throw new HttpError(429, "Too many requests. Please wait a few minutes.");
    throw err;
  }
}

// Name and email as stored in Cognito (used when provisioning a new account).
export async function cognitoProfile(userId: string) {
  const res = await aws().cognito.send(new AdminGetUserCommand({ UserPoolId: config().COGNITO_USER_POOL_ID, Username: userId }));
  const attr = (n: string) => res.UserAttributes?.find((a) => a.Name === n)?.Value;
  return { email: (attr("email") ?? "").toLowerCase(), name: attr("name") ?? "" };
}
