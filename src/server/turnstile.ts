import "server-only";
import { request } from "node:https";
import { GetParameterCommand } from "@aws-sdk/client-ssm";
import { aws } from "./aws";
import { config } from "./config";
import { HttpError } from "./errors";

// Cloudflare's documented test keys: always pass.
const TEST_SITE_KEY = "1x00000000000000000000AA";
const TEST_SECRET = "1x0000000000000000000000000000000AA";

export const turnstileSiteKey = () => (config().TURNSTILE_TEST_MODE === "1" ? TEST_SITE_KEY : config().TURNSTILE_SITE_KEY);

let secret: Promise<string> | undefined;

function turnstileSecret() {
  if (config().TURNSTILE_TEST_MODE === "1") return Promise.resolve(TEST_SECRET);
  secret ??= aws()
    .ssm.send(new GetParameterCommand({ Name: `${config().SSM_PREFIX}/turnstile-secret`, WithDecryption: true }))
    .then((r) => {
      if (!r.Parameter?.Value) throw new Error("Missing SSM parameter turnstile-secret");
      return r.Parameter.Value;
    })
    .catch((err) => {
      secret = undefined;
      throw err;
    });
  return secret;
}

const failed = () => new HttpError(400, "The security check didn't go through. Please try again.", "captcha");

// Verifies a Turnstile token from the browser. Tokens are single-use.
export async function requireHuman(token: string | undefined, req: Request) {
  if (!token) throw failed();
  const form = new URLSearchParams({ secret: await turnstileSecret(), response: token });
  const ip = req.headers.get("cloudfront-viewer-address")?.replace(/:\d+$/, "") || req.headers.get("x-forwarded-for")?.split(",")[0].trim();
  if (ip) form.set("remoteip", ip);
  const data = await siteverify(form).catch(() => siteverify(form)); // one retry on a dropped connection
  if (!data.success) {
    console.warn("turnstile rejected", data["error-codes"]);
    throw failed();
  }
}

// node:https (HTTP/1.1) rather than fetch: newer Node versions negotiate HTTP/2
// for fetch and can reuse a session that Cloudflare already closed.
function siteverify(form: URLSearchParams): Promise<{ success?: boolean; "error-codes"?: string[] }> {
  const payload = form.toString();
  return new Promise((resolve, reject) => {
    const req = request(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", timeout: 8000, headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(payload) } },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve({});
          }
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error("siteverify timed out")));
    req.on("error", reject);
    req.end(payload);
  });
}
