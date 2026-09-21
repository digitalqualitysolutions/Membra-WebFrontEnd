"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { Icon } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Locale } from "@/config/locales";
import type { SessionUser } from "@/features/auth/api/auth-wire";
import { MemberAvatar } from "@/features/auth/components/member-avatar";
import { logOutAction } from "@/features/auth/services/logout";

/**
 * The signed-in member's own menu, in the header.
 *
 * Renders for a member and never for a visitor, so the avatar showing up at all
 * is the sign that a session is live.
 */
export function AccountMenu({
  user,
  locale,
  photoUrl = null,
}: {
  user: SessionUser;
  locale: Locale;
  /** Their picture, or `null` to fall back to initials. */
  photoUrl?: string | null;
}) {
  const t = useTranslations("account");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("menuLabel")}
        className="flex items-center rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <MemberAvatar user={user} photoUrl={photoUrl} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {/* Who you're signed in as, which is the question a shared machine
            raises and the reason this menu opens on an identity rather than
            straight onto actions. */}
        <DropdownMenuLabel>
          <span className="block truncate text-[13px] font-semibold text-ink">
            {displayNameOf(user)}
          </span>
          <span className="mt-0.5 block truncate text-[12px] font-normal text-subtle">
            {user.email}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href={`/${locale}/profile`}>
            <Icon name="account" />
            {t("profile")}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href={`/${locale}/settings`}>
            <Icon name="settings" />
            {t("settings")}
          </Link>
        </DropdownMenuItem>

        {/*
         * A form rather than a click handler. Signing out is a write, and the
         * action's redirect is what the router follows afterwards; posting it
         * keeps that a normal navigation instead of something to orchestrate.
         */}
        <form action={logOutAction.bind(null, locale)}>
          <DropdownMenuItem asChild>
            <button type="submit">
              <Icon name="signOut" />
              {t("logOut")}
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** What to call them, best available first. Never blank: email always exists. */
function displayNameOf(user: SessionUser): string {
  const parts = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

  return parts || user.nickname?.trim() || user.email;
}
