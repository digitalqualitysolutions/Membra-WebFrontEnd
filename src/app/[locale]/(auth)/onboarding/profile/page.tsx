import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { isLocale } from "@/config/locales";
import { AccountUnavailable } from "@/components/layout/account-unavailable";
import { loadSession } from "@/features/auth/server/session";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ConsentBadge } from "@/features/auth/components/consent-badge";
import { ProfileForm } from "@/features/onboarding/components/profile-form";
import { availableGenders } from "@/features/onboarding/services/genders";
import { languageList } from "@/features/onboarding/services/languages";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/onboarding/profile">): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) return {};

  const t = await getTranslations({ locale });
  return {
    title: `${t("onboarding.profile.metaTitle")} · ${t("metadata.siteName")}`,
  };
}

/** Onboarding step 1: the details clubs ask for once an account exists. */
export default async function OnboardingProfile({
  params,
}: PageProps<"/[locale]/onboarding/profile">) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  // Guard lives on the page, not the layout. Layouts don't re-render between
  // navigations, so a check up there quietly stops running.
  const session = await loadSession(locale);
  if (!session.ok) return <AccountUnavailable locale={locale} />;

  const t = await getTranslations("onboarding");

  return (
    <>
      <ConsentBadge>{t("profile.consent")}</ConsentBadge>

      <div className="mt-[clamp(0.25rem,1.5vh,1.25rem)] flex w-full justify-center">
        <AuthCard title={t("profile.title")} icon="brand" medallion="plain">
          <ProfileForm
            genders={await availableGenders()}
            languages={await languageList()}
          />
        </AuthCard>
      </div>
    </>
  );
}
