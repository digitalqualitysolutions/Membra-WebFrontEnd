import Link from "next/link";

import { fontStacks } from "@/config/fonts";
import { defaultLocale } from "@/config/locales";

/**
 * 404 for a URL that matched no route at all: `/typo`, a stale bookmark.
 *
 * Next only looks for this at the root, which puts it outside `[locale]`. So
 * there's no locale to translate into and no layout above it: own `<html>`, and
 * inline styles because `globals.css` is imported by the locale layout that
 * never ran. English only for the same reason.
 *
 * `[locale]/not-found.tsx` handles the case where we do have a locale.
 */
export default function NotFound() {
  return (
    <html lang={defaultLocale}>
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "3rem 1.5rem",
          textAlign: "center",
          background: "#faf9f7",
          color: "#1a1a1a",
          // The same stack the app falls back to, imported rather than
          // retyped. A custom property is out - `globals.css` is the locale
          // layout's, and this page renders without it.
          fontFamily: fontStacks.sans,
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>
          Page not found
        </h1>

        <p
          style={{
            margin: 0,
            maxWidth: "28rem",
            fontSize: "0.875rem",
            lineHeight: 1.6,
            color: "#5c5c5c",
          }}
        >
          This page does not exist, or it has moved somewhere else.
        </p>

        <Link
          href={`/${defaultLocale}/login`}
          style={{
            marginTop: "0.5rem",
            padding: "0.625rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "#ffffff",
            background: "#1a1a1a",
            borderRadius: "0.5rem",
            textDecoration: "none",
          }}
        >
          Back 
        </Link>
      </body>
    </html>
  );
}
