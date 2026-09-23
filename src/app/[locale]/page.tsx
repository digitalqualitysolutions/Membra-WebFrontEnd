import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AccountUnavailable } from "@/components/layout/account-unavailable";
import { AppShell } from "@/components/layout/app-shell";
import { isLocale } from "@/config/locales";
import { MemberAvatar } from "@/features/auth/components/member-avatar";
import { loadSession } from "@/features/auth/server/session";
import { greetingNameOf } from "@/features/auth/greeting-name";
import { memberAvatars } from "@/features/onboarding/services/avatars";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) return {};

  const t = await getTranslations({ locale });

  return { title: `${t("home.metaTitle")} · ${t("metadata.siteName")}` };
}

/**
 * Where a member lands once they're signed in.
 *
 * A greeting and nothing else for now. It exists so login and onboarding have
 * somewhere to finish, and so the header has a page to show the account menu
 * on; the club's actual home screen gets built on top of it.
 */
export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  // Guard on the page, not the layout. Layouts don't re-render between
  // navigations, so a check up there quietly stops running.
  const session = await loadSession(locale);
  if (!session.ok) return <AccountUnavailable locale={locale} />;

  const user = session.data;

  const t = await getTranslations("home");

  // Same request the shell makes, deduped - one call, two sizes off it.
  const avatars = await memberAvatars();

  return (
    <AppShell locale={locale} user={user}>
      <div className="flex flex-col items-center text-center">
        {/* The 384px variant. Drawn at 64px, a sharp screen wants ~128px of
            picture, which the 96px one can't give; the header badge, at 36px,
            is the one that gets by on 96. */}
        <MemberAvatar
          user={user}
          photoUrl={avatars.large}
          className="size-16 text-[18px]"
        />

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {t("greeting", { name: greetingNameOf(user) })}
        </h1>

        <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-subtle sm:text-sm">
          {t("description")}
        </p>
      </div>
    </AppShell>
  );
}
