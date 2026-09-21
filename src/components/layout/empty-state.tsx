import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/icons";

/**
 * The first view of a screen that has nothing on it yet.
 *
 * A compact card, centred both ways in whatever space its parent gives it. The
 * parent has to be a flex column that fills the page for the vertical half to
 * work; that's what `flex-1` here is reaching for.
 *
 * Capped at reading width on purpose. Stretched across the page, the same few
 * lines sat in a lot of empty white and read as a screen that hadn't finished
 * loading; at this width they're simply all there is to do.
 *
 * Shared so every empty screen looks like the same kind of moment - change it
 * here and the club and location screens move together.
 */
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  /** Usually one button: the thing that fills the screen. */
  action: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center-safe py-6">
      <section className="mx-auto flex w-full max-w-xl flex-col items-center rounded-2xl border border-line bg-surface px-6 py-10 text-center shadow-card sm:px-10">
        <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-badge text-ink">
          <Icon name={icon} size="xl" />
        </span>

        <h2 className="mt-5 text-[22px] font-semibold tracking-tight text-ink">
          {title}
        </h2>

        <p className="mt-2 text-[14px] leading-relaxed text-body">{body}</p>

        <div className="mt-7">{action}</div>
      </section>
    </div>
  );
}
