import { getTranslations } from "next-intl/server";

import { Icon, type IconName } from "@/components/icons";

/**
 * Stands in for a screen that hasn't been built yet.
 *
 * The sidebar leads everywhere the club will eventually need to go, and a
 * navigation that answers half its own links with "page not found" is worse
 * than one that says "not yet". Each of these goes away the moment the real
 * screen takes its route.
 */
export async function SectionPlaceholder({
  icon,
  title,
}: {
  icon: IconName;
  title: string;
}) {
  const t = await getTranslations("nav");

  return (
    <div className="flex flex-col items-center text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-badge text-ink shadow-badge">
        <Icon name={icon} size="xl" />
      </span>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        {title}
      </h1>

      <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-subtle sm:text-sm">
        {t("placeholder")}
      </p>
    </div>
  );
}
