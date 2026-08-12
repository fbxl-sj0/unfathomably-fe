<!--
  Project: Unfathomably FE
  File: docs/DEVELOPMENT.md
  Purpose: Give maintainers a repeatable local development and verification workflow.
  This file does not cover production backend installation or federation policy.
-->

# Developing Unfathomably FE

This guide covers work on the frontend repository. Read
[`ARCHITECTURE.md`](ARCHITECTURE.md) before changing API boundaries, state
ownership, streaming, routing compatibility, or native federation behavior.

## Prerequisites

- Node.js 26.3.1 or newer. `.tool-versions` pins the version used by this
  repository.
- Corepack with the repository's Yarn 4 release.
- A compatible backend for pages that require real accounts, timelines, or
  federation data.

Install dependencies and start Vite:

```sh
corepack yarn install --immutable
corepack yarn start
```

The development server listens on port 3036 unless `PORT` is set.

## Choosing a backend

The normal production deployment serves the frontend and backend from the same
origin. For local frontend work, set `BACKEND_URL` before starting Vite when
the API is hosted elsewhere:

```sh
BACKEND_URL=https://social.example corepack yarn start
```

The backend must permit the development origin. Vite intentionally returns 404
for local `/api/`, `/oauth/`, `/nodeinfo/`, and `/.well-known/` requests; it
does not pretend to be a backend or silently proxy authentication traffic.

Do not point routine tests at a production service. Unit and component tests
use the fixtures and request mocks under `src/__fixtures__/` and `src/jest/`.

## Verification commands

| Command | Purpose |
| --- | --- |
| `npm run lint` | Run JavaScript, TypeScript, React, accessibility, and stylesheet linting |
| `npm run i18n:check` | Validate message identifiers and locale structure |
| `npm run check` | Run TypeScript without emitting files |
| `npm run test:run` | Run the complete Vitest suite once |
| `npm run test:federation` | Run the focused group, feed, schema, platform, and media compatibility tests |
| `npm run build` | Produce the static application in `dist/` |
| `npm run strict` | Run the release gate: lint, i18n, types, tests, and production build |

Use `npm run strict` before a release or after a cross-cutting change. During
development, run the smallest relevant test first, then expand verification in
proportion to the change.

For example:

```sh
corepack yarn vitest run src/features/federation/platform.test.ts
npm run test:federation
npm run strict
```

The production build treats unexpected bundler warnings as errors. Do not add
broad warning suppressions. A dependency warning may be ignored only when its
exact source and harmless behavior are understood and documented in
`vite.config.ts`.

## Repository map

| Path | Responsibility |
| --- | --- |
| `src/main.tsx`, `src/boot.tsx` | Browser compatibility and application entry |
| `src/init/` | Providers, initial loading, head metadata, and top-level mounting |
| `src/api/` | HTTP client and reusable request hooks |
| `src/actions/`, `src/reducers/` | Inherited Redux workflows and cross-route state |
| `src/entity-store/` | Normalized shared entities |
| `src/queries/` | React Query clients, keys, mutations, and cache helpers |
| `src/schemas/`, `src/normalizers/` | Runtime validation and compatibility normalization |
| `src/components/` | Reusable visual and behavioral components |
| `src/features/` | Route-owned product features |
| `src/pages/` | Page shells and surrounding navigation panels |
| `src/api/hooks/streaming/` | Route and timeline live-update subscriptions |
| `src/service-worker/` | PWA caching and push behavior |
| `src/locales/` | Compiled locale messages and translation whitelists |
| `src/instance/` | Default site configuration and example policy pages |
| `custom/` | Deployment-specific build overrides |
| `build/`, `scripts/` | Build plugins and maintainer audit utilities |
| `installation/` | Example Nginx deployment configurations |

Imports under `@/` resolve to `src/`. Imports from `react-router-dom` resolve
through the compatibility module in `src/compat/`; do not bypass it with the
aliased package unless the compatibility layer itself is being maintained.

## Adding or changing an API-backed feature

Follow the data from the backend contract to the screen:

1. Confirm which backend and capability metadata provide the behavior.
2. Add or update the schema for every response shape the frontend accepts.
3. Put request and mutation behavior in the established hook, query, or action
   layer for that feature.
4. Reuse the existing entity or cache owner instead of copying the same record
   into another state system.
5. Add the component and route behavior, including loading, empty, error,
   signed-out, unsupported, and permission-denied states.
6. Add streaming only after the HTTP path works. Apply the same filters to
   both paths.
7. Add localized messages and focused schema, hook, reducer, or component
   tests.
8. Update the relevant user, operator, federation, or architecture
   documentation when the contract changes.

API controls must remain hidden or disabled when the backend lacks the
capability. A product-name check is not a substitute for permissions, OAuth
scope, or object-level action metadata.

## Extending Worlds

Worlds features should begin with a real user workflow, not with a raw
ActivityStreams type or a remote service logo.

Before adding a family or presentation:

1. Record the source application's entry, viewing, and participation workflow
   in `docs/NATIVE_FEDERATION_UX_AUDIT.md`.
2. Add classification fixtures and render hints in
   `src/features/federation/platform.ts`.
3. Add bounded schemas for the optional native metadata.
4. Prefer normal accounts, statuses, media, discussions, and local resolution
   where they already describe the object correctly.
5. Put specialized discovery in `src/api/hooks/discovery/` and its route-owned
   interface in `src/features/native-federation/`.
6. Make remote catalogue or directory access deliberate. Passive page loads
   should prefer locally known data supplied by the backend.
7. Add federation tests and verify generic fallback behavior on backends that
   do not expose the extension.

Communities and events already have actor, moderation, membership,
participation, and privacy workflows. Reuse those dedicated creators instead
of approximating them with the generic native-object composer.

## State and mutation rules

- Use Redux when extending a workflow that is already Redux-owned or when the
  state must coordinate several inherited routes.
- Use the entity store for normalized records shared across newer features.
- Use React Query for request-oriented server state and mutations.
- Keep temporary form state inside the owning component unless it must survive
  navigation or reload.
- Serialize optimistic changes that can overlap. Preserve enough previous
  state for exact rollback, then reconcile with the server response.
- Do not invalidate and immediately refetch merely to hide an incomplete
  optimistic update.

## Tests and fixtures

Place tests beside the behavior they protect using `*.test.ts` or
`*.test.tsx`. Prefer a small contract fixture over a complete copied server
response.

Important compatibility behavior should normally cover:

- the canonical Unfathomably BE response;
- an older or generic Mastodon-compatible response;
- malformed optional extension data;
- absent capabilities or permissions;
- loading, empty, and failed requests;
- live updates when the HTTP view also subscribes to a stream.

[`FEDERATION_TESTING.md`](../FEDERATION_TESTING.md) describes the focused
federation lanes and their purpose.

## Internationalization and accessibility

User-facing text belongs in FormatJS messages with a clear English
`defaultMessage`. Run `npm run i18n:check` after changing messages. Run
`npm run i18n` only when intentionally regenerating the English catalog, and
review the generated diff.

When changing interaction behavior, verify:

- keyboard access and a visible focus state;
- programmatic labels for inputs and icon-only buttons;
- menu, dialog, tab, and live-region semantics;
- right-to-left layout behavior;
- reduced-motion behavior where animation is involved;
- content-warning and sensitive-media concealment before media loads.

## Live route audits

`npm run audit:pages` launches a locally installed Chromium browser and visits
a deployed site through the DevTools protocol. It is a read-only diagnostic,
but it contacts a real service and defaults to `https://social.fbxl.net`.

Set `UNFATHOMABLY_AUDIT_URL` explicitly before running it. An optional
`UNFATHOMABLY_AUDIT_TOKEN` enables authenticated routes. Never place the token
in source files, command history intended for sharing, logs, or issue reports.
The script redacts the configured token from captured output.

## Before handing off a change

- Review `git diff` for unrelated generated files or release archives.
- Confirm new API data is schema-validated.
- Confirm external URLs use shared safe-link behavior.
- Confirm feature and permission checks match the backend contract.
- Run focused tests and the appropriate broader checks.
- Update `CHANGELOG.md` for a user-visible release change.
- Update the architecture or federation audit when a boundary changes.

Build output, local dependency directories, audit artifacts, and release
archives are ignored by Git and should not be committed.

<!-- end of docs/DEVELOPMENT.md -->
