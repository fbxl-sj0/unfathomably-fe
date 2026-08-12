<!--
  Unfathomably frontend
  File: docs/WORLDS_UPSTREAM_AUDIT_2026.md
  Purpose: Record frontend implications of the 2026 federation ecosystem audit.
  This file does not define backend trust or validation policy.
-->

# Worlds upstream audit, 2026

The backend audit through August 6, 2026 covered Mobilizon, Fedify, Ghost
ActivityPub, BookWyrm, WordPress ActivityPub, Bonfire, Manyfold, NeoDB,
Flohmarkt, Wanderer, Takahē, snac2, Hubzilla, Streams, and Forgejo.

No new presentation component is required for the selected protocol fixes.
The backend continues to emit scalar Mastodon-compatible status and account
types after accepting legal JSON-LD arrays, and existing standard status cards
already expose the audited Event, Link, review, marketplace, route, model,
ValueFlows, publishing, and ForgeFed metadata through optional fields.

Frontend maintainers should preserve these boundaries:

- Treat Worlds entries as ordinary statuses first; specialized metadata is
  additive and must not replace reply, react, share, media, and local-open
  controls.
- Keep absent titles, optional end dates, empty collections, and missing
  previews as valid empty states rather than loading or error states.
- Render link labels as sanitized text and leave URL safety, actor authority,
  signature validation, and remote context expansion to the backend.
- Keep Forgejo marked experimental until its ActivityPub surface stabilizes;
  Project and Ticket cards must not imply that Unfathomably is a Git forge.

The corresponding protocol details and per-project resume cursors live in
`docs/UPSTREAM_FEDERATION_ECOSYSTEM_AUDIT_2026.md` in Unfathomably BE.

<!-- end of docs/WORLDS_UPSTREAM_AUDIT_2026.md -->
