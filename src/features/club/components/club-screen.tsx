"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { Icon } from "@/components/icons";
import { LoadFailed } from "@/components/ui/load-failed";
import type {
  ClubActivity,
  ClubLanguageOption,
} from "@/features/club/api/club-wire";
import { AdminSafeguardBanner } from "@/features/club/components/admin-safeguard-banner";
import { ClubAddressesCard } from "@/features/club/components/club-addresses-card";
import { ClubContactCard } from "@/features/club/components/club-contact-card";
import { ClubDetailsCard } from "@/features/club/components/club-details-card";
import { ClubLocationsCard } from "@/features/club/components/club-locations-card";
import { ClubSetup } from "@/features/club/components/club-setup";
import type {
  ClubContact,
  ClubDetails,
  ClubLocation,
} from "@/features/club/types";
import type { Loaded } from "@/lib/loaded";

/**
 * Either the club, or the screen that creates one.
 *
 * The create action also revalidates the page, so a reload finds the club on
 * the server. Swapping to the cards here, from the club the action returned,
 * is what makes it immediate - and what shows the "your club is set up" notice
 * exactly once, to the admin who just created it.
 *
 * The page heading is drawn here rather than by the page for the same reason:
 * it only belongs once there's a record to head, and it has to appear the
 * moment the club exists.
 */
export function ClubScreen({
  club: saved,
  activities,
  languages,
  contacts,
  locations,
}: {
  /** The club, `null` for an admin who hasn't set one up, or a failed read. */
  club: Loaded<ClubDetails | null>;
  activities: readonly ClubActivity[];
  languages: readonly ClubLanguageOption[];
  contacts: ClubContact[];
  locations: Loaded<ClubLocation[]>;
}) {
  const t = useTranslations("club");
  const tError = useTranslations("errorPage");

  /**
   * The club as the API last answered it.
   *
   * Held here rather than in a card: two cards save against the same record
   * and a third reads its addresses, so a copy kept inside one of them would
   * leave the others showing what the club looked like before the save.
   */
  const [club, setClub] = useState(saved.ok ? saved.data : null);

  /** Set only by creating one here, so a club that already existed never sees it. */
  const [justCreated, setJustCreated] = useState(false);

  // Stable, because the setup form calls it from an effect keyed on it.
  const created = useCallback((next: ClubDetails) => {
    setClub(next);
    setJustCreated(true);
  }, []);

  /*
   * The club couldn't be read. Not the setup card: we don't know that there
   * isn't a club, and offering to create one would hand the admin a second.
   * Only until the first save - after that `club` is what the API returned.
   */
  if (!saved.ok && !club) {
    return (
      <div className="flex flex-1 flex-col">
        <LoadFailed title={tError("partClub")} />
      </div>
    );
  }

  /*
   * No club yet: the setup card is the whole page.
   *
   * The "Club details" heading describes a record, and there isn't one - the
   * setup card carries its own title, and the breadcrumb already says where
   * you are. A growing flex column, so the intro card can centre itself in
   * the height of the page.
   */
  if (!club) {
    return (
      <div className="flex flex-1 flex-col">
        <ClubSetup
          activities={activities}
          languages={languages}
          onCreate={created}
        />
      </div>
    );
  }

  return (
    <>
      <header className="border-b border-line pb-5">
        <h1 className="text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">
          {t("title")}
        </h1>

        {/* `text-body`, not `text-subtle`: this is a sentence to read, and the
            subtle grey is for placeholders - it sits at 2.5:1 on white, well
            under the 4.5:1 body copy needs. */}
        <p className="mt-1.5 text-[13px] text-body sm:text-sm">
          {t("description")}
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-6">
        {justCreated ? (
          <CreatedNotice onDismiss={() => setJustCreated(false)} />
        ) : null}

        <AdminSafeguardBanner
          admins={club.admins}
          recommended={club.recommendedAdmins}
        />

        <ClubDetailsCard
          club={club}
          activities={activities}
          languages={languages}
          onSaved={setClub}
        />

        {/* Between the record and the locations, which is the order they're
            filled in: a hub books against one of these addresses. */}
        <ClubAddressesCard club={club} onSaved={setClub} />

        <ClubContactCard contacts={contacts} />

        {/* The club's own addresses go along: a hub is parented to one of
            them, so the dropdown offers what the card above already has. */}
        {locations.ok ? (
          <ClubLocationsCard
            locations={locations.data}
            clubId={club.id}
            addresses={club.addresses}
          />
        ) : (
          // The record above it still rendered, so only this card is missing.
          <LoadFailed title={tError("partLocations")} />
        )}
      </div>
    </>
  );
}

/**
 * Says the club was made, and what comes next.
 *
 * The page changes completely on creation, so without this the only sign it
 * worked is that the form vanished. It names the next step too: setup is a
 * sequence, and the addresses are what the locations are built on.
 */
function CreatedNotice({ onDismiss }: { onDismiss: () => void }) {
  const t = useTranslations("club.setup");

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-2xl border border-success/30 bg-success/10 px-5 py-4"
    >
      <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-on-ink">
        <Icon name="checked" size="xs" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-ink">
          {t("createdTitle")}
        </p>
        <p className="mt-0.5 text-[13px] text-body">{t("createdBody")}</p>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label={t("dismiss")}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-body transition-colors outline-none hover:bg-success/15 focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <Icon name="close" size="xs" />
      </button>
    </div>
  );
}
