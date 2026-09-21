import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { isLocale } from "@/config/locales";
import { AuthCard } from "@/features/auth/components/auth-card";
import { FieldSeparator } from "@/components/ui/field";
import { ConsentBadge } from "@/features/auth/components/consent-badge";
import { redirectIfSignedIn } from "@/features/auth/server/session";
import { LoginForm } from "@/features/auth/components/login-form";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) return {};

  const t = await getTranslations({ locale });
  return { title: `${t("auth.login.title")} · ${t("metadata.siteName")}` };
}

export default async function Login({ params }: PageProps<"/[locale]/login">) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  // Nothing here to offer someone who's already signed in.
  await redirectIfSignedIn(locale);

  const t = await getTranslations("auth");

  return (
    <>
      <ConsentBadge>{t("login.consent")}</ConsentBadge>

      <div className="mt-[clamp(0.25rem,1.5vh,1.25rem)] flex w-full justify-center">
        <AuthCard title={t("login.title")} subtitle={t("subtitle")}>
          <LoginForm locale={locale} />

          <FieldSeparator className="mt-[clamp(0.5rem,2vh,2rem)] text-[11px] font-medium tracking-[0.12em] uppercase">
            {t("divider")}
          </FieldSeparator>

          <Button
            asChild
            variant="outline"
            size="form"
            className="mt-[clamp(0.5rem,2vh,1.5rem)]"
          >
            <Link href={`/${locale}/signup`}>
              {t("login.toSignup")}
            </Link>
          </Button>
        </AuthCard>
      </div>
    </>
  );
}
