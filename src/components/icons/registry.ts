import {
  ArrowRight,
  AtSign,
  Building2,
  Cake,
  Calendar,
  CalendarDays,
  CalendarRange,
  CalendarX2,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Clock,
  Columns3,
  Eye,
  EyeOff,
  History,
  IdCard,
  ListChecks,
  Plus,
  LoaderCircle,
  FolderOpen,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  MonitorSmartphone,
  Network,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Smile,
  SquarePen,
  TriangleAlert,
  Trophy,
  Upload,
  UserCog,
  UserRound,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import { ConsentLock } from "@/components/icons/custom/consent-lock";
import { GroupCalendar } from "@/components/icons/custom/group-calendar";
import { MemberPhoto } from "@/components/icons/custom/member-photo";

/**
 * The shape every icon has to match, lucide's and ours alike. Since both
 * satisfy it, an entry can point at either and no call site has to care.
 */
export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * The icon registry, and the only place an icon gets chosen.
 *
 * Keys name the role an icon plays, never the glyph it happens to be: `email`,
 * not `atSign`. That's what makes this the single point of change. Pointing
 * `email` at a different glyph, or swapping a lucide icon for a hand-drawn one,
 * is one line here and nothing anywhere else.
 *
 * To add one: import it (from `lucide-react` or `./custom`), give it a role
 * name below, and it's available everywhere as `<Icon name="…" />`.
 */
export const icons = {
  /*
   * Brand. Stays hand-drawn; lucide has a calendar or people, never both, so
   * there's nothing to swap in.
   */
  brand: GroupCalendar,

  /* Community. The two halves of the brand mark, as plain UI icons. */
  events: CalendarDays,
  members: Users,

  /* Auth */
  consentLock: ConsentLock,
  email: AtSign,
  passwordShow: Eye,
  passwordHide: EyeOff,

  /*
   * Forms. `calendar` marks a date field, which is a separate role from
   * `events` above; that one stands for the community's own calendar.
   */
  checked: Check,
  calendar: Calendar,
  selectArrow: ChevronDown,

  /* Member picture */
  memberPhoto: MemberPhoto,
  avatarPlaceholder: Smile,
  camera: Camera,
  photoLibrary: FolderOpen,

  /* The signed-in member's own menu */
  account: UserRound,
  settings: Settings,
  signOut: LogOut,

  /** One of the places a member is signed in. */
  session: MonitorSmartphone,

  /*
   * The sidebar. `events` and `members` above already stand for two of these
   * destinations, so they're reused rather than restated under a second name.
   */
  chat: MessageCircle,
  find: Search,
  admin: ShieldCheck,

  /* Admin - general & venue */
  club: Building2,
  location: MapPin,
  seasons: CalendarRange,
  locationSchedules: Clock,
  locationGroups: Network,

  /* Admin - team operations */
  teams: UsersRound,
  seasonsTeams: Trophy,
  teamClosingDays: CalendarX2,
  locationTeamSchedule: Columns3,
  planTeam: ListChecks,

  /* Admin - people & access */
  memberTypes: IdCard,
  ageGroups: Cake,
  invite: Mail,
  invitesHistory: History,
  coaches: ClipboardList,
  admins: UserCog,

  /** Opens a nav section. Points down once the section is open. */
  navExpand: ChevronRight,
  /** Brings the navigation column back once it has been narrowed away. */
  expand: ChevronsRight,
  /** Narrows the navigation to a rail, from inside the navigation itself. */
  collapse: ChevronsLeft,
  /** Dismisses the navigation drawer on a narrow screen. */
  close: X,

  /* Editing a record in place */
  /** Turns a field, or a whole section, into something you can type in. */
  edit: SquarePen,
  /** Confirms the edit. Sits in the save bar. */
  save: Check,
  /** Adds another row to a list that has one. */
  add: Plus,
  /** Replaces a picture the club already has. */
  upload: Upload,
  /** Something worth reading before it becomes a problem. */
  warning: TriangleAlert,
  /** Points back at the count a chip is commenting on. */
  countHint: ChevronLeft,

  /* Actions */
  submitArrow: ArrowRight,
  /** Takes the place of an action's own icon while it's in flight. */
  pending: LoaderCircle,
  /** Runs the same action again after it failed. */
  retry: RotateCcw,
} satisfies Record<string, IconComponent>;

export type IconName = keyof typeof icons;
