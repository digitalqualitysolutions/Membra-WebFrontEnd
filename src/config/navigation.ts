import type { IconName } from "@/components/icons";

/**
 * The sidebar, as data.
 *
 * `key` is the item's label under the `nav` namespace, and `path` is what
 * follows the locale segment - a link is `/${locale}${path}`. Both stay literal
 * through the `as const` below, which is what keeps `t(key)` checked against
 * the dictionary instead of falling back to a bare string.
 */
export type NavLink = {
  readonly key: string;
  readonly path: string;
  readonly icon: IconName;
};

/** A labelled run of links inside a section. */
export type NavGroup = {
  readonly key: string;
  readonly items: readonly NavLink[];
};

export type NavItem = NavLink & {
  /** Present when the item opens a nested list rather than only leading somewhere. */
  readonly groups?: readonly NavGroup[];
};

/**
 * Four destinations, one of which unfolds.
 *
 * Admin is the club's back office and it is long, so it stays folded away
 * behind its own row: three things a member uses daily, and everything they
 * only visit to set something up one level down.
 */
export const navigation = [
  { key: "event", path: "/event", icon: "events" },
  { key: "chat", path: "/chat", icon: "chat" },
  { key: "find", path: "/find", icon: "find" },
  {
    key: "admin",
    path: "/admin",
    icon: "admin",
    groups: [
      {
        key: "generalVenue",
        items: [
          { key: "club", path: "/admin/club", icon: "club" },
          { key: "location", path: "/admin/location", icon: "location" },
          { key: "seasons", path: "/admin/seasons", icon: "seasons" },
          {
            key: "locationSchedules",
            path: "/admin/location-schedules",
            icon: "locationSchedules",
          },
          {
            key: "locationGroups",
            path: "/admin/location-groups",
            icon: "locationGroups",
          },
        ],
      },
      {
        key: "teamOperations",
        items: [
          { key: "teams", path: "/admin/teams", icon: "teams" },
          {
            key: "seasonsTeams",
            path: "/admin/seasons-teams",
            icon: "seasonsTeams",
          },
          {
            key: "teamClosingDays",
            path: "/admin/team-closing-days",
            icon: "teamClosingDays",
          },
          {
            key: "locationTeamSchedule",
            path: "/admin/location-team-schedule",
            icon: "locationTeamSchedule",
          },
        ],
      },
      {
        key: "peopleAccess",
        items: [
          { key: "memberTypes", path: "/admin/member-types", icon: "memberTypes" },
          { key: "ageGroups", path: "/admin/age-groups", icon: "ageGroups" },
          { key: "invite", path: "/admin/invite", icon: "invite" },
          {
            key: "invitesHistory",
            path: "/admin/invites-history",
            icon: "invitesHistory",
          },
          { key: "members", path: "/admin/members", icon: "members" },
          { key: "coaches", path: "/admin/coaches", icon: "coaches" },
          { key: "admins", path: "/admin/admins", icon: "admins" },
        ],
      },
      {
        key: "planning",
        items: [{ key: "planTeam", path: "/admin/plan-team", icon: "planTeam" }],
      },
    ],
  },
] as const satisfies readonly NavItem[];

/**
 * The item a path belongs to, sections and their children alike.
 *
 * Lets a screen name itself from the same list the sidebar renders, so a label
 * is written once and the page and the link it came from can't disagree.
 */
export function navLinkFor(path: string) {
  for (const item of navigation) {
    if (item.path === path) return item;

    if ("groups" in item) {
      for (const group of item.groups) {
        for (const link of group.items) {
          if (link.path === path) return link;
        }
      }
    }
  }

  return null;
}

/**
 * The section a path sits in and the destination inside it, when there is one.
 *
 * What the header's context chip reads. Nothing comes back for a path that is
 * its own section: "Admin" on its own repeats the heading already on the page,
 * and it's the second half that says something the page doesn't.
 */
export function navTrailFor(path: string) {
  for (const item of navigation) {
    if (!("groups" in item) || !isNavActive(path, item)) continue;

    for (const group of item.groups) {
      for (const link of group.items) {
        if (isNavActive(path, link)) return { section: item, link };
      }
    }
  }

  return null;
}

/** Whether a path is inside a destination, so a parent lights up with its children. */
export function isNavActive(path: string, link: NavLink) {
  return path === link.path || path.startsWith(`${link.path}/`);
}

/** The path as `navigation` writes it: the locale segment dropped off the front. */
export function sectionPath(pathname: string) {
  const [, , ...rest] = pathname.split("/");

  return `/${rest.join("/")}`;
}
