# Membra - Web Front End

The members' portal: sign-up, onboarding, profile and account settings for a
physical community. It holds no data of its own - every read and write goes to
the Membra API (`Membra-Backend`) over a session cookie.

## Stack

- **Next.js 16** (App Router, Turbopack) with **React 19**
- **TypeScript** in `strict` mode
- **Tailwind CSS v4** with [shadcn](https://ui.shadcn.com) components over Radix
- **next-intl** for routing and copy in English and Danish
- **Zod** for every form schema and every API boundary

## Getting started

Requires Node 20 or newer and a running Membra API.

```bash
npm install
```

Create `.env.local` (see [Environment](#environment)):

```bash
API_BASE_URL=http://localhost:3000/api
```

Then:

```bash
npm run dev
```

Open **[http://localhost:3001](http://localhost:3001)**.

The dev server runs on **3001** on purpose: the API owns 3000, so the two run
side by side without a port clash.

## Environment

Read and validated once at boot in `src/config/env.ts`. A missing or malformed
value throws immediately, naming the variable, rather than failing hours later
as an unexplained fetch error.

| Variable | Required | Default | Meaning |
| --- | --- | --- | --- |
| `API_BASE_URL` | yes | - | Where the API lives. Include the `/api` prefix, no trailing slash. |
| `API_TIMEOUT_MS` | no | `10000` | How long one upstream call gets before we give up on it. |

Nothing here carries a `NEXT_PUBLIC_` prefix, and it must stay that way - the
API's address is server-only so it never reaches the browser bundle.

## Project structure

```
src/
  app/[locale]/        Routes. Every page is locale-prefixed.
  features/            One folder per domain: auth, onboarding, profile.
    api/               *-wire.ts (zod schemas + mappers), *-endpoints.ts (calls)
    services/          Server Actions, and server-only reads
    components/        UI belonging to that feature
    schemas/           Form schemas, with their messages
  components/
    ui/                shadcn primitives
    layout/            App shell, header, footer
    icons/             The icon registry - the only place a glyph is chosen
  config/              locales, env, fonts, colours
  lib/http/            The single way to call the API
  styles/              palette.css (primitives) and theme.css (semantic tokens)
  translations/        en.ts, da.ts
```

## Conventions

**One way to call the API.** `src/lib/http/api.ts` owns the base URL, timeout,
caching, JSON handling, and turns a failure into a typed `ApiError` or
`NetworkError`. A feature's `api/` folder reads as a list of endpoints rather
than the same plumbing repeated.

**Wire format stops at the boundary.** `*-wire.ts` parses what the API sends and
maps it into the app's own shape, so a field the API renames is one file's
problem.

**Server Actions live in `services/`.** A `"use server"` directive publishes
every export as an endpoint the browser can call, so anything that isn't a form
submission - a lookup a page makes while rendering - uses `server-only` instead.

**Auth guards go on pages, never layouts.** Layouts don't re-render between
navigations, so a check there quietly stops running. Every authenticated page
calls `requireSession(locale)` itself.

**Validate twice.** Forms validate in the browser for the member's sake, and
every Server Action re-validates on arrival, because anything reaching an action
came over the network whatever the UI did on the way.

## Internationalisation

`src/translations/en.ts` is the source of truth. `Dictionary` is inferred from
it, so adding a key there makes TypeScript demand a Danish translation in
`da.ts` - a missing one is a build error, not a blank space in the UI.

Locales live in `src/config/locales.ts`, English first and default. Adding one
means adding its dictionary *and* a `profile.languageOptions.<code>` entry.

## Colours and theming

Every colour is declared in two files - no hex literals in components.

- `src/styles/palette.css` - **primitives**: the named brand colours
  (`--color-brand-blue-1`, …). Constant across themes; never used directly.
- `src/styles/theme.css` - **semantic tokens**: what a colour is *for*
  (`--color-surface`, `--color-ink-muted`, `--color-line`), stated once per
  theme. Components only ever use these, as Tailwind utilities (`bg-surface`,
  `text-subtle`, `shadow-card`).

To add a colour: raw value in `palette.css`, semantic name in `theme.css`, and a
value in **both** the light and `.dark` blocks.

Dark mode is wired but not switched on: the `.dark` block restates the same
token names, so adding a `dark` class to `<html>` flips the whole UI without
touching a component. The switcher itself is still to come.

`src/app/globals.css` also aliases shadcn's token names (`--primary`, `--border`, …)
onto ours, so a shadcn component and a hand-written one can't drift apart.

## Typography

`src/config/fonts.ts` is the only place a typeface is chosen. It loads Inter and
exports the fallback stacks for the two screens that render without a stylesheet
(`not-found.tsx` and `global-error.tsx`). Everything else reaches it through the
`font-sans` utility - no component names a font.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3001 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

There is no `test` or `typecheck` script yet; run `npx tsc --noEmit` directly
(after a build or `npm run dev` has run at least once, so Next's generated
`PageProps`/`LayoutProps` globals under `.next/types` exist - `npm run build`
already type-checks on its own, which is what CI relies on).

## Deploy (Scaleway test via GitHub Actions)

You create Scaleway resources in the console. GitHub Actions does not
provision them. Pushing to `test` runs
[`.github/workflows/deploy-test.yml`](.github/workflows/deploy-test.yml):
lint/build (build type-checks), push a Docker image, update the Serverless
Container, then `GET /api/health`.

Pull requests and any other branch run
[`.github/workflows/ci.yml`](.github/workflows/ci.yml) only.

This app holds no data of its own, so unlike `Membra-Backend` there is no
`DATABASE_URL`, no migration step, and no seed step - it's a stateless
Next.js server that talks to the API over HTTPS with a forwarded session
cookie.

### GitHub Environment `test` secrets

- `SCW_ACCESS_KEY` / `SCW_SECRET_KEY` - the **container/registry** key, not
  Object Storage or a database credential. Can reuse the same container-scope
  IAM key pair as `Membra-Backend`'s `test` Environment.
- `SCW_DEFAULT_ORGANIZATION_ID`
- `SCW_DEFAULT_PROJECT_ID`
- `SCW_DEFAULT_REGION` (`nl-ams`)
- `CONTAINER_REGISTRY_ENDPOINT` (e.g. `rg.nl-ams.scw.cloud/membra-test`) - the
  same registry namespace as the backend can hold both `membra-backend` and
  `membra-frontend` images.
- `SCW_CONTAINER_ID` - a **separate** Serverless Container from the backend's.
- `CONTAINER_HEALTH_URL` (e.g. `https://<host>/api/health`)

Create the Environment under the repo **Settings → Environments → test**.

### Scaleway console (test, region `nl-ams`)

- Private Container Registry namespace (reuse the backend's, or create one).
- Serverless Containers namespace and public container (port **8080**, HTTP
  probe `/api/health`). A stateless SSR server needs less memory than the
  backend's API + DB connection pool; start around 512 MB and adjust from
  observed usage.

Runtime env on the **container** (regular env vars are fine here - none of
this app's config is a secret the way the backend's `DATABASE_URL` or SMTP
password are):

- `API_BASE_URL` - the deployed backend's public origin, including the `/api`
  prefix (e.g. `https://<backend-host>/api`).
- `API_TIMEOUT_MS` (optional, defaults to `10000`).
- `AVATAR_IMAGE_HOST` (optional) - only needed if the avatar bucket's origin
  differs from the built-in default.
- `NODE_ENV=production` and `PORT` are already set by the Docker image /
  injected by Scaleway.

## Not yet in place

Worth knowing before you rely on any of it:

- **No tests.** No runner is installed. CI (see [Deploy](#deploy-scaleway-test-via-github-actions))
  runs lint and a build (which type-checks) on every push and pull request,
  but nothing exercises behaviour.
- **Forgot-password is stubbed** in the UI - the link in `login-form.tsx` is
  commented out. The API supports it.
- **Footer links point at `#`.** The routes don't exist yet.
- **`src/config/colors.ts`** exposes the palette to TypeScript for colours that
  have to be picked in code (chart series, avatar tints). Nothing consumes it
  today.
