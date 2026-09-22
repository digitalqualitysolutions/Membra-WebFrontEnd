import type { Dictionary } from "@/translations/en";

/** Dansk. Typed against the English dictionary so nothing goes untranslated. */
export const da: Dictionary = {
  metadata: {
    siteName: "Membra",
    description: "Portal for fysiske fællesskaber og medlemsregister.",
  },

  header: {
    home: "Membra forside",
    language: "Sprog",
  },

  nav: {
    label: "Klubnavigation",
    openMenu: "Åbn menu",
    closeMenu: "Luk menu",

    event: "Begivenheder",
    chat: "Chat",
    find: "Find",
    admin: "Administration",

    generalVenue: "Generelt & sted",
    club: "Klub",
    location: "Lokation",
    seasons: "Sæsoner",
    locationSchedules: "Lokationsplaner",
    locationGroups: "Lokationsgrupper",

    teamOperations: "Holddrift",
    teams: "Hold",
    seasonsTeams: "Sæsoner & hold",
    teamClosingDays: "Holdets lukkedage",
    locationTeamSchedule: "Lokationens holdplan",

    peopleAccess: "Personer & adgang",
    memberTypes: "Medlemstyper",
    ageGroups: "Aldersgrupper",
    invite: "Invitation",
    invitesHistory: "Invitationshistorik",
    members: "Medlemmer",
    coaches: "Trænere",
    admins: "Administratorer",

    planning: "Planlægning",
    planTeam: "Planlæg hold",

    placeholder:
      "Denne del af Membra er ikke bygget endnu. Den vises her, når den er klar.",
  },

  footer: {
    version: "Membra Core Web Version 4.8.2-prod",
    links: {
      privacy: "Databeskyttelse",
      terms: "Vilkår for digitale fællesskaber",
      audit: "Kryptografisk revision",
      support: "Support",
    },
  },

  auth: {
    subtitle: "Portal for fysiske fællesskaber og medlemsregister",
    divider: "eller",
    showPassword: "Vis adgangskode",
    hidePassword: "Skjul adgangskode",
    emailLabel: "E-mail",
    emailPlaceholder: "navn@faellesskab.dk",
    rememberMe: "Husk mig",

    login: {
      title: "Log på din konto",
      consent: "Membra deler aldrig data uden din accept",
      passwordLabel: "password",
      passwordPlaceholder: "••••••••••••",
      forgotPassword: "Glemt adgangskode?",
      submit: "Log på",
      toSignup: "Ikke medlem? Registrer dig",
    },

    signup: {
      title: "Opret ny bruger",
      consent: "Membra deler aldrig data uden din accept",
      passwordLabel: "Password",
      passwordPlaceholder: "Indtast en stærk adgangskode",
      confirmLabel: "Gentag Password",
      confirmPlaceholder: "Gentag password",
      submit: "Opret ny bruger",
      toLogin: "Har du allerede en konto? Log ind",
    },
  },

  onboarding: {
    skip: "Undlad for nu",

    profile: {
      title: "Klubber vil nok bede dig dele få personlige data",
      metaTitle: "Klubprofil",
      consent: "Membra deler aldrig data uden din accept",
      firstNameLabel: "Fornavn",
      firstNamePlaceholder: "f.eks. Frederik",
      lastNameLabel: "Efternavn",
      lastNamePlaceholder: "f.eks. Lindqvist",
      nicknameLabel: "Kaldenavn",
      nicknameHint: "(hvis brugt)",
      nicknamePlaceholder: "f.eks. Freddie",
      dateOfBirthLabel: "Fødselsdato",
      dateOfBirthPlaceholder: "DD / MM / ÅÅÅÅ",
      dateOfBirthPicker: "Åbn kalender",
      genderLabel: "Køn (til holdtræning)",
      genderPlaceholder: "Vælg køn",
      genderOptions: {
        male: "Mand",
        female: "Kvinde",
        others: "Andet",
      },
      languageLabel: "Foretrukkent sprog",
      languagePlaceholder: "Vælg sprog",
      languageOptions: {
        da: "Dansk",
        en: "Engelsk",
      },
      consentStorage:
        "Samtykke til at opbevare grundlæggende sportspasdata under Nordic Guilds privatlivsramme og fælles DIF-regler.",
      submit: "Gem",
    },

    photo: {
      title: "Tilføj dit medlemsbillede",
      metaTitle: "Medlemsbillede",
      consent:
        "Membra deler aldrig biometriske eller visuelle data uden dit udtrykkelige samtykke",
      description:
        "Et genkendeligt billede er en kæmpe hjælp til holdkammerater og trænere",
      formats: "JPG, PNG, HEIC, WebP eller AVIF · Maks. 8 MB",
      preview: "Dit medlemsbillede",
      change: "Skift billede",
      takePhoto: "Tag billede",
      findPhoto: "Find billede",
      uploading: "Gemmer dit billede…",
      retry: "Prøv igen",
      cropTitle: "Placer dit billede",
      cropDescription:
        "Træk for at flytte, og zoom indtil cirklen viser det, du vil have. Zoom ud for at beholde hele billedet.",
      zoom: "Zoom",
      zoomOut: "Zoom ud",
      zoomIn: "Zoom ind",
      rotateLeft: "Drej mod venstre",
      rotateRight: "Drej mod højre",
      cropReset: "Nulstil",
      preparing: "Forbereder…",
      cropCancel: "Annuller",
      cropConfirm: "Brug dette billede",
    },
  },

  account: {
    menuLabel: "Din konto",
    profile: "Profil",
    settings: "Indstillinger",
    logOut: "Log ud",
  },

  club: {
    metaTitle: "Klub",
    title: "Klubdetaljer",
    description:
      "Administrer klubparametre, forbundsadresser, faciliteter og rettigheder i bookinghierarkiet.",

    safeguard: {
      title: "Sikring af administratorberedskab",
      count: "Nuværende administratorer: {count}",
      body: "Husk – klubber med færre end {recommended} administratorer risikerer driftsstop under ferier eller udskiftning. Overvej at tilføje en administrator mere nu.",
      invite: "Inviter administrator nr. {recommended}",
      snooze: "Vis ikke denne besked de næste 30 dage",
      dismiss: "Luk denne besked",
    },

    activityPicker: {
      placeholder: "Vælg aktiviteter",
      search: "Søg i aktiviteter",
      noMatch: "Ingen aktiviteter matcher „{query}“.",
      more: "+{count}",
      truncated:
        "Viser de første {shown} af {total}. Skriv mere for at indsnævre.",
      selected:
        "{count, plural, =0 {Ingen valgt} one {# valgt} other {# valgt}}",
      clear: "Ryd",
    },

    setup: {
      intro: {
        title: "Opret din klub",
        body: "Tilføj klubbens navn, land og sprog samt de adresser, hvor den spiller. Medlemmer, hold og lokationer bygger alle oven på dette.",
        start: "Tilføj klub",
      },

      detailsTitle: "Klubdetaljer",
      detailsDescription:
        "Navnet, jeres medlemmer kender jer under, og hvor I holder til.",

      namePlaceholder: "f.eks. Nordisk Volleyballklub",
      shortPlaceholder: "f.eks. NVK",
      languagePlaceholder: "Vælg et sprog",
      noLanguage: "Intet",

      required: "påkrævet",
      requiredNote: "Påkrævede felter. Udfyld dem for at oprette din klub.",

      address: {
        title: "Klubbens adresser",
        intro:
          "Alle steder, klubben spiller. Den første er jeres primære adresse. Haller og baner knyttes til dem, så du skal bruge mindst én.",
        heading: "Adresse {number}",
        name: "Navn",
        namePlaceholder: "f.eks. Hovedhal",
        shortPlaceholder: "f.eks. HH",
        streetName: "Gade",
        streetNamePlaceholder: "f.eks. Lyngbyvej",
        streetNumber: "Husnr.",
        streetNumberShort: "Nr.",
        streetNumberPlaceholder: "f.eks. 1",
        zip: "Postnummer",
        zipPlaceholder: "f.eks. 2100",
        city: "By",
        cityPlaceholder: "f.eks. København",
        region: "Region (valgfrit)",
        regionPlaceholder: "f.eks. Region Hovedstaden",
        directions: "Vejvisning (valgfrit)",
        directionsPlaceholder: "f.eks. Banerne ligger bag sportshallen",
        add: "Tilføj endnu en adresse",
        remove: "Fjern adresse {number}",
      },

      create: "Opret klub",

      createdTitle: "Din klub er oprettet",
      createdBody:
        "Dine oplysninger og adresser er gemt. Du kan ændre dem fra kortene nedenfor.",
      dismiss: "Luk",
    },

    details: {
      title: "Klubdetaljer",
      description: "Organisatoriske stamdata, sprog og aktiv status",
      activeStatus: "Klubbens aktive status:",
      editAll: "Rediger alle klubdetaljer",
      editField: "Rediger {field}",
    },

    fields: {
      name: "Klubnavn",
      short: "Kort",
      established: "Klub oprettet",
      admins: "Administratorer",
      active: "Aktiv",
      inactive: "Inaktiv",
      recommended: "{recommended} anbefales",
      activity: "Klubaktiviteter",
      activityMore: "+{count} flere",
      activityLess: "Vis mindre",
      activitiesUnavailable: "Aktiviteterne kunne ikke indlæses",
      languagesUnavailable: "Sprogene kunne ikke indlæses",
      language: "Klubsprog",
      primary: "Primær",
      secondary: "Sekundær",
      datePlaceholder: "DD / MM / ÅÅÅÅ",
      datePicker: "Åbn kalender",
      country: "Land",
      avatar: "Klubbens logo",
      upload: "Upload",
      uploadFormats: "JPG, PNG, HEIC, WebP eller AVIF · Maks. 8 MB",
      replace: "Udskift",
      remove: "Fjern",
      avatarInvalid:
        "Vælg et JPG-, PNG-, HEIC-, WebP- eller AVIF-billede på højst 8 MB.",
      yes: "Ja",
      no: "Nej",
    },

    addresses: {
      title: "Klubbens fysiske adresser",
      description:
        "De steder klubben ligger, og den adresse den svarer på. Lokationer bookes mod disse.",
      collapse: "Skjul klubbens fysiske adresser",
      expand: "Vis klubbens fysiske adresser",
      editAll: "Rediger klubbens fysiske adresser",
      address: "Klubbens fysiske adresser",
      short: "Kort",
      directions: "Vejvisning",
      prime: "Prioritet",
      actions: "Handlinger",
      add: "Tilføj adresse",
      edit: "Rediger adresse",
      removeNew: "Fjern denne nye adresse",
      makePrimary: "Gør {address} til den primære adresse",
      primaryFixed:
        "En klub har altid én primær adresse. Slå en anden adresse til for at flytte den.",
      primaryOnly:
        "Det er klubbens eneste adresse, så den bliver ved med at være den primære.",
      none: "–",
    },

    editing: {
      section: "Sektionsredigering aktiv - alle klubparametre kan redigeres.",
      field: "Feltredigering aktiv.",
      incomplete: "Udfyld de påkrævede felter for at gemme.",
      cancel: "Annuller",
      save: "Gem",
    },

    contact: {
      title: "Telefonnumre, e-mailadresser",
      editAll: "Rediger kontaktoplysninger",
      phone: "Telefonnummer",
      phonePlaceholder: "f.eks. +45 12 34 56 78",
      phoneInvalid: "Telefonnummeret er for kort til at være et telefonnummer.",
      email: "Klubbens officielle e-mail",
      emailPlaceholder: "f.eks. info@nordiskvolleyball.dk",
      emailInvalid: "E-mailadressen mangler noget - tjek den efter.",
      website: "Hjemmeside",
      websitePlaceholder: "f.eks. nordiskvolleyball.dk",
      person: "Primær kontaktperson",
      personPlaceholder: "f.eks. Frederik Lindqvist",
      none: "–",
      empty: "Ingen kontaktoplysninger endnu.",
      emptyBody:
        "Tilføj et telefonnummer, en e-mail eller en hjemmeside, så medlemmerne kan få fat i klubben.",
      add: "Tilføj kontaktoplysninger",
      actions: "Handlinger",
      edit: "Rediger kontakt {number}",
      remove: "Fjern kontakt {number}",
      editing: "Redigering af kontaktoplysninger aktiv.",
    },

    locations: {
      title: "Lokationer (haller, baner)",
      editAll: "Rediger lokationer",
      filter: "Filtrer efter navn, kode…",
      editing:
        "Redigering af lokationer aktiv. Juster kontakter eller routing-lister.",
      unsaved: "Du har ugemte ændringer i Lokationer.",
      empty: "Ingen lokationer matcher filteret.",
      none: "–",

      columns: {
        name: "Lokationer",
        short: "Kort",
        show: "Vis",
        parentAddress: "Adresse",
        parentLocation: "Overordnet lokation",
        memberBooking: "Medl. book",
        teamMemberBooking: "H. medl. b.",
        memberBookingCount: "# medl. b.",
        public: "Offentlig",
        friends: "Venner",
        active: "Aktiv",
        directions: "Vejvisning",
      },

      kinds: {
        zone: "Zone",
        court: "Bane",
      },
    },
  },

  /** Hele anlægget på én gang: alle hubs, zoner og baner som én matrix. */
  location: {
    metaTitle: "Lokationer",
    title: "Oversigt over lokationer",
    description:
      "Hierarkisk matrix over baner og faciliteter, aktiv status, offentlig synlighed, kvoter og lokationsgrupper.",

    filter: "Filtrér efter navn, kode, gruppe…",
    summaryAll: "Alle {hubs} hubs er aktive ({courts} bookbare baner)",
    summarySome: "{active} af {hubs} hubs er aktive ({courts} bookbare baner)",
    expandAll: "Udvid alle",
    collapseAll: "Fold alle sammen",
    add: "Tilføj bane eller hub",
    empty: "Ingen lokationer matcher det filter.",
    none: "–",
    moreGroups: "+{count}",

    yes: "J",
    no: "N",

    fold: "Fold {name} sammen",
    unfold: "Udvid {name}",

    columns: {
      name: "Navn",
      short: "Kort",
      show: "Vist",
      memberBooking: "Medl. b.",
      memberBookingCount: "	# medl. b.",
      public: "Offentlig",
      site: "Sted",
      groups: "Lokationsgrupper",
      active: "Aktiv",
    },

    kinds: {
      hub: "Hub",
      zone: "Zone",
      court: "Bane",
    },

    surfaces: {
      indoor: "Inde",
      outdoor: "Ude",
    },

    form: {
      title: "Tilføj lokation",
      description:
        "En lokation er alt, der kan bookes, eller hvor begivenheder finder sted.",
      close: "Luk tilføj lokation",

      name: "Navn",
      namePlaceholder: "Lokationens navn",
      short: "Kort",
      shortPlaceholder: "Forkortelse",
      parentSite: "Overordnet sted",
      parentLocation: "Overordnet lokation",
      memberBookable: "Medl. kan booke",
      toBook: "# der kan bookes",
      public: "Offentlig",
      active: "Aktiv",
      inGroups: "I lokationsgrupper",

      none: "–",

      save: "Gem",
    },

    emptyState: {
      title: "Tilføj din første lokation",
      body: "Lokationer er de haller, zoner og baner, klubben booker. Start med en på øverste niveau, f.eks. en hal, og tilføj det, der ligger i den, bagefter.",
      add: "Tilføj lokation",
    },

    help: {
      title: "Hjælp",
      intro:
        "En lokation er ethvert sted eller emne, der kan bookes, eller hvor begivenheder finder sted. Før du opretter en lokation, er det vigtigt, at alle unikke adresser er tilføjet til klubbens data (se Admin/Klub).",
      naming:
        "Korte, beskrivende navne er bedst (f.eks. Klubhal), og forkortelsen bruges som tag (f.eks. Klub). Før du opretter lokationer, er det vigtigt at overveje det hierarki, de indgår i. F.eks. kan Klubhal være „øverste forælder“ med to „børn“, Hal 1 og Hal 2. Hal 1 kan så være forælder til Bane 1, Bane 2 og Bane 3. Navne behøver ikke indeholde forælderens navn, og de behøver ikke være unikke. Der kan f.eks. være flere „Bane 1“-lokationer, men hver med en forskellig forælder („Hal 1“ kan være forælder til én „Bane 1“, mens „Hal 2“ kan være forælder til en anden „Bane 1“).",
      tip1: "Tip 1: Opret klubbens adresser, før du opretter lokationer (Admin/Klub)",
      tip2: "Tip 2: Opret alle øverste forældre, før du opretter næste niveau af lokationer.",

      terms: {
        parentSite: "Overordnet sted",
        parentLocation: "Overordnet lokation",
        memberBookable: "Medlem kan booke",
        toBook: "# der skal booke",
        public: "Offentlig",
        active: "Aktiv",
        groups: "Lokationsgrupper",
      },

      defs: {
        parentSite:
          "Bruges kun, når lokationen har en unik adresse. F.eks. ville „Klubhal“ fra eksemplet ovenfor sandsynligvis have et overordnet sted med en adresse, mens „Hal 1“ ikke ville have et overordnet sted, men i stedet en overordnet lokation, nemlig „Klubhal“.",
        parentLocation:
          "„Forælderen“ til en „barne“-lokation, når der ikke gælder et overordnet sted.",
        memberBookable:
          "Bestemmer, om klubbens medlemmer kan booke lokationen og dermed reservere den til eget brug. En tennisbane vil sandsynligvis kunne bookes af medlemmer, mens en stor svømmehal måske ikke kan.",
        toBook:
          "Hvis en lokation kan bookes af medlemmer, skal det bestemmes, hvor mange medlemmer der kræves til en booking. I nogle tilfælde kan ethvert medlem booke en lokation (f.eks. en double-padelbane) alene - i andre tilfælde kan klubben bestemme, at et medlem skal booke sammen med 3 andre, og så skal „# der skal booke“ være 4.",
        public:
          "Bestemmer, om udefrakommende kan booke lokationen (f.eks. en tennisbane, som alle kan booke online).",
        active: "Er denne lokation i aktiv brug?",
        groups:
          "Kan være nødvendigt for at tildele en gruppe af lokationer til et hold. F.eks. hvis et hold spiller på bane 1 og 2 ud af 5 baner i en hal, er en gruppe „C1-2“ nødvendig. Lokationsgrupper administreres i Admin/Lokationsgrupper og vises kun her til orientering.",
      },
    },
  },

  home: {
    metaTitle: "Forside",
    greeting: "Hej, {name}",
    description:
      "Du er logget ind på Membra. Din klubs begivenheder og medlemmer vises her.",
  },

  profile: {
    metaTitle: "Profil",
    title: "Din profil",
    description: "Hold de oplysninger, din klub ser, opdaterede.",
    saved: "Profilen er opdateret",
    photoSaved: "Billedet er opdateret",
  },

  settings: {
    metaTitle: "Indstillinger",
    title: "Indstillinger",
    description: "Administrer, hvordan du bruger din Membra-konto.",
    sessions: {
      title: "Aktive sessioner",
      description:
        "Her er du logget ind lige nu. Afslut enhver session, du ikke genkender.",
      thisDevice: "Denne enhed",
      otherDevice: "Aktiv session",
      current: "Nuværende",
      startedAt: "Startet {when}",
      expiresAt: "udløber {when}",
      revoke: "Log ud",
      unavailable: "Dine sessioner kunne ikke indlæses. Prøv igen om lidt.",
    },
  },

  errors: {
    emailTaken: "Der findes allerede en konto med denne e-mail",
    invalidCredentials: "Forkert e-mail eller adgangskode",
    network:
      "Kunne ikke få forbindelse til Membra. Tjek din forbindelse, og prøv igen.",
    photoRejected: "Billedet kunne ikke gemmes. Prøv et andet.",
    rateLimited: "For mange forsøg. Vent et øjeblik, og prøv igen.",
    clubRejected: "Klubben kunne ikke oprettes: {reason}",
    clubConflict:
      "Der findes allerede en klub med det navn eller den forkortelse.",
    saveRejected: "Det kunne ikke gemmes: {reason}",
    forbidden: "Du har ikke tilladelse til at ændre denne klub.",
    logoFailed:
      "Oplysningerne blev gemt, men logoet kunne ikke uploades. Prøv et andet billede.",
    unexpected: "Noget gik galt. Prøv igen.",
  },

  errorPage: {
    title: "Noget gik galt",
    description:
      "Denne side kunne ikke indlæses. Det hjælper som regel at prøve igen; ellers så vend tilbage om lidt.",
    retry: "Prøv igen",
    backToLogin: "Tilbage til log ind",
    reference: "Reference",
  },

  notFound: {
    title: "Siden blev ikke fundet",
    description: "Denne side findes ikke, eller også er den flyttet.",
    backToLogin: "Tilbage til log ind",
  },

  validation: {
    emailRequired: "E-mailadresse er påkrævet",
    emailInvalid: "Indtast en gyldig e-mailadresse",
    emailTooLong: "Brug højst 254 tegn",
    emailDisposable: "Brug en permanent e-mailadresse, ikke en midlertidig",
    passwordRequired: "Adgangskode er påkrævet",
    passwordTooShort: "Brug mindst 8 tegn",
    passwordTooLong: "Brug højst 128 tegn",
    passwordNeedsLowercase: "Inkluder et lille bogstav",
    passwordNeedsUppercase: "Inkluder et stort bogstav",
    passwordNeedsNumber: "Inkluder et tal",
    confirmRequired: "Gentag din adgangskode",
    passwordsDoNotMatch: "Adgangskoderne stemmer ikke overens",
    firstNameRequired: "Fornavn er påkrævet",
    lastNameRequired: "Efternavn er påkrævet",
    nicknameRequired: "Kaldenavn er påkrævet",
    nameTooLong: "Brug højst 60 tegn",
    dateOfBirthRequired: "Fødselsdato er påkrævet",
    dateOfBirthInvalid: "Indtast en gyldig dato som DD / MM / ÅÅÅÅ",
    dateOfBirthFuture: "Fødselsdatoen kan ikke ligge i fremtiden",
    genderRequired: "Vælg et køn",
    languageRequired: "Vælg et foretrukket sprog",
    consentStorageRequired: "Der kræves samtykke for at gemme din klubprofil",
    photoTooLarge: "Vælg et billede på højst 8 MB",
    photoUnsupportedType: "Vælg et JPG-, PNG-, HEIC-, WebP- eller AVIF-billede",
  },
};
