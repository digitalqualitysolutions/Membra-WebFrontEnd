import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { inter } from "@/config/fonts";
import { isLocale, locales } from "@/config/locales";

import "../globals.css";

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) return {};

  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("siteName"),
    description: t("description"),
    // We ship our own translations, so don't offer Chrome's machine ones.
    other: { google: "notranslate" },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  return (
    // Google Translate rewrites the DOM out from under React and breaks
    // hydration, so opt the whole document out of it.
    <html
      lang={locale}
      translate="no"
      className={`${inter.variable} notranslate h-full antialiased`}
    >
      {/* Some browser extensions stamp their own attributes onto <body> before
          React hydrates. Nothing we can do about it, so ignore them. */}
      <body className="min-h-full font-sans" suppressHydrationWarning>
        {/* Locale and messages for every client component below. */}
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
