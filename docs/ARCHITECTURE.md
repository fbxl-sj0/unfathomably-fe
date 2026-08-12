<!--
  Project: Unfathomably FE
  File: docs/ARCHITECTURE.md
  Purpose: Explain the frontend architecture and its boundary with the backend.
  This file does not define backend federation, trust, or moderation policy.
-->

# Unfathomably FE architecture

Unfathomably FE is a static browser application. It presents data supplied by
a Mastodon-compatible backend, with the fullest feature set available when it
is paired with Unfathomably BE. The frontend does not implement ActivityPub or
make independent federation decisions.

## System boundary

```text
Browser
  |
  +-- React routes, components, local preferences, and PWA service worker
  |
  +-- HTTP API and WebSocket streams
          |
          v
Unfathomably BE or another compatible backend
  |
  +-- authentication, policy, moderation, search, media, and persistence
  |
  +-- ActivityPub and optional protocol bridges
          |
          v
Remote Fediverse services
```

The frontend may validate and decline to render malformed data, but the
backend remains authoritative for identity, permissions, object ownership,
federation trust, and whether an action is allowed.

| Frontend responsibility | Backend responsibility |
| --- | --- |
| Routes, layouts, forms, themes, and accessibility | Accounts, sessions, permissions, and policy |
| Capability-aware presentation | Capability and compatibility metadata |
| Defensive response parsing | Canonical records and API responses |
| Local browser preferences and drafts | Durable user and site data |
| Initial HTTP loading and live-update integration | Timelines, search, federation, and streaming endpoints |
| Static assets and service-worker behavior | Dynamic instance metadata and installed-app identity |

## Startup sequence

The application starts in a deliberately small set of stages:

1. `src/main.tsx` loads compatibility polyfills only when the browser needs
   them.
2. `src/boot.tsx` loads styles, prepares the service worker in production, and
   mounts React.
3. `src/init/soapbox.tsx` creates the Redux, React Query, statistics, Nostr,
   and document-head providers.
4. `src/init/soapbox-load.tsx` loads instance metadata, the signed-in account,
   frontend configuration, and the selected locale. Account verification and
   instance discovery run concurrently where their dependencies allow it.
5. `src/init/soapbox-mount.tsx` establishes the browser router, global error
   boundary, modal container, and notification toaster.
6. `src/features/ui/index.tsx` selects the page shell and lazy feature for the
   active route.

Optional Nostr signer and relay support is loaded after the ordinary
ActivityPub interface is ready. A failed optional protocol connection must not
hold the main application on its loading screen.

## Product surfaces

The inherited Soapbox interface is organized around accounts and statuses.
Unfathomably retains those primitives, then adds three user-facing collections
for actors and objects that do not fit an ordinary profile timeline.

| Surface | Intended content |
| --- | --- |
| Groups | Communities, forums, group actors, and their root discussions |
| Feeds | Blogs, RSS or Atom sources, channels, libraries, podcasts, and other source-like actors |
| Worlds | Books, audio, video, events, photos, software, models, markets, games, routes, culture, coordination, and publishing |

Worlds data is classified in `src/features/federation/platform.ts`. A family
selects a presentation style and primary action, but it does not replace the
normal status lifecycle. Replies, reactions, sharing, filtering, moderation,
and local navigation continue to use the standard account and status paths.

The main Worlds route lives in `src/features/native-federation/`. Discovery
hooks live in `src/api/hooks/discovery/`. Shared native context belongs in
`src/components/` when it is also used by normal timelines or profile pages.

## API and data flow

`src/api/MastodonClient.ts` is the low-level HTTP client. It accepts relative
and absolute URLs, but only sends OAuth credentials to the configured backend
origin. Callers must not work around this origin boundary for remote media,
embeds, object storage, or discovery services.

New API data should normally pass through a schema in `src/schemas/` before it
reaches the interface. Normalizers adapt accepted compatibility shapes into
the stable entities consumed by older components. Schemas should:

- accept documented compatibility variants that the UI can handle safely;
- discard malformed optional extensions without losing an otherwise usable
  account or status;
- fail closed for URLs, permissions, or action metadata that would enable an
  unsafe or unsupported interaction;
- keep backend-owned authorization and trust decisions out of the browser.

The application currently has three related state paths:

- Redux owns inherited global application state, timelines, composition,
  notifications, and route-spanning UI state.
- The entity store provides normalized access to newer shared API entities.
- React Query owns request-oriented server state and mutations for newer
  workflows.

Some lazy routes inject their Redux reducers from `src/store.ts`. This keeps
route-only actions and state models out of the startup graph. New work should
extend an existing state owner when one already exists instead of mirroring the
same server record into another cache.

## Feature detection

`src/utils/features.ts` converts instance metadata and backend versions into
frontend capabilities. Routes and controls should check those capabilities
before promising an action.

Feature detection has two goals:

- expose richer behavior when the backend declares support;
- degrade to a useful read-only or generic presentation when it does not.

Backend product names alone are not permission checks. A control that changes
state must still respect the account's permissions, OAuth scope, object
metadata, and the backend response.

## Streaming

HTTP establishes the initial state. WebSocket or event-stream messages keep
that state current.

`src/stream.ts` owns connection lifecycle and recovery. The hooks under
`src/api/hooks/streaming/` bind a route or timeline to the correct stream.
`src/actions/streaming.ts` applies shared events to Redux, the entity store, or
React Query as appropriate.

Route-level filters are part of the data contract. A live status must pass the
same family, group, source, account, and discussion-root rules as the matching
HTTP response. Reconnection must not create overlapping subscriptions or turn
a silent stream into duplicate timeline entries.

## Routing and compatibility

The codebase uses React Router 7 through
`src/compat/react-router-dom.tsx`. The compatibility module supplies the older
`Switch`, `Redirect`, `useHistory`, and route-prop interfaces still used by the
Soapbox code. This is intentional migration infrastructure.

Similarly, names such as `Soapbox`, `soapbox.json`, `/soapbox/config`, and
`useSoapboxConfig` are stable compatibility identifiers. Public branding
should say Unfathomably FE or use the operator's configured site identity, but
internal names should not be changed without checking backend paths, stored
settings, and existing deployments.

## Branding and build configuration

`src/instance/soapbox.json` supplies the checked-in default site appearance.
Operators normally override it through backend-managed configuration or the
deployed `/instance/soapbox.json` file.

The `custom/` directory supports build-specific additions without changing
the default instance files:

- `custom/app.json` can override OAuth application metadata;
- `custom/features.json` can override detected feature flags;
- `custom/locales/<locale>.json` can override messages;
- `custom/instance/` is copied over the built instance asset directory;
- `custom/snippets.html` can add operator-controlled head markup.

`BACKEND_URL` selects a different API origin at build time. Leave it unset for
the normal same-origin deployment. `SENTRY_DSN` enables error reporting when a
deployment has deliberately configured Sentry.

The backend supplies `/manifest.json` so the installed PWA uses the site's
name and identity rather than the frontend project's default brand.

## Security assumptions

Treat all federated text, links, metadata, and media locations as untrusted
input, even when they arrived through a local backend.

- Keep credential attachment inside the shared API client.
- Use the shared browser-link and URL helpers for remote or configured links.
- Preserve sandbox and referrer restrictions on rich-preview iframes.
- Do not infer ownership or authorization from visible actor names or URLs.
- Do not contact arbitrary remote discovery services directly from a passive
  page load.
- Keep local resolution and remote-source navigation visibly distinct.

## Where changes belong

| Change | Primary location |
| --- | --- |
| API response contract | `src/schemas/`, then `src/normalizers/` if an inherited entity needs adaptation |
| Reusable API operation | `src/api/hooks/` or an established action module |
| Shared visual behavior | `src/components/` |
| Route-owned interface | `src/features/` |
| Page shell and side panels | `src/pages/` |
| Cross-route browser state | `src/reducers/` and `src/actions/` |
| Server-state request or mutation | `src/queries/` or the relevant API hook |
| Backend capability | `src/utils/features.ts` |
| Live-update subscription | `src/api/hooks/streaming/` |
| Operator defaults | `src/instance/` or `custom/` |

See [`DEVELOPMENT.md`](DEVELOPMENT.md) for the working commands and change
checklists.

<!-- end of docs/ARCHITECTURE.md -->
