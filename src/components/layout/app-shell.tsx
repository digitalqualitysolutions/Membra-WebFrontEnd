import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { SIDEBAR_COOKIE } from "@/components/layout/sidebar-cookie";
import { SidebarProvider } from "@/components/layout/sidebar-state";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import type { Locale } from "@/config/locales";
import type { SessionUser } from "@/features/auth/api/auth-wire";
import { memberAvatars } from "@/features/onboarding/services/avatars";
import { cn } from "@/lib/utils";

/**
 * Header, page, footer: the frame every screen sits in.
 *
 * A component rather than a layout, because the header needs to know who's
 * signed in and layouts don't re-render between navigations - the account menu
 * would still be showing the last member after a sign-out. Whoever renders a
 * page has already asked for the session, so it gets passed down from there.
 *
 * The picture is fetched here rather than passed in, unlike the session. Every
 * screen with a member wants the same badge in the same corner, and asking once
 * in the frame beats remembering it on each page. Deduped per request, so a
 * page that also shows the picture larger shares this answer.
 */
export async function AppShell({
  locale,
  user = null,
  signedIn = user !== null,
  className,
  children,
}: {
  locale: Locale;
  /** The signed-in member. `null` on the auth screens, where nobody is. */
  user?: SessionUser | null;
  /**
   * Whether to draw a member's frame - navigation and the sidebar toggle -
   * when `user` is null.
   *
   * The two aren't the same question. A visitor has no member and no
   * navigation. A member whose record didn't load has navigation, and every
   * link in it still works; what's missing is their name and picture, so the
   * account menu stays away and nothing else does. Without this, a failed
   * session read handed a signed-in member the visitor's frame - which is to
   * say, took the app away over one call.
   */
  signedIn?: boolean;
  /** Layout for the page area. Defaults to centred, as the auth cards want. */
  className?: string;
  children: ReactNode;
}) {
  const avatars = user ? await memberAvatars() : null;

  /*
   * Open unless the member closed it last time — and whether they said so at
   * all, which is a different question. Without an answer of their own, how
   * much room the screen has decides it, and only the browser knows that; the
   * provider takes it from here.
   *
   * Read here rather than in the browser so the first paint is already right,
   * and only for a member: the auth screens have no sidebar, and asking for a
   * cookie would opt them out of static rendering for an answer nothing uses.
   */
  const remembered = signedIn
    ? (await cookies()).get(SIDEBAR_COOKIE)?.value
    : undefined;

  const sidebarOpen = remembered !== "closed";

  /*
   * A row, not a column: the navigation runs the full height of the window on
   * the left, and everything else - header, page, footer - is the column
   * beside it.
   *
   * That's what lets the club's mark sit at the head of its own navigation
   * rather than in a bar above it. It also keeps the footer out of the
   * sidebar's lane: run across the bottom of both and the version text reads
   * as the sidebar's, and the sidebar stops short of the floor instead of
   * running the height of the app. `overflow-hidden` is what clips a closed
   * sidebar.
   */
  const shell = (
    <div className="flex h-dvh overflow-hidden">
      {signedIn ? <AppSidebar locale={locale} /> : null}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* The 96px variant: this is a 36px badge, which a sharp screen draws
            with ~72px of picture. The 32px one would look soft. */}
        <SiteHeader
          locale={locale}
          user={user}
          signedIn={signedIn}
          photoUrl={avatars?.medium}
        />

        {/*
         * The column scrolls, not the page area inside it, so the footer
         * travels with the content rather than sitting pinned across the
         * bottom. `flex-1` on the page keeps it at the foot of a short screen
         * and lets it scroll out of the way on a long one - the version and
         * the policy links are worth reaching, not worth 76px of every
         * viewport. The header and the sidebar are the only things that stay.
         */}
        <div
          data-app-scroll
          className="flex flex-1 flex-col overflow-y-auto bg-page"
        >
          <main
            className={cn(
              "flex flex-1 flex-col items-center justify-center-safe px-6 py-[clamp(0.25rem,1vh,4rem)]",
              className,
            )}
          >
            {children}
          </main>

          <SiteFooter />
        </div>
      </div>
    </div>
  );

  // The provider wraps the whole frame rather than the sidebar, because the
  // control that opens it lives in the header, outside it.
  return signedIn ? (
    <SidebarProvider
      defaultOpen={sidebarOpen}
      remembered={remembered !== undefined}
    >
      {shell}
    </SidebarProvider>
  ) : (
    shell
  );
}
