import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AccountUnavailable } from "@/components/layout/account-unavailable";
import { AppShell } from "@/components/layout/app-shell";
import { AuthCard } from "@/features/auth/components/auth-card";
import { isLocale } from "@/config/locales";
import { loadSession } from "@/features/auth/server/session";
import { ProfileForm } from "@/features/onboarding/components/profile-form";
import { memberAvatars } from "@/features/onboarding/services/avatars";
import {
  availableGenders,
  genderList,
} from "@/features/onboarding/services/genders";
import { AvatarEditor } from "@/features/profile/components/avatar-editor";
import { profileFormDefaults } from "@/features/profile/form-defaults";
import { updateProfileAction } from "@/features/profile/services/update-profile";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/profile">): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) return {};

  const t = await getTranslations({ locale });

  return { title: `${t("profile.metaTitle")} · ${t("metadata.siteName")}` };
}

/**
 * The member's own details, open for editing.
 *
 * Same form as onboarding's first step, filled in and pointed at the action
 * that saves rather than the one that moves on. One form means a field added
 * for onboarding shows up here too, instead of the two drifting apart.
 */
export default async function Profile({
  params,
  searchParams,
}: PageProps<"/[locale]/profile">) {
  const { locale } = await params;
  const { saved } = await searchParams;

  if (!isLocale(locale)) notFound();

  // Guard on the page, not the layout. Layouts don't re-render between
  // navigations, so a check up there quietly stops running.
  const session = await loadSession(locale);
  if (!session.ok) return <AccountUnavailable locale={locale} />;

  const user = session.data;

  const t = await getTranslations("profile");

  // Fetched once here and handed to both the form and its defaults, so the
  // saved gender is matched against the same list the select offers. The rows
  // pair each word with the id `/users/me` reports; both reads share one
  // deduped request.
  const [genders, genderRows] = await Promise.all([
    availableGenders(),
    genderList(),
  ]);

  // Same request the shell makes for the header badge, deduped - one call, two
  // sizes off it. The large variant here: on this page the picture is the
  // member's own subject, not a badge in a corner.
  const avatars = await memberAvatars();

  return (
    <AppShell locale={locale} user={user} className="py-[clamp(1rem,4vh,4rem)]">
      {/*
        * The member's own picture stands in for the card's icon. It's what this
        * page is about and it's editable, so it takes the top spot rather than
        * sitting under a generic account glyph that says the same thing twice.
        */}
      <AuthCard
        title={t("title")}
        description={t("description")}
        media={
          <AvatarEditor
            user={user}
            photoUrl={avatars.large}
            savedLabel={t("photoSaved")}
          />
        }
      >
        <ProfileForm
          action={updateProfileAction}
          genders={genders}
          defaults={profileFormDefaults(user, locale, genders, genderRows)}
          // Consent belongs to creating the profile, not to editing it; it was
          // given at onboarding and still rides along in the defaults.
          showConsent={false}
          // No arrow here. This save stays on the page; the arrow is onboarding
          // saying it's about to move you on.
          submitIcon={null}
          savedLabel={t("saved")}
          savedOnLoad={saved === "1"}
        />
      </AuthCard>
    </AppShell>
  );
}
