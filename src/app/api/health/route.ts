import { NextResponse } from "next/server";

/**
 * Liveness probe for the Scaleway Serverless Container.
 *
 * Deliberately knows nothing about the API: a probe that calls out is a probe
 * that fails when the backend hiccups, which restarts a frontend that was
 * never the problem. `proxy.ts`'s matcher already excludes everything under
 * `/api`, so this never runs through the locale redirect or the session
 * guard.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok" });
}
