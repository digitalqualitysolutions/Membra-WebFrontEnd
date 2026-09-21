import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/config/locales";
import { SESSION_COOKIE } from "@/features/auth/cookie-name";
import { routing } from "@/translations/routing";

/**
 * Next.js 16 renamed Middleware to Proxy.
 *
 * Two jobs, in this order: next-intl prefixes the pathname with a locale so
 * every route resolves under `app/[locale]`, then a signed-out visitor headed
 * for a members-only page gets turned around before the page renders.
 */
const handleLocale = createMiddleware(routing);

/**
 * Paths that need a session, written as they read after the locale segment.
 *
 * Keep this in step with the pages that call `requireSession`. Nothing enforces
 * that, on purpose: this guard is a shortcut, not the rule. Forgetting a path
 * costs a redundant round-trip, never access.
 */
const membersOnly = [
  "/onboarding",
  "/profile",
  "/settings",
  "/event",
  "/chat",
  "/find",
  "/admin",
];

export function proxy(request: NextRequest) {
  const response = handleLocale(request);

  // A path with no locale gets a redirect. The browser comes back with the
  // prefixed one, and that's the request the check below runs against.
  if (response.status >= 300 && response.status < 400) return response;

  /**
   * Navigations only.
   *
   * A Server Action shows up as a POST to the page's own URL and wants an
   * action payload back. Answer it with a redirect to an HTML page and the
   * caller gets something it can't parse: the browser reports "An unexpected
   * response was received from the server" instead of the outcome the form
   * knows how to render. Actions guard themselves anyway;
   * `completeProfileAction` redirects when the session is gone, and the router
   * does understand that redirect.
   */
  if (request.method !== "GET") return response;

  const [, first, ...rest] = request.nextUrl.pathname.split("/");
  const locale = isLocale(first) ? first : defaultLocale;
  const path = `/${rest.join("/")}`;

  const needsSession = membersOnly.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  /**
   * Optimistic and nothing more: this proves a cookie is there, not that the
   * session behind it still works. An expired or revoked one sails straight
   * past and gets caught by `requireSession`, which actually asks the API. All
   * this saves is the round-trip for the common case of no cookie at all.
   */
  if (needsSession && !request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  return response;
}

export const config = {
  /*
   * Skip internals, the API and anything with a file extension.
   *
   * Double-escaped on purpose: this is a string, not a regex literal, so `\.`
   * would collapse to `.` and `\w` to `w` before the pattern is ever compiled
   * - which silently turned the extension guard into "ends in one or more
   * literal w", letting every `public/` asset through the locale rewrite and
   * excluding any route that happened to end in `w`.
   */
  matcher: ["/((?!_next|api|favicon\\.ico|.*\\.[\\w]+$).*)"],
};
