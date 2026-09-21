import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { isLocale } from "@/config/locales";
import { requireSession } from "@/features/auth/server/session";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ConsentBadge } from "@/features/auth/components/consent-badge";
import { PhotoPicker } from "@/features/onboarding/components/photo-picker";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/onboarding/photo">): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) return {};

  const t = await getTranslations({ locale });
  return {
    title: `${t("onboarding.photo.metaTitle")} · ${t("metadata.siteName")}`,
  };
}

/** Onboarding step 2: the photo that shows up next to a name on a roster. */
export default async function OnboardingPhoto({
  params,
}: PageProps<"/[locale]/onboarding/photo">) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  // Guard lives on the page, not the layout. Layouts don't re-render between
  // navigations, so a check up there quietly stops running.
  await requireSession(locale);

  const t = await getTranslations("onboarding");

  return (
    <>
      <ConsentBadge>{t("photo.consent")}</ConsentBadge>

      <div className="mt-[clamp(0.25rem,1.5vh,1.25rem)] flex w-full justify-center">
        <AuthCard
          title={t("photo.title")}
          description={t("photo.description")}
          icon="memberPhoto"
          medallion="ring"
        >
          <PhotoPicker />
        </AuthCard>
      </div>
    </>
  );
}
