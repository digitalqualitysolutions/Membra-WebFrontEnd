"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { Icon } from "@/components/icons";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";

/**
 * One part of a screen that couldn't be read, in the space that part would
 * have filled.
 *
 * The alternative is the route's error boundary, which replaces the entire
 * page - so a locations call that failed would also take away the club record
 * beside it, and the header, and the navigation. This keeps the failure the
 * size of the thing that failed.
 *
 * Built on `EmptyState` so it's the same card as "Set up your club": both are
 * the same moment to an admin - a screen with nothing on it and one thing to
 * do - and two different-looking cards for that would read as two different
 * kinds of problem.
 *
 * Says nothing about what went wrong. The reason is in the server log, where
 * it can name internals safely; here it would only be noise an admin can't
 * act on.
 */
export function LoadFailed({ title }: { title: string }) {
  const t = useTranslations("errorPage");
  const router = useRouter();
  const [retrying, startRetry] = useTransition();

  return (
    <EmptyState
      icon="warning"
      title={title}
      body={t("partDescription")}
      action={
        // Refetches this segment on the server - the card is server-rendered,
        // so re-running the render is the whole retry.
        <Button
          type="button"
          disabled={retrying}
          onClick={() => startRetry(() => router.refresh())}
        >
          {t("retry")}
          <Icon
            name={retrying ? "pending" : "retry"}
            className={retrying ? "animate-spin" : undefined}
          />
        </Button>
      }
    />
  );
}
