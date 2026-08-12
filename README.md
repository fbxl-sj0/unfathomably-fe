<!--
  Project: Unfathomably FE
  File: README.md
  Purpose: Introduce the frontend, its product model, system boundaries, and
           the supported paths for development and deployment.
  This file does not document backend installation, ActivityPub internals, or
  the complete release history.
-->

![Unfathomably galaxy logo](src/assets/images/unfathomably-logo.svg)

# Unfathomably FE

> Your corner of the Fediverse is the whole thing

Unfathomably FE is the browser application for the Unfathomably social
platform. It presents familiar profiles, timelines, conversations, and
moderation tools, but it is built for a Fediverse that contains much more than
microblogging.

Communities, forums, blogs, podcasts, video channels, events, books, cultural
catalogues, software projects, marketplaces, routes, games, and coordination
records can retain their own useful shape instead of being flattened into fake
user profiles or generic posts. The frontend uses ordinary social controls
where they remain truthful and provides specialized discovery or presentation
where the underlying object needs it.

The project began as a Soapbox fork. It now serves as the frontend half of a
larger system whose reference backend is
[`unfathomably-be`](https://github.com/fbxl-sj0/unfathomably-be), a descendant
of Rebased and Pleroma. Soapbox remains visible in parts of the internal
architecture, but it no longer describes the project's product boundary.

## What the project provides

Unfathomably keeps the normal Mastodon-style social experience and adds three
first-class ways to navigate the wider network.

| Surface | What belongs there |
| --- | --- |
| Social | Accounts, timelines, posts, threads, media, polls, reactions, quotes, chats, notifications, lists, search, filters, and translation |
| Groups | Local and remote communities, followed-group timelines, tags, media, membership, recommendations, and authorized moderation |
| Feeds | Blogs, RSS or Atom subscriptions, channels, libraries, podcasts, and other source-like actors, with a combined followed-source timeline |
| Worlds | Native discovery and presentation for books, culture, audio, video, events, photos, software, 3D models, games, markets, bookmarks, publishing, routes, and coordination |

These are not separate clients joined by a menu. A remote object that can be
represented as a normal account, status, discussion, or attachment continues
through the normal lifecycle for replies, reactions, sharing, filtering,
moderation, and live updates. Specialized cards add the context that an
ordinary microblog post cannot express.

### Native federation without background crawling

Worlds is local-first and deliberate by design. Passive browsing uses records
already known to the backend. Remote actor resolution, connected catalogues,
and reviewed public directories are contacted only through an explicit user
action when the corresponding backend capability is available.

This distinction matters in the interface:

- a locally known object can open through a local route;
- a canonical source link remains visibly external;
- a reviewed directory is identified as a directory, not as a federated peer;
- resolving an actor or object does not silently follow it;
- source-only records do not receive interaction buttons the backend cannot
  support.

The current family model covers software and object shapes encountered across
the Threadiverse and services such as PeerTube, Funkwhale, Mobilizon, Gancio,
BookWyrm, NeoDB, Pixelfed, WriteFreely, WordPress, ForgeFed implementations,
Manyfold, Flohmarkt, Wanderer, Castling, Owncast, and ValueFlows-oriented
systems. Unknown or incomplete records retain a bounded generic fallback.

### Daily-use and operator workflows

The wider federation model is supported by normal application machinery, not
only by discovery cards:

- HTTP timelines and WebSocket updates share group, source, family, account,
  and discussion-root filters;
- visible-tab reconnects and silent-stream recovery restore live updates
  without accumulating duplicate subscriptions;
- audio and video can move into a persistent docked player during navigation;
- composer drafts survive accidental interruption and are cleared after a
  confirmed send or deliberate discard;
- account migration, archive import, data export, backups, multi-factor
  authentication, and token management have dedicated workflows when exposed
  by the backend;
- administrators can inspect federation health, manage communities and
  discovery providers, moderate users and reports, configure branding, and
  perform supported cleanup operations;
- internationalized, right-to-left, keyboard, focus, reduced-motion, live
  region, and sensitive-media behavior are treated as application contracts.

Optional Nostr, AT Protocol, diaspora*, and other bridge-related identity or
account surfaces appear only when the connected backend advertises the
required support. Their presence in the interface does not mean the browser is
independently federating on behalf of the server.

## How the system is divided

Unfathomably FE is a static React application. It communicates with its
backend over HTTP APIs and live streams. It does not implement ActivityPub or
make federation trust decisions in the browser.

```text
Browser
  |
  +-- Unfathomably FE
  |     routes, presentation, local preferences, drafts, PWA and push UI
  |
  +-- authenticated HTTP API and WebSocket streams
          |
          v
Unfathomably BE or another compatible backend
  |     accounts, permissions, policy, search, media and persistence
  |
  +-- ActivityPub and optional protocol bridges
          |
          v
Remote services
```

The frontend may reject malformed data or decline to render an unsafe action,
but the backend remains authoritative for identity, object ownership,
visibility, permissions, moderation policy, signature verification, remote
fetching, and delivery.

The main frontend data paths are:

- Redux for inherited application workflows, timelines, composition,
  notifications, and route-spanning state;
- a normalized entity store for newer shared records;
- React Query for request-oriented server state and mutations;
- Zod schemas and normalizers at API compatibility boundaries;
- feature detection derived from instance metadata and backend capabilities.

Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) before changing API
boundaries, state ownership, streaming, routing compatibility, or native
federation behavior.

## Compatibility

The complete feature set is developed against Unfathomably BE. Compatibility
with another backend depends on the endpoints, response shapes, streaming
channels, and capability metadata that backend supplies.

| Backend | Expected frontend behavior |
| --- | --- |
| Unfathomably BE | Reference backend and complete product contract |
| Rebased, Pleroma, and Akkoma families | Core social interface plus the extensions each server actually advertises |
| Other Mastodon-compatible servers | Many core account, timeline, posting, and settings paths can work, but complete compatibility is not assumed without testing |

ActivityPub compatibility with remote software belongs to the backend. A
Worlds presentation means the frontend understands data supplied by its local
backend; it is not a claim that every server can fetch, authorize, transform,
or deliver every operation for that remote platform.

Unsupported features should disappear or degrade to an honest read-only or
generic presentation. Backend product names alone are never treated as
permission checks.

Some internal identifiers intentionally retain the `soapbox` name, including
`soapbox.json`, `/soapbox/config`, and `useSoapboxConfig`. Existing deployments
and backend APIs depend on these names. Public branding, metadata, repository
links, and documentation should use Unfathomably FE or the operator's
configured site identity.

## Browser security boundary

All federated text, URLs, metadata, embeds, and media locations are treated as
untrusted input even though they arrive through the local backend.

The shared frontend boundary includes:

- attaching OAuth and service-worker credentials only to the configured
  backend origin;
- resolving remote and configured links through shared URL checks that reject
  malformed, credential-bearing, and non-HTTP destinations;
- preserving proxy boundaries instead of silently falling back to direct
  cross-origin media requests;
- sandboxing rich-preview frames and suppressing unnecessary referrer data;
- validating optional extension data before it reaches interactive controls;
- keeping remote catalogue access behind explicit user actions.

These controls protect the browser. ActivityPub signatures, replay protection,
SSRF defenses, actor and object ownership, federation policy, and canonical
remote identifiers are backend responsibilities. See the paired backend for
their implementation and security history.

## Development

### Prerequisites

- Node.js 26.3.1 or newer, as pinned in `.tool-versions`
- Corepack and the repository's Yarn 4 release
- a compatible backend for authenticated, streaming, or federation-backed
  pages

Install the exact dependency set and start Vite:

```sh
corepack yarn install --immutable
corepack yarn start
```

The development server listens on port 3036 unless `PORT` is set. For a local
frontend connected to a backend on another origin:

```sh
BACKEND_URL=https://social.example corepack yarn start
```

The backend must allow the development origin. Vite deliberately does not
pretend to be a backend or silently proxy authentication traffic.

### Verification

| Command | Purpose |
| --- | --- |
| `npm run lint` | JavaScript, TypeScript, React, accessibility, and stylesheet linting |
| `npm run i18n:check` | Message identifier and locale validation |
| `npm run check` | TypeScript checking without emitted files |
| `npm run test:run` | Complete Vitest suite |
| `npm run test:federation` | Focused group, feed, schema, platform, and media compatibility suite |
| `npm run build` | Production static build in `dist/` |
| `npm run strict` | Release gate containing lint, i18n, types, tests, and the production build |

Use the smallest relevant test while working, then run `npm run strict` for a
release or cross-cutting change. Production builds treat unexpected bundler
warnings as errors.

[`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) contains the repository map,
backend setup notes, state ownership rules, testing guidance, and change
checklists.

## Configuration and deployment

The normal production topology serves the static frontend and dynamic backend
from the same origin. Leave `BACKEND_URL` unset for that arrangement. The
backend supplies accounts, APIs, streams, the deployed `/manifest.json`, and
operator-managed instance configuration.

Operators can customize the site without changing the default source files:

| Path | Purpose |
| --- | --- |
| `/instance/soapbox.json` | Deployed site name, appearance, navigation, footer, and related instance settings |
| `custom/app.json` | Build-specific OAuth application metadata |
| `custom/features.json` | Explicit build-time feature overrides |
| `custom/locales/` | Deployment-specific message overrides |
| `custom/instance/` | Files copied over the built instance assets |
| `custom/snippets.html` | Deliberate operator-controlled additions to the document head |

The frontend can be built and copied into a backend-managed frontend directory
or served as ordinary static files in front of a compatible API. Start with
[`docs/INSTALLATION.MD`](docs/INSTALLATION.MD). The complete production install
and upgrade order is owned by the Unfathomably BE documentation because it
also covers the database, server configuration, migrations, media, federation,
and services.

Example Nginx configurations for the supported deployment shapes live in
[`installation/`](installation/).

## Documentation

| Document | Audience and purpose |
| --- | --- |
| [`docs/README.md`](docs/README.md) | Documentation index for operators and maintainers |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Runtime, data ownership, backend boundary, streaming, and compatibility |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Local workflow, repository map, tests, and change checklists |
| [`docs/INSTALLATION.MD`](docs/INSTALLATION.MD) | Frontend portion of a source installation |
| [`docs/UPGRADE.MD`](docs/UPGRADE.MD) | Frontend rebuild and deployment procedure |
| [`FEDERATION_TESTING.md`](FEDERATION_TESTING.md) | Focused federation UI contract tests |
| [`docs/NATIVE_FEDERATION_UX_AUDIT.md`](docs/NATIVE_FEDERATION_UX_AUDIT.md) | Source-platform workflows used to design native presentations |
| [`docs/WORLDS_UPSTREAM_AUDIT_2026.md`](docs/WORLDS_UPSTREAM_AUDIT_2026.md) | Backend ecosystem findings with frontend consequences |
| [`CHANGELOG.md`](CHANGELOG.md) | Unfathomably releases followed by inherited Soapbox history |

## Project history and philosophy

Unfathomably FE retains mature Soapbox and Mastodon client foundations where
they still fit. It also retains stable compatibility names where renaming them
would break deployments. Neither choice limits the public product to its
upstream ancestry.

The project follows four practical rules:

1. Let the operator's community identity replace the software's default brand.
2. Preserve the useful structure of non-microblog federated objects.
3. Show only interactions the backend can truthfully authorize and perform.
4. Prefer local knowledge and deliberate remote discovery over invisible
   background traffic.

This is intended to make a small or medium Fediverse site feel connected to a
larger social web without pretending that every network has the same objects,
permissions, or user workflows.

## License and credits

- (C) Alex Gleason and other Soapbox contributors
- (C) Eugen Rochko and other Mastodon contributors
- (C) Trump Media & Technology Group
- (C) Gab AI, Inc.

Unfathomably FE is free software. You can redistribute it and/or modify it
under the terms of the GNU Affero General Public License as published by the
Free Software Foundation, either version 3 of the License, or, at your option,
any later version.

The software is distributed in the hope that it will be useful, but without
any warranty. See [`LICENSE`](LICENSE) for the complete license text.

<!-- end of README.md -->
