![Unfathomably FE Screenshot](soapbox-screenshot.png)

# Unfathomably FE

> Your corner of the Fediverse is the whole thing

**Unfathomably FE** is a modern Fediverse frontend derived from Soapbox. It keeps the practical parts that made Soapbox useful for real communities: instance branding, custom navigation, moderation tools, chats, quote posts where the backend supports them, mobile-friendly layouts, and a PWA build that can sit in front of Mastodon-compatible APIs.

This fork is being maintained for the Unfathomably/Rebased family of deployments, including FBXL Social, while preserving compatibility with Pleroma, Akkoma, Mastodon-style, and Rebased-style backends where the API surface allows it.

## What Makes It Different

Soapbox was built around a Mastodon-compatible social UI with strong instance branding. Unfathomably FE keeps that inheritance, but the fork is aimed at a wider Fediverse shape.

The largest difference is that the UI treats remote things that are not ordinary user profiles as first-class browsing targets:

- **Groups** collect group-like actors such as Lemmy communities, PieFed communities, Mbin magazines, Lotide groups, and PeerTube channels where the backend can expose them.
- **Sources** collect source-like actors such as publishing, media, music, image, and other feed-style accounts that do not fit neatly into a normal profile timeline.
- Group and source previews are designed to show remote posts as actionable status items when the backend has enough information to support replies, comments, likes, shares, and navigation.
- The frontend has dedicated federation tests for native group/source item cards, source item schemas, source previews, and websocket stream behavior.
- Composer draft persistence is kept for crash recovery, but sent posts clear the saved draft and users can discard stale drafts.
- The public brand can be Unfathomably FE, but ordinary sites should be able to use their own configured logo, theme, accent colors, and footer links.

Compared with a plain Pleroma or Rebased frontend deployment, Unfathomably FE expects more of the backend: group/source APIs, richer status metadata, translation capability discovery, websocket streams, and compatibility hints. When those capabilities are absent, the UI should degrade instead of pretending unsupported actions are available.

## Recent Highlights

Recent work has focused on making the wider Fediverse feel native from the web UI instead of bolted on.

- Group browsing now includes a group feed for root posts from followed groups, group attribution on statuses, remote group previews, and per-account defaults for whether the groups page opens to the feed or the user's group list.
- Source browsing has been moved closer to normal status rendering, so RSS items, publishing feeds, media sources, and other source-like actors can be shown as ordinary actionable posts when the backend can expose them that way.
- RSS feed subscriptions can appear in normal feeds through the backend source APIs, with source entries treated as posts that can be boosted, quoted, bookmarked, or otherwise used locally where supported.
- Thread views now have clearer reply guide rails, including multiple nesting lines for deeper discussions so Threadiverse-style conversations are easier to follow.
- PeerTube and Funkwhale media can keep their normal in-card presentation while also offering a docked player mode for listening or watching while browsing.
- Desktop layouts have been widened so 1080p screens leave more room for the central post column without losing the familiar Soapbox navigation shape.
- The admin UI has started gaining first-class federation health surfaces, including remote-site health data and queue visibility exposed by unfathomably-be.
- Account portability work has begun with UI surfaces for post archive export and import, including backend policies for disabled, review-required, and automatic imports.

## Compatibility Notes

Unfathomably FE is the frontend: it owns the browser UI, themes, configuration screens, client-side routes, service worker, and static assets.

The backend owns accounts, timelines, posts, media, federation, moderation APIs, OAuth, ActivityPub endpoints, and server-side policy. Different backends expose different features, so the frontend detects capabilities and only shows supported controls.

Some internal paths and identifiers still use `soapbox` names for compatibility. Examples include `soapbox.json`, `/soapbox/config`, and `useSoapboxConfig`. These names are implementation details, not public branding.

## Relationship To Soapbox, Rebased, And Pleroma

Unfathomably FE is closest to Soapbox in code structure and user-interface ancestry. It is intended to pair especially well with unfathomably-be, which descends from Rebased and Pleroma.

That means some names remain intentionally historical. Keeping stable config paths and API expectations matters more than renaming every internal symbol. Public-facing names, repository links, default metadata, and operator documentation should refer to Unfathomably FE.

The project is not trying to replace every Fediverse client. It is trying to be a practical web frontend for servers that want Mastodon-style usability plus better day-to-day interaction with group, source, and Threadiverse-style software.

## Development

Use Node 26.3.1 or newer.

```sh
yarn install
yarn start
```

Useful checks:

```sh
npm run lint
npm run i18n:check
npm run check
npm run test:run
npm run build
npm run strict
```

`npm run strict` is the release gate. It runs JavaScript linting, stylesheet linting, i18n validation, TypeScript, Vitest, and a production build with warnings treated as errors.

## Deployment

The built frontend can be served as static files in front of a compatible Fediverse backend. The `installation/` directory contains Nginx examples for Docker and Mastodon-style deployments.

Operators should customize `/instance/soapbox.json` or the admin configuration UI with their own site name, colors, logo, footer links, and policy pages. The software should disappear behind the site's identity in ordinary use.

## Project Philosophy

Unfathomably FE exists to let a Fediverse site look and feel like itself. The frontend should keep backend compatibility, but the public experience should be shaped by the operator's community rather than by a default upstream brand.

That means the fork has two deliberate constraints:

- preserve stable compatibility names where backends, configs, or old deployments depend on them
- present Unfathomably FE, or the operator's configured site identity, to users and outside tooling

## License And Credits

(C) Alex Gleason and other Soapbox contributors
(C) Eugen Rochko and other Mastodon contributors
(C) Trump Media & Technology Group
(C) Gab AI, Inc.

Unfathomably FE is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Unfathomably FE is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with Unfathomably FE. If not, see <https://www.gnu.org/licenses/>.
