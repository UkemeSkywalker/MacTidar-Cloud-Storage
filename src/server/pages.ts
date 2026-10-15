import "server-only";
import { notFound } from "next/navigation";
import { HttpError } from "./errors";

// Turns access errors into the Next.js 404 page for server components.
export async function orNotFound<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof HttpError && [403, 404].includes(err.status)) notFound();
    throw err;
  }
}
