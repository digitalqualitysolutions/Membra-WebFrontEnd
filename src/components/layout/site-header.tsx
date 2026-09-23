import Link from "next/link";
import { useTranslations } from "next-intl";

import { ContextChip } from "@/components/layout/context-chip";
import { Logo } from "@/components/layout/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { SidebarToggle } from "@/components/layout/sidebar-toggle";
import type { Locale } from "@/config/locales";
import type { SessionUser } from "@/features/auth/api/auth-wire";
import { AccountMenu } from "@/features/auth/components/account-menu";
import { cn } from "@/lib/utils";

/**
 * @param user the signed-in member, or `null` for a visitor. Passed in rather
 *   than read here: this renders inside a shell that a page owns, and the page
 *   has already asked the data layer who's signed in.
 * @param photoUrl their picture, from the shell. Absent for a member who hasn't
 *   uploaded one, and for one whose avatars couldn't be read.
 */
export function SiteHeader({
  locale,
  user = null,
  signedIn = user !== null,
  photoUrl = null,
}: {
  locale: Locale;
  user?: SessionUser | null;
  /** Draw a member's header without their record - see `AppShell`. */
  signedIn?: boolean;
  photoUrl?: string | null;
}) {
  const t = useTranslations("header");

  return (
    <header className="shrink-0 border-b border-line bg-surface">
      {/*
       * The bar now spans the page rather than the whole window - the sidebar
       * is a column of its own beside it - so it insets by the page's margin
       * at both ends, and by the wider one on the screens a visitor sees,
       * where there's no navigation to the left of it.
       */}
      <div
        className={cn(
          "flex h-16 items-center justify-between",
          signedIn ? "px-6" : "px-6 sm:px-8 lg:px-12",
        )}
      >
        {/* A member gets the control that shows and hides the navigation; the
            mark itself is at the head of that navigation. A visitor has no
            navigation, so the corner is the mark, and it leads home. */}
        <div className="flex items-center gap-3">
          {signedIn ? (
            <SidebarToggle />
          ) : (
            <Link
              href={`/${locale}`}
              aria-label={t("home")}
              className="inline-flex"
            >
              <Logo />
            </Link>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* Renders itself away everywhere but inside a section, so it costs
              the other screens nothing to have it sit here. */}
          <ContextChip />

          <LanguageSwitcher locale={locale} label={t("language")} />

          {user ? (
            <AccountMenu user={user} locale={locale} photoUrl={photoUrl} />
          ) : null}
        </div>
      </div>
    </header>
  );
}
