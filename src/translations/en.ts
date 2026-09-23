/**
 * English copy, and the shape every other dictionary has to match.
 * `Dictionary` is inferred from this file, so adding a key here makes
 * TypeScript ask for a translation in `da.ts`.
 */
export const en = {
  metadata: {
    siteName: "Membra",
    description: "Physical Communities Portal & Member Registry.",
  },

  header: {
    home: "Membra home",
    language: "Language",
  },

  /**
   * The sidebar. Keys match `config/navigation.ts`: an item's `key` is its
   * label here, so a destination is named once and renders the same in the
   * sidebar and on the page it leads to.
   */
  nav: {
    label: "Club navigation",
    openMenu: "Open navigation",
    closeMenu: "Close navigation",

    event: "Event",
    chat: "Chat",
    find: "Find",
    admin: "Admin",

    generalVenue: "General & venue",
    club: "Club",
    location: "Location",
    seasons: "Seasons",
    locationSchedules: "Location schedules",
    locationGroups: "Location groups",

    teamOperations: "Team operations",
    teams: "Teams",
    seasonsTeams: "Seasons & teams",
    teamClosingDays: "Team closing days",
    locationTeamSchedule: "Location team schedule",

    peopleAccess: "People & access",
    memberTypes: "Member types",
    ageGroups: "Age groups",
    invite: "Invite",
    invitesHistory: "Invites history",
    members: "Members",
    coaches: "Coaches",
    admins: "Admins",

    planning: "Planning",
    planTeam: "Plan team",

    /** Every screen behind these links, until the real one is built. */
    placeholder:
      "This part of Membra isn't built yet. It will show up here once it is.",
  },

  footer: {
    version: "Membra Core Web  Version 4.8.2-prod",
    links: {
      privacy: "Privacy Governance",
      terms: "Digital Community Terms",
      audit: "Cryptographic Audit",
      support: "Support",
    },
  },

  auth: {
    subtitle: "Physical Communities Portal & Member Registry",
    divider: "or",
    showPassword: "Show password",
    hidePassword: "Hide password",
    emailLabel: "Email",
    emailPlaceholder: "name@community.dk",
    rememberMe: "Remember me",

    login: {
      title: "Log in to your account",
      consent: "Membra never shares data without your previous consent",
      passwordLabel: "password",
      passwordPlaceholder: "••••••••••••",
      forgotPassword: "Forgot password?",
      submit: "Log in",
      toSignup: "Not a member? Register",
    },

    signup: {
      title: "Create new user",
      consent: "Membra never shares data without your previous consent",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter strong password",
      confirmLabel: "Re enter password",
      confirmPlaceholder: "Re enter password",
      submit: "Create new user",
      toLogin: "Already have an account? Log in",
    },
  },

  onboarding: {
    skip: "Skip for now",

    profile: {
      title: "Most clubs will ask you to share few personal data",
      metaTitle: "Club profile",
      consent: "Membra never shares data without your previous consent",
      firstNameLabel: "First name",
      firstNamePlaceholder: "e.g. Frederik",
      lastNameLabel: "Last name",
      lastNamePlaceholder: "e.g. Lindqvist",
      nicknameLabel: "Nickname",
      nicknameHint: "(if used)",
      nicknamePlaceholder: "e.g. Freddie",
      dateOfBirthLabel: "Date of birth",
      dateOfBirthPlaceholder: "DD / MM / YYYY",
      dateOfBirthPicker: "Open calendar",
      genderLabel: "Team gender",
      genderPlaceholder: "Select gender",
      genderOptions: {
        male: "Male",
        female: "Female",
        // Keyed `others`, which is the API's word for it. The label a member
        // reads is still ours.
        others: "Other",
      },
      languageLabel: "Preferred language",
      languagePlaceholder: "Select language",
      languageOptions: {
        da: "Danish",
        en: "English",
      },
      consentStorage:
        "Consent to store basic sports pass data under Nordic Guild privacy framework and federated DIF rules.",
      submit: "Save",
    },

    photo: {
      title: "Add your member picture",
      metaTitle: "Member picture",
      consent:
        "Membra never shares biometric or visual data without your explicit consent",
      description:
        "A recognizable picture is a tremendous help for coaches and teammates",
      formats: "JPG, PNG, HEIC, WebP or AVIF · Max 8MB",
      preview: "Your member picture",
      change: "Change picture",
      takePhoto: "Take photo",
      findPhoto: "Find photo",
      uploading: "Saving your picture…",
      retry: "Try again",
      /* Framing the picture. Shown for club logos too, worded to suit both. */
      cropTitle: "Position your picture",
      cropDescription:
        "Drag to move, and zoom until the circle holds what you want. Zoom out to keep the whole picture.",
      /** On the slider's handle, which has no visible label beside it. */
      zoom: "Zoom",
      zoomOut: "Zoom out",
      zoomIn: "Zoom in",
      rotateLeft: "Rotate left",
      rotateRight: "Rotate right",
      cropReset: "Reset",
      /** While an iPhone picture is being decoded, which takes a moment. */
      preparing: "Preparing…",
      cropCancel: "Cancel",
      cropConfirm: "Use this picture",
    },
  },

  /** The member's own menu in the header. */
  account: {
    menuLabel: "Your account",
    profile: "Profile",
    settings: "Settings",
    logOut: "Log out",
  },

  /** The club's own screen, the first of the admin sections. */
  club: {
    metaTitle: "Club",
    title: "Club details",
    description:
      "Manage club parameters, federation addresses, facility locations, and booking hierarchy permissions.",

    /** The banner about running short of administrators. */
    safeguard: {
      title: "Administrator Resilience Safeguard",
      count: "Current Admins: {count}",
      body: "Remember – clubs with fewer than {recommended} admins risk operational lockout during vacations or turnover. Consider adding a {recommended}rd administrator now.",
      invite: "Invite {recommended}rd administrator",
      snooze: "Do not show message for the next 30 days",
      dismiss: "Dismiss this message",
    },

    /** The searchable, multi-choice activity field. */
    activityPicker: {
      placeholder: "Choose activities",
      search: "Search activities",
      noMatch: "No activities match “{query}”.",
      /** After the first names in the closed field: "Padel, Tennis +3". */
      more: "+{count}",
      truncated:
        "Showing the first {shown} of {total}. Keep typing to narrow it down.",
      selected:
        "{count, plural, =0 {None selected} one {# selected} other {# selected}}",
      clear: "Clear",
    },

    /** The first-run screen, before any club record exists. */
    setup: {
      /** The first screen: one button. */
      intro: {
        title: "Set up your club",
        body: "Add your club's name and language, and the addresses where it plays. Members, teams and locations are all built on top of this.",
        start: "Add club",
      },

      detailsTitle: "Club details",
      detailsDescription:
        "The name your members know you by, and where you're based.",

      namePlaceholder: "e.g. Nordic Volleyball Club",
      shortPlaceholder: "e.g. NVC",
      languagePlaceholder: "Choose a language",
      /** The secondary language slot left empty. */
      noLanguage: "None",

      /** Read out after a required field's label, for screen readers. */
      required: "required",
      /** The key to the asterisks, beside the Create button. */
      requiredNote: "Required fields. Fill these in to create your club.",

      address: {
        title: "Club addresses",
        intro:
          "Every place your club plays. The first one is your primary address. Halls and courts are attached to these, so you'll need at least one.",
        heading: "Address {number}",
        name: "Name",
        namePlaceholder: "e.g. Main hall",
        shortPlaceholder: "e.g. MH",
        streetName: "Street",
        streetNamePlaceholder: "e.g. Lyngbyvej",
        streetNumber: "Street no.",
        /** For the narrow field on the club card, where the label won't fit. */
        streetNumberShort: "S. no.",
        streetNumberPlaceholder: "e.g. 1",
        zip: "Zip code",
        zipPlaceholder: "e.g. 2100",
        city: "City",
        cityPlaceholder: "e.g. Copenhagen",
        /** Optional fields say so in their label; required ones carry a star. */
        region: "Region (optional)",
        regionPlaceholder: "e.g. Capital Region",
        directions: "Directions (optional)",
        directionsPlaceholder: "e.g. Courts are behind the sports hall",
        add: "Add another address",
        remove: "Remove address {number}",
      },

      create: "Create club",

      /** The notice shown once, right after the club is created. */
      createdTitle: "Your club is set up",
      createdBody:
        "Your details and addresses are saved. You can change any of them from the cards below.",
      dismiss: "Dismiss",
    },

    details: {
      title: "Club details",
      description:
        "Core organizational attributes, languages, and active status",
      activeStatus: "Club Active Status:",
      /** On the pencil beside the section title. */
      editAll: "Edit all club details",
      /** On each field's own pencil. */
      editField: "Edit {field}",
    },

    fields: {
      name: "Club name",
      short: "Short",
      established: "Club established",
      admins: "Admins",
      active: "Active",
      inactive: "Inactive",
      /** The amber chip beside the admin count. */
      recommended: "{recommended} recommended",
      activity: "Club activities",
      /** Opens the activities a club has beyond the two lines that are read. */
      activityMore: "+{count} more",
      /** Folds them away again. */
      activityLess: "Show less",
      /** In the activity dropdown when the list from the API didn't load. */
      activitiesUnavailable: "Activities couldn't be loaded",
      /** In a language dropdown when the list from the API didn't load. */
      languagesUnavailable: "Languages couldn't be loaded",
      language: "Club language",
      primary: "Primary",
      secondary: "Secondary",
      /** The day-first date field, shared by setup and the club card. */
      datePlaceholder: "DD / MM / YYYY",
      datePicker: "Open calendar",
      avatar: "Club avatar",
      upload: "Upload",
      uploadFormats: "JPG, PNG, HEIC, WebP or AVIF · Max 8MB",
      replace: "Replace",
      remove: "Remove",
      avatarInvalid:
        "Choose a JPG, PNG, HEIC, WebP or AVIF picture of 8MB or less.",
      yes: "Yes",
      no: "No",
    },

    addresses: {
      title: "Club physical addresses",
      description:
        "The places the club sits at, and the one it answers on. Locations are booked against these.",
      /** On the chevron that folds the table away. */
      collapse: "Hide club physical addresses",
      expand: "Show club physical addresses",
      /** On the pencil beside the card title. */
      editAll: "Edit club physical addresses",
      address: "Club physical addresses",
      short: "Short",
      directions: "Directions",
      prime: "Prime",
      actions: "Actions",
      add: "Add address",
      edit: "Edit address",
      /** On the remove button of an address added but not saved yet. */
      removeNew: "Remove this new address",
      /** The name of each row's primary radio, for assistive tech. */
      makePrimary: "Make {address} the primary address",
      /** Said when someone switches the primary off, which does nothing. */
      primaryFixed:
        "A club always has one primary address. Switch another address on to move it.",
      primaryOnly:
        "This is your club's only address, so it stays the primary one.",
      /** Stands in for directions nobody has written. */
      none: "–",
    },

    editing: {
      section: "Section edit mode active - all club parameters are editable.",
      field: "Field edit mode active.",
      /** In place of the above while something required is still empty. */
      incomplete: "Fill in the required fields to save.",
      cancel: "Cancel",
      /** One word in every mode and every card: the same save, whatever set it off. */
      save: "Save",
    },

    /** How to reach the club. */
    contact: {
      title: "Phone numbers, email addresses",
      editAll: "Edit contact details",
      phone: "Phone number",
      phonePlaceholder: "e.g. +45 12 34 56 78",
      /** On the save bar when a number is too short to be one. */
      phoneInvalid: "That phone number is too short to be a phone number.",
      email: "Official club email",
      emailPlaceholder: "e.g. info@nordicvolleyball.dk",
      /** On the save bar when an address can't be one. */
      emailInvalid: "That email address is missing something - check it over.",
      website: "Website",
      websitePlaceholder: "e.g. nordicvolleyball.dk",
      person: "Primary contact person",
      personPlaceholder: "e.g. Frederik Lindqvist",
      /** Stands in for a detail nobody has filled in. */
      none: "–",
      /** The card before anyone has filled any of it in. */
      empty: "No contact details yet.",
      emptyBody:
        "Add a phone number, an email or a website so members can reach the club.",
      add: "Add contact details",
      /** The table's last column, and the two buttons that live in it. */
      actions: "Actions",
      edit: "Edit contact {number}",
      remove: "Remove contact {number}",
      editing: "Contact edit mode active.",
    },

    /** The locations the club books. */
    locations: {
      title: "Locations (halls, courts)",
      editAll: "Edit locations",
      filter: "Filter by name, code…",
      editing:
        "Locations edit mode active. Adjust toggles or routing dropdowns.",
      unsaved: "You have unsaved changes in Locations.",
      empty: "No locations match that filter.",
      none: "–",

      columns: {
        name: "Locations",
        short: "Short",
        show: "Show",
        parentAddress: "Address",
        parentLocation: "Parent location",
        memberBooking: "Mbr book",
        teamMemberBooking: "T. mbr b.",
        memberBookingCount: "# mbr b.",
        public: "Public",
        friends: "Friends",
        active: "Active",
        directions: "Directions",
        actions: "Actions",
      },

      /** The pencil on a row, which opens its name and code for typing. */
      editRow: "Edit {name}",
      nameRequired: "A location needs a name.",
      shortRequired: "A location needs a short code.",
      shortInvalid:
        "A short code is up to 8 characters and can't contain a dot or a space.",
      shortTaken: "“{short}” is already used in this location. Pick another.",
      countInvalid: "Members required to book is a number from 1 to 30.",
    },
  },

  /** The whole estate at once, as one matrix. */
  location: {
    metaTitle: "Locations",
    title: "Locations overview",
    description:
      "Hierarchical court and facility matrix, active status, public visibility, quotas, and location groupings.",

    filter: "Filter by name, code, group…",
    /** The pill that adds the table up. Green only while all are active. */
    summaryAll: "All {total} locations active ({bookable} bookable)",
    summarySome: "{active} of {total} locations active ({bookable} bookable)",
    expandAll: "Expand all",
    collapseAll: "Collapse all",
    add: "Add location",
    empty: "No locations match that filter.",
    /** Stands in for a column that doesn't apply to the row. */
    none: "–",
    /** A court in more groups than its row has room for. */
    moreGroups: "+{count}",

    /** The single letters the on/off columns are read down. */
    yes: "Y",
    no: "N",

    /** On the fold toggle at the head of a branch. */
    fold: "Collapse {name}",
    unfold: "Expand {name}",

    columns: {
      name: "Name",
      short: "Short",
      show: "Shown",
      memberBooking: "Mbr. b.",
      memberBookingCount: "	# mbr b.",
      public: "Public",
      groups: "Location groups",
      active: "Active",
    },

    surfaces: {
      indoor: "Indoor",
      outdoor: "Outdoor",
    },

    /** The panel a location is created from. */
    form: {
      title: "Add location",
      description:
        "A location is anything that can be booked, or that events take place at.",
      close: "Close add location",

      name: "Name",
      namePlaceholder: "Location name",
      short: "Short",
      shortPlaceholder: "In short",
      /** Two locations under the same parent can't share a short code. */
      shortTaken: "“{short}” is already used in this location. Pick another.",
      /** A dot is the separator in the shown name, so it can't sit inside one. */
      shortInvalid: "A short code can't contain a dot or a space.",
      parentSite: "Parent address",
      parentLocation: "Parent location",
      memberBookable: "Mbr bookable",
      toBook: "# to book",
      public: "Public",
      active: "Active",
      inGroups: "In location groups",

      /** Nothing chosen: an empty dropdown, quota, or group list. */
      none: "–",

      save: "Save",
    },

    /**
     * Shown only while the club has no locations at all - it's written for
     * someone creating their first one.
     */
    /** The first view, before the club has any locations. */
    emptyState: {
      title: "Add your first location",
      body: "Locations are the halls, zones and courts your club books. Start with a top-level one, such as a hall, and add what's inside it afterwards.",
      add: "Add location",
    },

    help: {
      title: "Help",
      intro:
        "A location represents any place or item which can be booked, or where events take place. Before creating a location, it's important that all unique addresses are added to your club's data (see Admin/Club).",
      naming:
        "Short descriptive location names are best (e.g. Club Hall) and the short name will be used as a tag (e.g. Club). Before creating locations it's important to consider the hierarchy they are structured in. E.g. Club Hall may be the “top parent”, which then has two “children” Hall 1 & Hall 2. Hall 1 could then potentially be the parent of the children Court 1, Court 2 and Court 3. Location names do not need to incl. parents name, and they do not need to be unique. For instance, there could be several “Court 1” locations, but each with a different parent (“Hall 1” could be parent of one “Court 1”, whereas “Hall 2” could then be parent to another “Court 1”).",
      tip1: "Tip 1: Create club addresses before creating any locations (Admin/Club)",
      tip2: "Tip 2: Create all top parents, before creating the next level of locations.",

      terms: {
        parentSite: "Parent address",
        parentLocation: "Parent location",
        memberBookable: "Member bookable",
        toBook: "# to book",
        public: "Public",
        active: "Active",
        groups: "Location groups",
      },

      defs: {
        parentSite:
          "Only used, when there is a unique address to the location. E.g. “Club Hall” from the example above would probably have a parent address, whereas “Hall 1” would not have a parent address, but instead a parent location being “Club Hall”.",
        parentLocation:
          "The “parent” of a “child” location, when no Parent address apply.",
        memberBookable:
          "Determines whether club members can book the location and thereby reserve it for their personal use. A tennis court would probably be “Mbr bookable” whereas a big swimming pool might not be.",
        toBook:
          "If a location is “Mbr bookable” it must be determined, how many members are required for a booking. In some cases, it may be determined that any club member can simply book a location (e.g. a double paddle court) on their own - in other cases the club may determine that for a member to book such location, they may need to book it together with 3 other club colleagues, in which case the “# to book” should equal 4.",
        public:
          "Determines whether outsiders can book the location (e.g. a tennis court which anyone can book online).",
        active: "Is this location in active use?",
        groups:
          "Can be needed to assign a group of locations to a team. E.g. if a team is playing on 1 and 2 out of 5 available courts in a sports hall a group of “C1-2” is needed. Location groups are managed in Admin/Location groups and is only shown here for info.",
      },
    },
  },

  home: {
    metaTitle: "Home",
    greeting: "Hi, {name}",
    description:
      "You're signed in to Membra. Your club's events and members will show up here.",
  },

  profile: {
    metaTitle: "Profile",
    title: "Your profile",
    description: "Keep the details your club sees up to date.",
    saved: "Profile updated",
    /**
     * The picture above the form. Everything else it says - the formats, the
     * button, the retry - is onboarding's photo step, reused rather than
     * rewritten.
     */
    photoSaved: "Picture updated",
  },

  settings: {
    metaTitle: "Settings",
    title: "Settings",
    description: "Manage how you use your Membra account.",
    sessions: {
      title: "Active sessions",
      description:
        "Where you're signed in right now. End any session you don't recognise.",
      thisDevice: "This device",
      otherDevice: "Signed-in session",
      current: "Current",
      startedAt: "Started {when}",
      expiresAt: "expires {when}",
      revoke: "Sign out",
      unavailable: "Your sessions could not be loaded. Try again in a moment.",
    },
  },

  errors: {
    emailTaken: "An account with this email already exists",
    invalidCredentials: "Invalid email or password",
    network: "Could not reach Membra. Check your connection and try again.",
    photoRejected: "That picture could not be saved. Try a different one.",
    rateLimited: "Too many tries. Wait a moment and try again.",
    /** The API turned a value down; its own reason follows, in English. */
    clubRejected: "The club couldn't be created: {reason}",
    clubConflict: "A club with that name or short code already exists.",
    /** An API refusal while changing something; its own reason follows, in English. */
    saveRejected: "That couldn't be saved: {reason}",
    forbidden: "You don't have permission to change this club.",
    logoFailed:
      "The details were saved, but the logo couldn't be uploaded. Try a different picture.",
    unexpected: "Something went wrong. Please try again.",
  },

  /**
   * A part of a screen that couldn't be read, shown where that part would
   * have been. Not a form message, and no longer a whole-page one either -
   * pages handle their own failures rather than handing them to a boundary.
   */
  errorPage: {
    /** Under one part that failed while the rest of the page rendered. */
    partDescription:
      "Trying again often works; the rest of this page is unaffected.",
    /** Names the part that failed, in the space that part would have filled. */
    partClub: "The club record couldn't be loaded",
    partLocations: "Locations couldn't be loaded",
    /** The member's own record: the page's contents and their avatar. */
    partAccount: "Your account couldn't be loaded",
    retry: "Try again",
  },

  notFound: {
    title: "Page not found",
    description: "This page does not exist, or it has moved somewhere else.",
    backToLogin: "Back to log in",
  },

  validation: {
    emailRequired: "Email address is required",
    emailInvalid: "Enter a valid email address",
    emailTooLong: "Use 254 characters or fewer",
    emailDisposable: "Use a permanent email address, not a temporary one",
    passwordRequired: "Password is required",
    passwordTooShort: "Use at least 8 characters",
    passwordTooLong: "Use 128 characters or fewer",
    passwordNeedsLowercase: "Include a lowercase letter",
    passwordNeedsUppercase: "Include an uppercase letter",
    passwordNeedsNumber: "Include a number",
    confirmRequired: "Re-enter your password",
    passwordsDoNotMatch: "Passwords do not match",
    firstNameRequired: "First name is required",
    lastNameRequired: "Last name is required",
    nicknameRequired: "Nickname is required",
    nameTooLong: "Use 60 characters or fewer",
    dateOfBirthRequired: "Date of birth is required",
    dateOfBirthInvalid: "Enter a real date as DD / MM / YYYY",
    dateOfBirthFuture: "Date of birth cannot be in the future",
    genderRequired: "Select a team gender",
    languageRequired: "Select a preferred language",
    consentStorageRequired: "Consent is needed to store your club profile",
    photoTooLarge: "Pick a picture of 8MB or less",
    photoUnsupportedType: "Pick a JPG, PNG, HEIC, WebP or AVIF picture",
  },
};

/** Every string the UI renders, one shape per locale. */
export type Dictionary = typeof en;
