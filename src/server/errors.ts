import "server-only";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export const badRequest = (msg: string, code?: string) => new HttpError(400, msg, code);
export const unauthorized = (msg = "Please sign in.") => new HttpError(401, msg, "unauthorized");
export const forbidden = (msg = "You don't have access to this.") => new HttpError(403, msg, "forbidden");
export const notFound = (msg = "Not found.") => new HttpError(404, msg, "not_found");
export const conflict = (msg: string, code?: string) => new HttpError(409, msg, code);

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

// Wraps a route handler so thrown HttpErrors / validation errors become JSON responses.
export function route<C = { params: Promise<Record<string, string>> }>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) {
        return Response.json({ error: err.message, code: err.code }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return Response.json(
          { error: err.issues[0]?.message ?? "Invalid request.", code: "invalid" },
          { status: 400 },
        );
      }
      console.error(err);
      return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}
