import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

/** Default lookup is `src/i18n/request.ts`, so point it at ours. */
const withNextIntl = createNextIntlPlugin("./src/translations/request.ts");

const isDev = process.env.NODE_ENV === "development";

/**
 * Where member pictures are served from.
 *
 * `GET /auth/avatars` answers with signed URLs on the object store, which is a
 * different origin from the app - so `img-src 'self'` alone refuses them, and
 * the only sign of it is a broken image and a console warning. Worth knowing
 * when the next remote asset arrives: nothing else here needs opening.
 *
 * Environment-driven, because the bucket is. Dev writes to
 * `user-avatars-local`; the default wildcard covers every bucket in that
 * region so no environment has to name its own. Set `AVATAR_IMAGE_HOST` when
 * the store moves regions or providers.
 */
const avatarImageHost =
  process.env.AVATAR_IMAGE_HOST ?? "https://*.s3.nl-ams.scw.cloud";

/**
 * Content Security Policy.
 *
 * `script-src` carries `'unsafe-inline'` because the landing, login and signup
 * pages are statically generated. Next inlines its hydration payload as a
 * `<script>`, and you can't mint a nonce for a page rendered at build time,
 * before any request exists. Tightening this means moving every page to dynamic
 * rendering and generating a nonce per request in `proxy.ts`, so it's a trade
 * against static delivery rather than an oversight. Everything else is closed.
 *
 * Dev needs two things production doesn't: React uses `eval` for its debugging,
 * and hot reload talks over a websocket.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // Tailwind ships a stylesheet, but `next/font` and React still emit inline
  // style attributes. Injected styles are a much weaker vector than injected
  // scripts, which is why this is where most people stop tightening.
  "style-src 'self' 'unsafe-inline'",
  // `blob:` covers the photo step's preview, which reads the file locally
  // instead of uploading it somewhere to get a URL back. The host is the object
  // store the API signs avatar URLs on; see `avatarImageHost` above.
  `img-src 'self' data: blob: ${avatarImageHost}`,
  // `next/font` copies Inter into the build output, so no Google origin needed.
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  // A form on this origin can only post back to this origin.
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Does nothing over plain http, and dev runs on localhost.
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

/**
 * Sent on every response.
 *
 * These are the checks a browser can't make on its own. It does what the server
 * tells it, and anything left unsaid defaults to permissive.
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Two years, the usual preload threshold. No `preload` directive on purpose:
  // that's a one-way door, submitted to a browser-maintained list and slow to
  // reverse, so it's a call for whoever owns the domain.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  // Stops a browser second-guessing a declared content type, which is the trick
  // behind an upload served back as an "image" that runs as script.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Full URL to ourselves, bare origin to anyone else, nothing at all over
  // plain http, so a member id in a path never leaks out in a `Referer`.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // `frame-ancestors` above is the real rule. This says the same thing to
  // browsers that predate it, and a login form in someone else's iframe is
  // worth closing twice.
  { key: "X-Frame-Options", value: "DENY" },
  // Puts the app in its own browsing context group, so a page that opened us,
  // or one we opened, holds no `window` reference back. If you add social
  // sign-in: an OAuth popup wants `same-origin-allow-popups` instead, and a
  // redirect flow needs no change.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Nothing here wants hardware; the photo step uses a file input, not the
  // camera API. Granting none is easier to keep honest than granting some.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // Next advertises itself in `X-Powered-By` by default. Naming the framework
  // isn't an exploit on its own, but it hands a scanner its first filter for
  // free and no visitor needs to know.
  poweredByHeader: false,

  async headers() {
    // `/:path*` matches the root as well as everything below it.
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
