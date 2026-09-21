"use client";

import { useEffect } from "react";

import { fontStacks } from "@/config/fonts";

/**
 * Last-resort boundary for when the root layout itself throws.
 *
 * `[locale]/error.tsx` lives inside that layout, so it can't catch a failure in
 * the layout that would have to render it. This one replaces the whole
 * document, hence its own `<html>` and `<body>`.
 *
 * Nothing in here can lean on the app. No translator, because the provider is
 * in the layout that just died, so the copy is English only. Styles are inline
 * rather than from `globals.css`, because a stylesheet that failed to load is
 * one of the ways people end up here. It's built to render under any
 * conditions, not to match the rest of the portal.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[global error boundary]", error);
  }, [error]);

  return (
    <html lang="en">
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
          // Imported, not retyped. Inline styles are still the rule here - a
          // stylesheet that failed to load is one of the ways people arrive -
          // but the stack itself is the app's, from one file.
          fontFamily: fontStacks.sans,
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>
          Something went wrong
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
          Membra could not load. Try again, and if this keeps happening come back
          in a few minutes.
        </p>

        <button
          type="button"
          // Refetches from the server; `reset` would replay the failed payload.
          onClick={retry}
          style={{
            marginTop: "0.5rem",
            padding: "0.625rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "#ffffff",
            background: "#1a1a1a",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
        >
          Try again
        </button>

        {error.digest ? (
          <p
            style={{
              margin: 0,
              fontFamily: fontStacks.mono,
              fontSize: "0.6875rem",
              color: "#8a8a8a",
            }}
          >
            Reference: {error.digest}
          </p>
        ) : null}
      </body>
    </html>
  );
}
