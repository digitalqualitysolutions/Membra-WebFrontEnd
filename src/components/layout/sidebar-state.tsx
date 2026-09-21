"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  SIDEBAR_COOKIE,
  SIDEBAR_COOKIE_MAX_AGE,
} from "@/components/layout/sidebar-cookie";

/** What the logo button points `aria-controls` at. */
export const SIDEBAR_ID = "app-sidebar";

/** Below this the sidebar stops being a column and becomes a drawer. */
const MOBILE_QUERY = "(max-width: 767px)";

/**
 * Below this a column that hasn't been asked for starts as a rail.
 *
 * A tablet or a small laptop has room for the column but not much to spare,
 * and 256px of labels is a quarter of the screen the record was meant to have.
 * The icons are still there, still one click from anywhere, and the labels are
 * one click back. Above it, there's room for both and the column stays out.
 */
const NARROW_QUERY = "(max-width: 1023px)";

/** Tells React when the answer to that question changes. */
function subscribeToNarrow(onChange: () => void) {
  const query = window.matchMedia(NARROW_QUERY);
  query.addEventListener("change", onChange);

  return () => query.removeEventListener("change", onChange);
}

type SidebarState = {
  /** The column beside the page, on a screen wide enough to hold one. */
  open: boolean;
  /** The drawer over the page, which is what a narrow screen gets instead. */
  openMobile: boolean;
  toggle: () => void;
  close: () => void;
};

const SidebarContext = createContext<SidebarState | null>(null);

/**
 * Only ever called under the provider: the shell adds one for a signed-in
 * member, and the screens without a member render a plain logo that doesn't ask.
 */
export function useSidebar() {
  const state = useContext(SidebarContext);

  if (!state) {
    throw new Error("useSidebar must be used inside <SidebarProvider>");
  }

  return state;
}

export function SidebarProvider({
  /** What the cookie said, so the server's markup opens the same way. */
  defaultOpen,
  /** Whether that was a choice of the member's, or just our default. */
  remembered,
  children,
}: {
  defaultOpen: boolean;
  remembered: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();

  /**
   * What the member has asked for in this session, or `null` for nobody
   * having asked. A cookie counts as asking — it's last session's answer.
   */
  const [chosen, setChosen] = useState<boolean | null>(
    remembered ? defaultOpen : null,
  );

  /*
   * Whether the screen is short of room for a column of labels.
   *
   * Subscribed to rather than read once: a window gets resized and a tablet
   * gets turned, and the column should be a rail or not according to what the
   * screen is now. The server has no width to report, so it answers "not
   * narrow" and the first markup matches the cookie; the browser corrects it
   * on hydration.
   */
  const narrow = useSyncExternalStore(
    subscribeToNarrow,
    () => window.matchMedia(NARROW_QUERY).matches,
    () => false,
  );

  /*
   * Asked for, or else decided by the room available. A member who opened the
   * column meant it, so their answer outranks the measurement — and having it
   * close itself again on the next page would be the app arguing with them.
   */
  const open = chosen ?? !narrow;
  const setOpen = setChosen;

  /*
   * The drawer, remembered together with the page it was opened over.
   *
   * Following a link is meant to show you the page, and on a narrow screen the
   * drawer is sitting on top of it. Tying it to where you were is what closes
   * it: the moment the path changes it no longer matches, so the drawer is shut
   * in the same render the new page arrives in rather than by an effect that
   * shuts it afterwards.
   */
  const [drawer, setDrawer] = useState({ at: pathname, open: false });

  const openMobile = drawer.open && drawer.at === pathname;

  const close = useCallback(
    () => setDrawer({ at: pathname, open: false }),
    [pathname],
  );

  const toggle = useCallback(() => {
    /*
     * Which width we're at is asked at click time rather than tracked as state.
     * Nothing to keep in step with a resize, and nothing that could differ
     * between the server's render and the browser's first one - which is what
     * would otherwise flash a drawer open on a phone because a desktop left the
     * cookie open.
     */
    if (window.matchMedia(MOBILE_QUERY).matches) {
      setDrawer({ at: pathname, open: !openMobile });
      return;
    }

    /*
     * Against what's on screen, not against the stored choice — which is
     * `null` until someone makes one. Read that instead and the first click
     * on a wide screen would write "open" over a column that was already
     * open, and leave it there.
     */
    const next = !open;

    // Written straight to the cookie rather than through an action: it's a
    // preference the next render reads, not something the API wants to know.
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "open" : "closed"}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; samesite=lax`;

    setOpen(next);
  }, [open, openMobile, pathname, setOpen]);

  // Escape closes the drawer, the way it closes every other overlay.
  useEffect(() => {
    if (!openMobile) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openMobile, close]);

  const state = useMemo(
    () => ({ open, openMobile, toggle, close }),
    [open, openMobile, toggle, close],
  );

  return <SidebarContext value={state}>{children}</SidebarContext>;
}
