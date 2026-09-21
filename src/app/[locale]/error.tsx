"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";

/**
 * Error boundary for everything under `[locale]`. It sits here rather than in
 * `(auth)` so it also covers the pages outside that group. A throw in the root
 * layout is past this boundary; `global-error.tsx` picks that up.
 *
 * Same copy no matter what broke. `error.message` is written for developers and
 * can name internals on a server error, and React withholds it in production
 * anyway. `digest` is the useful part: it's what ties a member's report to a
 * line in the logs.
 */
export default function LocaleError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("errorPage");

  useEffect(() => {
    // Nothing else in the app ever sees this object, so hook the error
    // reporter up here once we have one.
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-page px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-ink text-on-ink">
        <Icon name="brand" className="size-6" />
      </span>

      <h1 className="mt-6 text-xl font-semibold tracking-tight text-ink">
        {t("title")}
      </h1>

      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-subtle sm:text-sm">
        {t("description")}
      </p>

      <div className="mt-7 flex w-full max-w-xs flex-col gap-2">
        {/*
          `retry`, not `reset`. `reset` only clears the boundary and re-renders
          the same server payload, so a Server Component that threw throws
          again. `retry` refetches the segment from the server first.
        */}
        <Button type="button" size="form" onClick={retry}>
          {t("retry")}
        </Button>
      </div>

      {error.digest ? (
        <p className="mt-6 font-mono text-[11px] text-subtle">
          {t("reference")}: {error.digest}
        </p>
      ) : null}
    </div>
  );
}
