"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { readSessionToken } from "@/features/auth/server/session-cookie";
import {
  EMPTY_VIEW_COOKIE,
  emptyViewModeAvailable,
} from "@/features/testing/server/empty-view-mode";

/**
 * TEMPORARY - see `server/empty-view-mode.ts`. Delete with the rest.
 *
 * A Server Action rather than a route handler because setting a cookie is the
 * whole job, and a render pass can't do it: Next only allows `cookies().set`
 * from an action or a route handler.
 *
 * Guarded twice, because a Server Action is a public endpoint: its id ships in
 * a static chunk that anyone can read, so nothing about only rendering the
 * toggle on the settings screen keeps a stranger from calling this. It ends in
 * `revalidatePath("/", "layout")` - an app-wide cache purge - which is exactly
 * what you don't want reachable by an anonymous caller in a loop.
 */
export async function setEmptyViewMode(on: boolean): Promise<void> {
  // Not a product feature: it doesn't exist off a developer's machine.
  if (!emptyViewModeAvailable) return;

  // And not for signed-out callers even there.
  if (!(await readSessionToken())) return;

  const store = await cookies();

  if (on) {
    store.set(EMPTY_VIEW_COOKIE, "on", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
  } else {
    store.delete(EMPTY_VIEW_COOKIE);
  }

  // Every server-rendered screen reads this, not just the one the toggle is
  // on, so the whole tree has to be thrown away rather than a single path.
  revalidatePath("/", "layout");
}
