# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries before the Unfathomably FE fork are inherited from Soapbox history.

## [Unreleased]
### Fixed
- Kept quoted-post details useful while a modern remote authorization is being
  verified by linking to the locally cached quote target when available, with
  the original URL as a compatibility fallback for older backends.
- Made the live page audit collapse duplicate service-worker request aliases
  and require a stable API quiet interval after response reconciliation,
  preventing false pending requests and audit-induced PostgreSQL connection
  replacement during rapid profile navigation.
- Stopped followed-group panels from issuing an empty group-search request,
  preventing unrelated feed pages from waiting on `/api/v1/groups?q=` during
  authenticated navigation.
### Added
- Added BookWyrm-aware series and series-position fields to book creation and
  received-book displays, keeping edition and work context visible while
  retaining the existing shelf, review, and discussion workflow.
- Added a private, family-specific Worlds workspace for received and locally
  resolved objects. Users can maintain watchlists, reading/listening progress,
  route plans, event attendance, model printing, game state, marketplace
  follow-up, project work, ratings, and notes without creating timeline posts;
  participation appears on profiles only through an explicit public opt-in.
- Added native workflow views based on the specialized projects themselves:
  an agenda for events, a lane-based ForgeFed project board, route planning,
  live-stream and chess tracking, and state controls on ordinary post-backed
  and discovery-backed objects.
- Added a route-persistent audio and video queue with play-now, play-next,
  append, remove, previous/next, automatic advance, and reload persistence.
  Received audio search now exposes those queue actions directly.

### Fixed
- Made the live page audit reconcile service-worker request aliases before
  reporting pending APIs, while retaining its strict response-time guard for
  genuinely slow pages.
- Made the live page audit wait for bounded same-origin API work to finish
  before leaving each route, so late browser failures are observed without
  manufacturing PostgreSQL connection churn by abandoning healthy requests.

### Security

- Reconciled the frontend with the complete Mastodon and Pleroma CVE audit,
  confirmed server-side authentication, streaming, parsing, and fetch controls
  remain backend-enforced, and retained strict dependency, lint, type, test,
  and production-build gates for the deployed bundle.

### Added

- Added compact object and participation cues to the Worlds chooser from the
  backend workflow manifest, so each world communicates what can actually be
  found and done without another block of explanatory prose.
- Added backend capability-aware presentation so Worlds, specialized groups
  and sources, account Worlds tabs, quote listings, and federation admin tools
  are only exposed when the connected server advertises the required API.
- Added v1-first instance discovery with selective v2 metadata loading, keeping
  current Mastodon metadata while avoiding unsupported v2 probes on Pleroma,
  Akkoma, and older Rebased backends.
- Added a reusable, read-only Chromium compatibility audit that serves the
  current FE through isolated same-origin HTTP and WebSocket gateways for
  Mastodon, Pleroma, Rebased, and Akkoma backends.
- Added a compact protocol-address list to local profiles so visitors can see,
  open, and copy the account's ActivityPub address, Nostr `npub`, and optional
  Bluesky and Diaspora addresses without exposing unprovisioned identities.

### Fixed

- Stopped logged-out Worlds feeds from requesting an access-controlled public
  timeline when the backend disables anonymous public timelines; the page now
  offers sign-in without producing browser 401 errors.
- Fixed non-book Worlds libraries so they render only their family-specific
  workspace instead of mounting the BookWyrm library above it.
- Fixed status-backed Worlds results so ordinary Soapbox post controls remain
  visible while the world-specific book, media, event, project, route, and
  catalog details stay available beneath the post. Added a bounded status
  hydration timeout so a delayed local fetch falls back to the specialized
  result instead of leaving an endless placeholder.
- Stopped enabling the trending-status panel on Unfathomably merely through
  inherited backend-family assumptions; the FE now requires the explicit
  `trending_statuses` capability and avoids unsupported API requests.
- Restored authenticated browser streaming against v2-capable backends by
  normalizing both standard and top-level v2 streaming URL shapes and falling
  back to the validated v1 URL when v2 metadata is incomplete; read-only
  live-page audits now require and report a completed WebSocket handshake only
  on stream-capable routes and allow a bounded browser handshake window.
- Removed the status-creating streaming probe so browser verification cannot
  create timeline content; page audits use existing read-only traffic and
  capture handshake, frame, DOM, console, and network evidence.
- Fixed account, group, and source schema normalization so legacy Pleroma
  default avatar and header URLs resolve to the FE's bundled fallback assets
  instead of generating browser 404s for `/images/avi.png` and
  `/images/banner.png`.
- Restored WebSocket and EventSource timeline connections when instance
  discovery uses the Mastodon v1 API by carrying `urls.streaming_api` into the
  frontend's normalized streaming configuration while preserving newer v2
  metadata when both forms are available.
- Restored reliable live timeline updates by falling back to EventSource after
  a failed initial WebSocket upgrade and reconciling home, local, global, and
  landing timelines while the reader is at the top of the list.
- Prevented rejected audio and video playback promises from surfacing as
  uncaught navigation or media errors while a remote source fallback is being
  selected or a player is being removed.
- Strengthened the release gate with uncached zero-warning linting, dependency
  constraints, lockfile deduplication, recursive security auditing, the full
  test suite, type and localization checks, and a production build.
- Updated the ESLint parser target for modern Node audit scripts and corrected
  shared instance-query test setup so capability-aware navigation tests model
  completed v1 and v2 probes.
- Pinned patched transitive releases for brace expansion, DOM sanitization,
  URI parsing, YAML parsing, tar handling, and Undici so the recursive
  dependency audit remains clean even when parent constraints lag a security
  patch.
- Split anonymous local and federated timeline and streaming support into
  explicit backend capabilities, keeping restricted Unfathomably deployments
  behind login without weakening authenticated streams.
- Fixed logged-out compatibility pages that started unsupported local timeline
  streams, malformed unsupported quote-list URLs through a legacy redirect,
  public-stream transports that briefly connected while routes changed, and
  blank deep links during transient instance-metadata failures.
- Completed a full compatibility page audit by suppressing invalid legacy
  backend manifests, routing access-controlled public screens through login on
  generic backends, and retrying transient instance-metadata failures during
  frontend bootstrap.

- Restored the pre-React theme bootstrap asset and module preload so saved
  light, dark, and black modes apply without a missing-script console error.
- Stopped ordinary profile pages from probing the account Worlds endpoint when
  the connected backend does not advertise native federation support.
- Stopped sending false-valued optional media filters to strict timeline APIs,
  while retaining media-only filtering where the user actually requests it.
- Stopped treating every Rebased-family or federating backend as if it exposed
  Unfathomably Worlds, group discovery, source, and quote-listing extensions.

## [3.5.0] - 2026-08-12

### Added
- Added live WebSocket updates for native Worlds feeds, account posts and
  media, events, bubble timelines, group tag/media views, and open status/event
  discussions.
- Added native-media publishing guidance to the connected Bluesky account
  state and safe callback success/failure handling.
- Added a shared optimistic mutation transaction for query-backed workflows,
  and migrated book shelf and native-object state changes to serialized intent,
  exact rollback, server-result reconciliation, and stale-without-immediate-
  refetch behavior.
- Added theme-aware Nostr, AT Protocol, and diaspora* glyphs to mirrored
  account rows so their external protocol origin is visible without a fake
  ActivityPub domain favicon.
- Added per-account Worlds profile tabs backed by server-confirmed public
  participation, including a read-only Books library for other users and
  native-family account timelines rendered through normal post components.
- Added a first-class My books workflow with complete shelf filters, personal
  library search, covers, reading progress, started and finished dates, and
  inline shelf, progress, removal, and review actions.
- Displayed backend-verified FEP-c390 linked identities as public native
  profile metadata without a privileged secondary request, while leaving raw
  proof signatures out of the interface and keeping identity authorization
  decisions inside the backend trust boundary.
- Opened canonical links to actors and visible posts already known by the
  backend through local profile and status routes, while preserving the
  original remote label and destination as link context.
- Added a compact administrator workflow for featuring, hiding, ordering, and
  removing remote communities in Worlds discovery, and marked featured
  communities clearly in ordinary user-facing results.
- Added native Threadiverse moderator-comment presentation and authorized
  distinguish/undistinguish controls for a moderator's own group replies.
- Displayed the exact text that triggered a status filter when the backend
  supplies match metadata, while retaining legacy Pleroma filter-title
  fallbacks for older and cached responses.
- Added an account-migration recovery workflow that shows the recorded
  moved-to actor and lets the account owner retry bounded Move delivery after
  confirming the current password.
- Added a recent archive-import workflow with localized queued, review,
  progress, completion, rejection, and failure states; active imports refresh
  in the background and announce completion with locale-aware plural counts.
- Added short time-zone labels and complete start/end times to event date
  presentations, making federated event schedules unambiguous while retaining
  the existing calendar export workflow.
- Added a bounded short-lived cache for successful Worlds searches so revisiting
  a discovery view does not repeat identical local and catalogue requests.
- Added machine-readable `datetime` metadata to relative timestamps so status
  dates retain their semantic meaning for assistive tools and page parsers.
- Separated profile discovery from public-post search indexing in profile
  settings, and wired the new indexing control through the account API so the
  frontend can manage the backend's federated `toot:indexable` policy.
- Added searchable settings navigation inspired by Misskey's 2025 in-app
  settings index, adapted to the existing Soapbox settings layout and theme.
- Added one bounded recovery fetch for quoted statuses missing from the local
  frontend cache and a stable unavailable tombstone after terminal failures,
  avoiding blank quotes without creating repeated fetch loops.
- Presented BookWyrm series identity and series position alongside the existing
  author, edition, ISBN, rating, and reading-state details on ordinary native
  post cards.
- Added activity-ranked Nostr community discovery using standard Soapbox group
  cards, with recent post and participant counts for NIP-29 and NIP-72 groups.
- Added compact external catalogue actions to received BookWyrm book cards so
  users can open known Open Library, Inventaire, Finna, LibraryThing,
  Goodreads, Wikidata, VIAF, and BnF records directly.
- Added native Nostr live-status and profile-badge presentation to ordinary
  Soapbox profiles. Expiring general/music statuses use configured theme
  accents, badge images retain compact profile scale, and text-only badges use
  the same theme rather than introducing fixed light panels.
- Added direct browser-local `nsec` import to Nostr signup and a bounded NIP-65
  relay preference workflow that publishes the signed relay list locally and
  to the selected relays.
- Added native Nostr address routing so `npub` and `nprofile` identities enter
  the existing account follow workflow, while NIP-29 `naddr` community
  identifiers enter the existing local search, follow, and group workflow.
- Added direct More-menu destinations for every World workflow, keeping
  Postmarks-style shared links distinct from ordinary status bookmarks.
- Added reviewed ecosystem entry points and locally known publishers to the
  Worlds landing page and each focused workflow.
- Added a visual create-to-participate path for every World type, including
  direct post-publication object, World, and software issue actions.
- Added owner lifecycle controls for games and separate software project
  lifecycle states so projects no longer look like open issue tickets.
- Added a Software project workflow with repository, homepage, license, status,
  topics, and attachments, plus direct project and issue actions on the
  Development page.
- Added one-click issue filing from locally hosted project cards so ticket
  drafts inherit the correct project context instead of requiring users to
  copy ActivityPub object URLs.
- Added stable, focused `/worlds/:family` routes for every supported native
  federation workflow, backed by a defensive public capability manifest from
  Unfathomably BE.
- Added a single search-first workspace to every focused Worlds page, with
  family-specific suggestions, compact normalized result cards, provider
  health, safe local-resolution handoffs, and immediate browse results where
  the ecosystem exposes an appropriate public feed.
- Connected the primary Books and Audio searches to the existing bounded Open
  Library and MusicBrainz metadata services alongside federated BookWyrm,
  NeoDB, and Funkwhale discovery.
- Repaired the Owncast live-directory workflow by accepting the backend video
  family, labeling transient directory state as `listed live`, making proxied
  remote artwork explicitly opt-in, hiding sensitive thumbnails, showing tags,
  and offering deliberate source-origin discovery without polling every stream
  or guessing its federation username.
- Made received Mobilizon, Gancio, and compatible events immediately
  browseable as an upcoming calendar, with lifecycle, hybrid and physical
  venues, human attendance rules, capacity, proxied artwork, source-controlled
  RSVP handoff, local discussion resolution, and local calendar downloads.
- Made received marketplace inventory immediately browseable with offered/wanted
  purpose, source-reported availability, publication/expiry dates, and an
  explicit availability disclaimer while hiding terminal listings.
- Added browseable NeoDB shelf and collection cards alongside received ratings
  and reviews, with item counts, states, dynamic-query disclosure, and explicit
  origin/item-feed actions that do not crawl unbounded remote collections.
- Added locally received BookWyrm shelf/list membership handoffs so recent
  public `Add` and `Remove` activity can expose known collection books without
  crawling a remote shelf.
- Made received BookWyrm reviews, shelves, lists, and reading activity
  immediately browseable, with collection size, membership position, parent
  collection, reader, and book handoffs rendered as native reading cards.
- Added received PeerTube playlist cards with collection artwork, channel and
  item counts, partial-collection disclosure, and local/source handoffs beside
  received videos and channel discovery.
- Added native received-video discovery and cards with media-proxied
  thumbnails, duration, channel, publication metadata, content warnings,
  schedules, and interaction restrictions alongside PeerTube channel search.
- Added native multi-image gallery previews and creator-control badges to
  received photo discovery, preserving per-image descriptions while clearly
  identifying Pixelfed posts that disable replies, likes, or sharing.
- Added native received-game cards to federated chess discovery, including a
  validated board, latest SAN move, side to move, participants, source game,
  and local move resolution while retaining Castling challenge discovery as a
  separate user-confirmed workflow.
- Added local discovery cards for known Manyfold-compatible 3D model, creator,
  and collection actors, preserving previews, descriptions, licences,
  attribution, collection membership, tags, links, and local resolution while
  clearly directing model-binary access to the source instead of implying that
  compatibility Notes or downloadable files were federated.
- Added local discovery cards for known ForgeFed projects, repositories,
  trackers, tickets, commits, branches, releases, reviews, and explicitly
  public push activity, with author, project, tracker, status, hash, commit,
  clone, source, and local-resolution context kept distinct from the reviewed
  Forgejo web catalogue.
- Reworked route discovery into a local search over received public Wanderer
  trails, with route previews, authors, places, difficulty, distance, elevation,
  dates, tags, map and GPX actions, and deliberate local trail resolution.
- Reworked marketplace discovery into a local search over received, verified
  Flohmarkt and FEP-0837 listings, with images, prices, sellers, locations,
  condition, delivery, tags, source actions, and local listing resolution.
- Restored the event discovery cards as a local-cache search for received
  Mobilizon, Gancio, and compatible events, including venues, organizers,
  schedules, attendance, access policy, categories, and local event resolution.
- Added local discovery cards for durable Funkwhale-style artists, albums,
  libraries, and playlists, with artwork, ownership, item counts, MusicBrainz
  metadata, and local-resolution actions while excluding bulk-update envelopes.
- Added a local-cache audio search for received Funkwhale and compatible
  ActivityStreams Audio objects, with artist, album, licence, tag, publisher,
  local-resolution, and source actions and no remote autoplay.
- Added a local-first NeoDB cultural activity search that presents received
  ratings, reviews, collection states, catalog items, and reviewers as usable
  culture cards without crawling remote servers.
- Added local search and structured cards for received BookWyrm-style reviews,
  quotations, ratings, shelves, and lists, with deliberate links to the reading
  object, referenced book, and reader actor.
- Added first-class PeerTube channel discovery with channel-owner separation,
  follower and support context, accepted-bridge scoping, and deliberate local
  actor resolution.
- Added local resolution for the Funkwhale channel or library actor attached
  to a discovered track, instead of exposing the publisher only as an outside
  source link.
- Added a native Mobilizon event and organizer discovery workflow with
  dedicated search modes, venue and participation context, organizer access,
  pagination, and deliberate local ActivityPub resolution.
- Added an adaptive alien-publishing discovery workflow for Postmarks
  bookmarks, WriteFreely/WordPress-style articles, and structured publication
  records, preserving bookmark destinations, local interaction objects,
  authorship, subjects, languages, licences, tags, and attachments.
- Added a native photography discovery workflow for public Pixelfed-compatible
  objects already received by the server, with proxied previews, sensitive
  thumbnail protection, image descriptions, places, tags, licences, publisher
  links, and a direct handoff to normal local interactions.
- Added a native development discovery workflow for reviewed Forgejo
  catalogues, with useful repository metadata, direct project links, and
  optional local resolution of the project owner's federated account without
  misrepresenting ordinary repository URLs as ForgeFed actors.
- Added an account-search disclosure for active external FASP providers,
  including provider and privacy-policy links, an explanation of shared search
  terms and retained local safety checks, and a dismissible expanded notice
  that leaves a compact discovery indicator behind.
- Added native Owncast live-stream discovery through the official opt-in
  directory, with explicit browse controls, live-state cards, no HLS autoplay,
  and separate native viewing and local actor-resolution actions.
- Added indexed local discovery for public ValueFlows and mutual-aid records,
  with understandable offer/need/proposal roles, action, state, quantity,
  location, tags, source context, and safe local resolution without crawling
  coordination communities or contacting private GraphQL APIs.
- Added an administrator workflow for signed FASP discovery providers,
  including provider and server fingerprint comparison, inert pending
  registrations, signed provider-information refreshes, privacy-policy links,
  separate activation controls for account discovery, and safe removal of a
  rejected request when a provider should be allowed to register again.
- Added a native Castling discovery workflow to Worlds with open challengers,
  recent game boards, move context, local latest-move resolution, and
  review-before-posting challenge composition.
- Added a native Models discovery workflow for Manyfold. Users can search a
  reviewed public catalogue, understand each result as a followable 3D model
  actor, inspect its preview, creator, collection, and tags, then deliberately
  resolve the actor locally without an automatic follow or file download.
- Completed the Worlds `Resolve actor or item` handoff with an exact-URL
  native object resolver. Create-backed objects now use the full specialized
  status card, while public source-only resources receive a bounded read-only
  preview that honestly omits social controls their publisher did not provide.
- Kept audio, cultural catalog, event, video, and route resolution inside
  Worlds with the selected structural family preserved, instead of dropping
  users into generic search after they choose an alien-platform item.
- Fixed linked PeerTube community response validation by reading federation
  directions from the community record rather than an unrelated video item.
- Replaced empty Bookmarks and mutual-aid discovery dead ends with the real
  Postmarks single-user actor and ActivityPods private trusted-network
  workflows, backed by server-provided official ecosystem guides.
- Exposed the backend's official Pixelfed server directory through the existing
  reviewed-directory card and explicit `Open directory` workflow.
- Exposed official BookWyrm, NeoDB, Flohmarkt, and Manyfold directories through
  the same reviewed-directory workflow instead of presenting one configured
  server as the entire ecosystem.
- Exposed first-party Funkwhale, Mobilizon, and Gancio directories alongside
  connected provider roots, keeping server choice separate from local search
  and cached-actor state.
- Added a local `Resolve actor or item` action to every external directory,
  ecosystem guide, and configured source card so choosing a community leads
  directly into the exact-handle or URL workflow.
- Distinguished official ecosystem guides from communities, directories, and
  known actors in Worlds so immature ForgeFed and ValueFlows entry points have
  honest provenance, maturity messaging, and a `Review ecosystem` action.
- Added local received-item search to Worlds with URL-preserved queries and
  family-aware pagination, covering native titles, creators, identifiers,
  projects, routes, marketplace listings, and media metadata without remote
  lookup side effects.
- Made each Worlds family tab request and paginate its own structurally filtered
  backend timeline, so uncommon native objects are not buried behind newer
  Audio and Photo traffic from the mixed feed.
- Corrected BookWyrm and NeoDB catalog actions so specialized source records
  open in their useful native views instead of promising generic local status
  resolution that their document shapes cannot safely support.
- Expanded linked PeerTube Worlds cards to show accepted inbound, outbound, and
  two-way server relationships from the configured local video index.
- Made Worlds catalog access states explicit: locally cached actors open here
  first, curated directories prompt community selection, and external sources
  are labeled as source links rather than implied federation relationships.
- Completed Worlds guidance for Longform, Publishing, Bookmarks, and Groups,
  covering reviewed directories, locally known actors, and safe complete-URL
  resolution where no global discovery service exists.
- Clarified the distinct native workflows for Castling and Manyfold: Castling
  game pages remain in their board-aware source viewer, while Manyfold model
  files, versions, and downloads remain source-native.
- Made directory-less Worlds families actionable without inventing a public
  crawler: Bookmark, coordination, and ForgeFed empty states now explain their
  discovery boundary and link directly to the deliberate actor/URL resolver.
- Distinguished PeerTube ActivityPub videos from Owncast live services in
  Worlds: channel pages are actionable, PeerTube videos advertise local
  resolution, and Owncast streams keep only their valid live-source action.
- Improved Funkwhale track discovery by exposing every healthy configured
  catalog, making publisher profiles actionable, and clearly separating source
  listening, favourites, and follows from local ActivityPub track resolution.
- Improved Mobilizon and Gancio event discovery by showing every healthy
  connected provider, linking organizers where their event metadata exposes a
  profile, and clearly separating source RSVP/discussion from local ActivityPub
  event resolution.
- Clarified BookWyrm and NeoDB catalog actions so people can distinguish a
  source-record view from resolving the verified ActivityPub representation
  within Unfathomably.
- Corrected Flohmarkt listing actions so Worlds opens the marketplace-owned
  listing and seller-contact workflow instead of offering a misleading local
  resolution path for pages that are not ActivityPub objects.
- Added separate Wanderer route actions for opening the verified human trail
  page, resolving its ActivityPub object locally, and opening the publishing
  community.
- Removed the misleading local-resolution action from Wanderer route cards
  when a recommendation exposes only a machine API record, and direct people
  to the publishing community instead of an unusable synthetic route lookup.
- Labeled locally known Worlds browsing results with their structural native
  family, making mixed source and community results understandable before a
  person opens or follows one.
- Added native-family markers to mixed All Worlds ecosystem cards so their
  content shape remains visible before a user opens a source or community.
- Added an explicit Worlds empty state for ecosystems without a reviewed public
  entry point, explaining local discovery and deliberate actor resolution.
- Taught Worlds to retry a short-lived warming catalog response and show when
  locally known alien actors are being refreshed in the background.
- Made the Worlds local catalog an explicit browse action with accurate
  loading, empty, and failure states, so people can discover specialized
  groups and sources already known here without triggering remote lookups.
- Added a distinct reviewed-directory provenance label and action for Worlds
  cards that lead to curated alien-platform directories.
- Limited PeerTube community "Open here" actions to exact locally cached actor
  profiles instead of presenting an ambiguous URL search as a local record.
- Labeled Worlds catalog cards as configured sources, reviewed communities, or
  locally known actors before visitors choose to open them.
- Made Worlds "View local record" open an exact known native actor profile
  instead of issuing a generic actor-URL search.
- Added Worlds fallbacks for backend-generated neutral `activitypub-*`
  platform labels so normalized native shapes retain their family even when a
  peer omits redundant type and family fields.
- Added raw ActivityPods Project and Mutual Aid Offer/Request namespace
  fallbacks to Coordination, matching the backend classifier when a peer omits
  platform metadata.
- Added Project and Repository object fallbacks to the Development World for
  ForgeFed peers that omit platform metadata.
- Added a public Worlds sign-in handoff that explains when configured-source
  searches become available and confirms that providers are contacted only
  after an authenticated visitor chooses a discovery action.
- Made Audio, Events, and Wanderer recommendations deliberate discovery
  actions, fixed the Events-family tab so it renders after selection, and kept
  a healthy event provider visible when another configured provider is down.
- Made connected-video discovery deliberate: Worlds now offers an explicit
  cached linked-community action and does not request a remote video directory
  until a visitor chooses that action or submits a search.
- Clarified Connected ecosystems copy so locally known actor cards are not
  mistaken for operator endorsements or follow relationships.
- Added Worlds fallback classification for backend-recognized AP-Groups,
  Bonfire, BuzzRelay, Elgg, Fedibird Group, Friendica, Group Actor, and
  Streams/Forte group payloads when a peer omits an explicit native family.
- Routed mutual-aid ActivityPub presentations to Coordination in Worlds instead
  of the generic marketplace family, matching their offer, request, and shared
  work workflow.
- Added locally known native source cards to Connected ecosystems, including a
  clear local-record action and a visible distinction from operator-configured
  external community origins.
- Made the passive Connected ecosystems catalog public in Worlds, while keeping
  actor resolution and follows authenticated and user-initiated.
- Added Connected ecosystems cards to Worlds so configured alien-platform
  communities remain discoverable before an individual remote actor is known
  locally, without implying a follow or generating provider traffic.
- Aligned Browse known worlds with the selected Worlds family, keeping the
  default actor catalog specific to the native object shape being explored.
- Made Worlds browseable before a user knows a name by loading the bounded local
  specialized-actor catalog by default, while preserving explicit typed search
  and remote-resolution behavior.
- Aligned the Feeds screen with Worlds discovery by displaying backend-native
  source labels, adding a Native worlds filter, and allowing expanded native
  publishers to load their bounded item previews.
- Added a Linked video communities section to Worlds. It distinguishes
  explicitly federated PeerTube peers from video-search results and explains
  that opening a community does not contact it through a search or subscribe.
- Made Wanderer cards open the verified source community while retaining a
  separate local-resolution action for the canonical ActivityPub trail record.
- Added Owncast's documented opt-in directory to Connected video worlds. Live
  stream cards retain the stream's source page and tags without embedding HLS
  media or contacting individual stream servers.
- Added a Wanderer route discovery surface for public recommended trails from
  operator-approved sources, with distance, duration, elevation, location,
  category, source, and local-resolution actions.
- Added user-triggered Flohmarkt marketplace discovery to Worlds. Connected
  marketplace cards now show the listing title, price, currency, tags, source,
  and clear routes to the original listing or deliberate local resolution,
  without sharing a user's location or issuing a request before search submit.
- Kept catalog discovery requests scoped to an explicit submit in the current
  Books, Games, or Culture category, so changing a Worlds family never reuses
  an old search to contact a different external provider.
- Added BookWyrm results to Worlds' Books catalog workflow, showing the
  trusted peer that supplied each public result and preserving BookWyrm book
  links, covers, authors, and publication context without background crawling.
- Added search-first NeoDB catalog discovery to Worlds' Books, Games, and
  Culture families. The new cards show canonical records, cover art, credits,
  rating, language, tags, and release context while leaving every search and
  source visit deliberate rather than crawling public catalogs in the
  background.
- Added a dedicated audio discovery surface to Worlds for operator-approved
  Funkwhale catalogs, with useful track cards for artist, release, duration,
  license, tags, source listening, and deliberate local resolution rather
  than opaque generic posts.
- Added browse-first Gancio event discovery to Worlds, retaining each index's
  own bounded upcoming-event collection and displaying flyers, venue, online
  state, tags, and direct event links without overfetching event detail pages.
- Added outside event discovery to Worlds using operator-approved Mobilizon
  indexes, with useful upcoming-event cards for date, venue, organizer,
  capacity, origin, search, paging, and deliberate local resolution.
- Added real outside discovery to Worlds instead of presenting the local native
  timeline as a network directory. The first provider browses and searches
  public videos from an operator-approved PeerTube index, shows their actual
  channel and origin server, and offers explicit remote or local-resolution
  actions without contacting every linked peer.
- Added scheduled-live video context for explicit PeerTube-style metadata,
  including localized start times and deliberate same-origin player links,
  without claiming that an unprobed remote stream is currently online.
- Added bounded Wanderer route maps with explicit GPX downloads and
  Manyfold-style model file panels that show format, filename, and license
  context without automatically fetching remote assets.
- Added a URL-backed My items filter to Worlds so authors can revisit and
  manage their own specialized creations by family, including older-page
  discovery without a duplicate backend scan.
- Added plain-language lifecycle controls for author-owned marketplace,
  ForgeFed, and coordination objects, while keeping remote native objects
  clearly state-labelled and read-only.
- Rendered valid Castling-compatible FEN positions as accessible, responsive
  chess boards with coordinates, side-to-move state, and current SAN move
  context instead of exposing notation as raw metadata alone.
- Added an intuitive reading-state control to native book and edition cards,
  including Want to read, Reading, Read, Stopped reading, and optional page or
  percentage progress backed by the federated personal library API.
- Added backend-declared review, seller-contact, coordination-response, and
  issue-discussion actions to specialized status cards, including private
  marketplace replies and prefilled BookWyrm/NeoDB review creation.
- Fixed reply composition so a status present in both frontend stores opens
  only one composer, and allowed contextual workflows to request a deliberate
  visibility such as direct seller contact.
- Added a backend-approved Record listen action to Funkwhale Track and Audio
  presentations, with explicit repeatable-history wording and configured-theme
  styling instead of treating listening as a generic favourite.
- Made Worlds use a server-filtered native-object timeline instead of paging
  the ordinary public timeline and discarding unrelated posts in the browser.
- Added workflow guidance for BookWyrm, NeoDB, Castling.club, Manyfold,
  Flohmarkt, Wanderer, ForgeFed, Bonfire ValueFlows, mutual-aid applications,
  Mobilizon, Gancio, Funkwhale, PeerTube, Owncast, and Pixelfed.
- Added MusicBrainz-assisted audio drafts and retained catalog provenance as
  the native object's subject reference instead of silently losing it.
- Reworked native source cards to use the configured site palette and expose
  useful book, culture, game, model, marketplace, development, coordination,
  event, video, and photo metadata instead of generic links or arbitrary
  platform-specific colours.
- Added a role-gated marketplace connector setup link for administrators who
  encounter an eligible marketplace offer before the instance has any approved
  marketplace connection. Ordinary authors continue to see only delivery
  readiness information.
- Clarified Marketplace connector removal as a full disconnect rather than a
  local-only delivery toggle.
- Added explicit, off-by-default consent before a public marketplace offer can
  be delivered to an administrator-approved compatible marketplace.
- Added an administrator-only specialised federation screen for deliberate
  Flohmarkt-compatible marketplace connections, including explicit lifecycle
  state and a no-crawling, no-backfill explanation.
- Expanded the Marketplace delivery card to distinguish active compatible
  peers from a pending acceptance or unavailable connector without exposing
  remote peer addresses to authors.
- Added a Marketplace delivery status card that distinguishes local authoring
  from approved compatible-network delivery without revealing remote peers.
- Added marketplace coordinate inputs with privacy guidance. Approved
  compatible marketplace delivery uses approximate public coordinates, not a
  home address.
- Expanded Worlds authoring and filtering across every non-microblog
  federation family, including file-first audio, video, and photo workflows,
  a long-form editor, URL-first bookmarks, and direct handoff to the existing
  community and event creators.
- Reworked native detail context into scan-friendly, theme-aware cards with
  human dates, ratings, links, and family-specific facts instead of a raw
  protocol-style metadata list.
- Added a source-backed native federation UX audit covering how sixteen
  representative upstream projects enter and present their native objects.
- Extended the shared input wrapper with standard numeric step and input-mode
  attributes needed by bounded decimal and ordered native-object fields.
- Added provider-assisted book entry to Worlds. Authenticated users can search
  Open Library by title, author, or ISBN, inspect source-labelled candidates,
  and copy a selection into a fully editable draft without automatic publishing
  or remote artwork attachment.
- Added a bounded Worlds composer for book reviews, software tickets, 3D
  models, marketplace offers, games, routes, culture items, coordination
  proposals, and publications, with explicit visibility and inert reference
  links backed by server-owned ActivityPub templates.
- Replaced the generic Worlds form with nine domain-specific workflows covering
  usable book, software, model, marketplace, game, route, culture,
  coordination, and publication metadata. Added owned file uploads, attachment
  descriptions, workflow-specific file guidance, resource requirements, and
  richer native cards that expose additional safe fields and useful links
  while retaining normal status interactions.

### Changed
- Replaced the remaining Soapbox logo and rendered wordmark assets with one
  reusable stylized galaxy logo in the existing visual language, shared across
  frontend and backend branding.
- Kept strict frontend lint focused on authored source by excluding generated
  distribution snapshots, and replaced nested account-timeline routing ternaries
  with explicit branches.
- Made AT Protocol OAuth the primary Bluesky account-linking workflow while
  keeping app passwords as an explicit compatibility fallback, clearly
  limiting authorization to posting/interactions/media without enabling
  full-network ingestion.
- Updated direct frontend dependencies to their newest mutually compatible
  releases, including Vite 8.2.1 and the ESLint 9.39.5 toolchain.
- Linked the compact Books discovery summary to the complete personal library
  so saved titles are no longer limited to five-item shelf previews.
- Replaced raw remote URLs in nested quote presentations with an intelligible
  local status link, preserving normal navigation and interaction workflows
  for quotes embedded inside other quotes.
- Applied right-to-left direction at the document root, including
  region-qualified Arabic, Kurdish, Persian, and Hebrew locales, so browser
  layout and accessibility semantics match the active locale throughout the
  interface.
- Synchronized the deployed frontend with internal media-preview routing so
  browser URLs remain public while backend thumbnail work no longer depends on
  public-IP hairpin support.
- Synchronized the deployed frontend with bounded remote featured-collection
  ingestion so excess remote pins no longer create permanent incoming retries
  while the existing local presentation limit remains unchanged.
- Synchronized the deployed Nostr interface with bounded NIP-17 relay-list
  metadata, Unicode NIP-58 identifiers, and large valid remote badge selections
  while retaining the existing eight-badge presentation limit.
- Synchronized the deployed group interface with backend acceptance of bounded
  large NIP-29 administrator and member lists, allowing followed Nostr
  communities to retain complete, deterministic signed membership state.
- Synchronized the live frontend release with the backend quote-forwarding,
  quote-hydration, and remote actor-visibility repairs while retaining the
  existing account, group-thread, and quote presentation contracts.
- Clarified account migration so users know that posts and followed accounts do
  not move with their followers.
- Replaced mouse-only search clearing affordances with labeled native buttons
  across global, account, list-member, and chat search workflows.
- Completed dropdown accessibility semantics with unique menu IDs, explicit
  trigger relationships and expanded state, and correct menu item roles.
- Hid the status visibility selector while editing an existing post, since
  ActivityPub updates cannot safely change the audience of an already
  delivered activity.
- Renamed the misleading "Lock account" profile setting to "Manually review
  follow requests" so the control describes its actual effect instead of
  implying broader account privacy.
- Clarified active-session management by identifying the current session,
  labeling expiry dates, providing an empty state, and removing the fixed
  light-gray token panels.
- Recorded the frontend disposition of every 2025 wide-matrix ecosystem audit;
  protocol-only hardening keeps the existing status-card workflow while new
  BookWyrm and Funkwhale collection metadata uses the same theme-aware native
  presentation surface.
- Clarified the BookWyrm review workflow so the selected title is understood as
  the book identity, while review text remains headline-free and an optional
  rating can stand alone.
- Documented the Worlds presentation implications of the 2026 Mobilizon,
  Fedify, Ghost, BookWyrm, WordPress ActivityPub, Bonfire, Manyfold, NeoDB,
  Flohmarkt, Wanderer, Takahē, snac2, Hubzilla, Streams, and Forgejo audit,
  confirming that the selected backend hardening preserves existing standard
  status-card contracts.
- Updated the frontend to the newest mutually compatible dependency set,
  including Vite 8, Lexical 0.49, Sentry 10.69, TypeScript 6, and the current
  TypeScript ESLint line, and aligned markup, autosuggest, Nostr metadata, and
  active-group query code with their stricter current APIs.
- Exposed the backend workflow manifest's plain-language actions and creation
  sequence inside each collapsed `About this world` section, keeping the main
  timeline quiet while giving unfamiliar users concrete help on demand.
- Made local participation the primary action in Worlds media and event
  discovery: Funkwhale tracks now lead into local playback, follows,
  favourites, and conversation, while Mobilizon/Gancio events lead into the
  existing RSVP and discussion workflow. Original-source and external
  registration links remain available where the capability is source-bound.
- Prioritized followable local creators, channels, groups, services, and
  collections over ecosystem directories on every World, moved directories
  and guides into a collapsed fallback, and routed publication authors into
  their local followable profiles instead of raw external pages.
- Made prose optional when the native workflow is already grounded by a file,
  URL, project, or structured record, so media uploads, bookmarks, software
  issues, models, routes, and publications begin with the item itself instead
  of forcing users to manufacture a redundant description.
- Routed Worlds community and event creation into the existing full group and
  event workflows instead of maintaining thinner ActivityPub-shaped duplicate
  forms, preserving privacy, membership, moderation, organizer, venue, RSVP,
  and participation controls.
- Made native-object success actions open the local object without a page
  reload and name the created recording, article, photograph, review, issue,
  model, listing, route, or other item instead of calling everything a post.
- Reworked the remaining schema-shaped Worlds interactions around native user
  tasks: BookWyrm shelves now recommend the next reading step, NeoDB activity
  uses category-aware list and five-star controls, and ValueFlows coordination
  begins with `I can help` or `I need help` before asking for logistics.
- Removed the generic Games object composer in favor of the working Castling
  challenge, arbiter, board, and move workflow, and made ForgeFed issue filing
  begin from a selected project instead of an unscoped ticket form.
- Kept selected BookWyrm editions and NeoDB catalog items fixed as the subject
  of their post so users cannot accidentally rewrite provider-owned catalog
  identity while reviewing or tracking it.
- Completed a 140-route live page audit across public, authenticated, admin,
  and every Worlds-family destination, with all audited pages returning 200
  and no page response slower than 400 ms.
- Reworked focused Worlds creation pages so they open directly into the
  relevant human workflow instead of exposing every native-object template,
  and made the Books workflow combine shelves and reading progress with
  BookWyrm-style Review, Comment, and Quote actions.
- Completed an authenticated 96-route compatibility audit across timelines,
  all World families, lists, bookmarks, feeds, groups, settings, developer
  tools, and admin pages after the latest backend federation changes.
- Reworked route creation around Wanderer's route-first workflow: users upload
  GPX, FIT, TCX, or KML data before adding human details, safe browser-side
  parsing prefills distance, elevation, timing, and title for text formats, and
  the form no longer asks users to calculate track metrics manually.
- Made the 3D-model world browse recently shared Manyfold models before a
  search is entered, removed misleading provider pagination, prioritized the
  local follow-and-discuss route, and changed model creation to ask for human
  creator, collection, license, and tag metadata after files are chosen rather
  than asking users to type file formats, versions, and scale metadata.
- Reworked marketplace creation around the native Flohmarkt seller workflow:
  sell, give away, or post a wanted listing with photos, description, price,
  currency, tags, and a privacy-bounded location instead of generic inventory
  and protocol fields.
- Unified empty-result actions across marketplace, coordination, trails,
  photographs, video, and publishing discovery through the same themed
  post-row state used by the rest of the Worlds interface.
- Started signed-in account verification alongside instance discovery instead
  of waiting for instance metadata first, and made locale chunk failures fall
  back to English rather than trapping users on the loading screen.
- Separated account and authentication Redux identities from their API
  implementations so reducers no longer depend on request modules, and moved
  account registration into the registration interface's lazy route.
- Made the main Worlds destination open as a normal unified post feed, with
  its activity directory available through a familiar Browse tab while focused
  world pages retain their Feed, Search, and Create workflow.
- Routed frontend schema imports through a tree-shakeable Zod facade containing
  only the constructors and types Unfathomably uses, keeping bundled locale and
  JSON-schema machinery out of the normal startup graph.
- Added idempotent lazy Redux reducer injection and moved account backups,
  aliases, hidden-domain lists, edit history, MFA state, and OAuth session
  tokens behind their route or modal boundaries instead of loading their
  actions and records during normal boot.
- Removed the duplicated sixteen-link Worlds catalog from the desktop More
  menu. Desktop and mobile now enter specialized activities through the same
  primary Worlds tab and its grouped workflow hub.
- Integrated Worlds into the shared desktop and mobile navigation state so
  focused world pages and the legacy federation route keep the Worlds tab
  active, while installations without federation no longer expose dead world
  links in the More menu.
- Made every federation family badge honor the configured primary palette in
  black mode instead of retaining light pastel and gray backgrounds.
- Rewrote the shared Worlds discovery and connection copy around familiar user
  actions such as browse, preview, follow, open, and play instead of exposing
  ActivityPub actor, object, cache, and resolver terminology.
- Brought group cards, group popovers, private-group states, capability chips,
  and the docked media player into the configured light, dark, and black theme
  variants, and replaced implementation-lineage bookmark copy with a direct
  user workflow description.
- Kept streaming handlers and interface audio assets out of the startup graph
  by separating shared chat action types and loading sound playback on demand.
- Kept optional Nostr relay, signer, bunker, and keyring code out of the
  ActivityPub-first startup graph by separating the shared Redux action type
  from the lazy Nostr implementation.
- Removed the global async-component registry from the blocking boot graph by
  loading the modal container through its own root-level lazy boundary.
- Loaded the authenticated account and frontend configuration concurrently so
  startup waits for one network round trip instead of two sequential requests.
- Made `/worlds` the canonical Worlds entry throughout navigation and native
  object workflows while retaining `/federation` as a compatible legacy route.
- Batched simultaneous status-backed World cards through the Mastodon bulk
  statuses endpoint, replacing per-card request and spinner cascades with one
  feed-style hydration pass, and completed black-theme alert badge coverage.
- Made the Games world load its federated games and challengers when opened,
  removing the extra load step while the backend cache keeps repeated visits
  quick and considerate of the remote service.
- Reduced initial frontend delivery by deferring the full native emoji catalogue
  until a reaction selector is opened and keeping Zod's CSP-safe setup inside
  the application boot boundary.
- Removed Nostr relay and signer readiness from the ActivityPub startup gate,
  and moved relay, bunker, and keyring initialization behind background feature
  boundaries so blocked WebSockets cannot hold the entire interface open.
- Narrowed ordinary streaming schema imports so notification, timeline, group,
  and source streams no longer load Nostr signature verification code.
- Split the World family guide and resolved-link card from the default Feed
  bundle so Search-only presentation code loads only when needed.
- Lazy-loaded specialized World search controls so default Feed visits no
  longer download catalog-search code until the Search tab is opened.
- Lazy-loaded specialized World creation forms so ordinary Feed and Search
  visits no longer download the full native-object composer.
- Moved Worlds navigation onto the normal React Router history flow, made its
  tabs sticky like the Home timeline, and split specialized discovery tools
  into family-specific lazy chunks so each World loads only the workflows it
  can actually use.
- Routed Nostr relay communication through the backend's same-site relay so
  browsers no longer open direct WebSockets to user-selected external relays.
- Kept Nostr-origin notes in the standard status-card workflow while adding
  compact relay provenance and making repost and quote actions explicitly
  describe how a user shares the note with their followers.
- Made the backend's native-family timeline selection authoritative for Worlds
  feeds, preventing sparse but valid PeerTube and other specialized statuses
  from being discarded by a second frontend-only classification pass.
- Standardized Worlds navigation, search, discovery help, empty states, and
  creation guidance around Soapbox's flat sections, compact controls, and
  ordinary timeline rhythm while keeping specialized tools available on
  request.
- Reorganized each focused World into top-level Feed, Search, and Create tabs,
  opening on the familiar post feed while keeping discovery and native
  publishing available as distinct workflows.
- Expanded standard status cards with compact optional native metadata for
  audio, publishing, development, marketplace, games, culture, and
  coordination, while flattening the presentation so posts remain visually
  ordinary Soapbox cards and absent fields consume no space.
- Refreshed the Yarn dependency resolutions to the newest releases permitted
  by the frontend's existing compatibility ranges.
- Separated admin, event, list, and chat Redux action identities from their API
  implementations, and emitted those dependency-free identities as one shared
  chunk so optional request code and extra startup requests are avoided while
  initializing the store.
- Reordered each focused World around its native object shape: local books,
  tracks, events, projects, models, videos, and their immediate actions now
  precede provider lookup and generic search controls.
- Made specialized discovery inventory visible when a World opens and enabled
  bounded initial browsing for every family, so focused pages lead with usable
  objects and communities instead of an empty search form.
- Kept the expanded More menu within the viewport on smaller desktop displays.
- Turned empty Routes, Markets, and Coordination discovery states into direct
  shared-link workflows, and made source-only native object results expose
  family-specific actions such as route maps and GPX downloads with defensive
  external URL validation.
- Reduced Worlds instruction density by making focused headers action-first,
  reducing the landing cards to their titles and hover descriptions, and
  moving the older local-cache and provider-specific diagnostic panels behind
  one optional “More discovery tools” disclosure.
- Added the FE-specific black-theme variants to every new Worlds surface,
  border, label, and action so configured black themes never inherit light
  gray cards or low-contrast light-theme text.
- Made every focused Worlds page enumerate the concrete objects it can find
  and the actions a user can take, then presented local discovery, exact-link
  resolution, and creation as an explicit three-step workflow.
- Reworded the empty Worlds state around searches, exact links, follows, and
  joins instead of asking users to reason about connected ecosystems.
- Rebuilt the Worlds landing page around plain-language user goals such as
  finding books, joining events, browsing classifieds, following projects, or
  offering help. Provider and instance inventory no longer substitutes for
  user workflow discovery.
- Kept native timelines, resolvers, local catalogs, create tools, and
  participation controls inside the selected workflow so users see only the
  controls relevant to the kind of object they chose.
- Made ValueFlows and mutual-aid terms navigable by exposing locally resolvable
  intent, resource, and place references, including terms received inside
  ActivityStreams collection envelopes.
- Expanded received ForgeFed presentation with assignment, resolution, and
  apply activity cards; named component, subproject, fork, assignee, milestone,
  team, author, committer, dependency, and affected-resource handoffs; and
  locally resolvable commit links.
- Completed the federated chess discovery workflow with local player and
  challenger resolution, canonical remote handles, readable game setup context,
  and reviewable actions for joining or leaving a Castling challenge board.
- Made alien-ecosystem directory cards hand off to the local resolver with
  workflow-specific actions for books, catalogues, models, listings, trails,
  projects, events, audio, video, streams, photographs, and coordination
  records; private guide-only workflows no longer show a misleading generic
  resolver action, and catalog links are validated before rendering.
- Separated Mobilizon and Gancio event details, external registration, online
  access, designated contacts, and local discussion actions, and made comment
  browsing open the stored event thread instead of a raw replies collection.
- Turned received Flohmarkt listing contact into a local, addressed direct
  message with safe listing context, while keeping availability, payment,
  delivery, and source-specific controls clearly attached to the original
  marketplace listing.
- Connected NeoDB reviewers, credit people, catalog records, reviews, and
  collections through local Worlds resolution, replaced raw collection-feed
  links with useful object handoffs, named external catalogs by host, and
  hardened cultural catalog URLs.
- Made reviewed and locally received Manyfold model, creator, and collection
  discovery paginatable beyond the first 18 actors without crawling model
  binaries, actor outboxes, or remote files.
- Added locally resolvable BookWyrm open-reading suggestion lists and entries,
  retained known reader display names, and hardened all reading-object links
  against non-HTTP and credential-bearing URLs.
- Made received Funkwhale audio explicitly playable in the persistent player
  without autoplay or prefetch, and connected its artist, album, track,
  library, publisher, and upload records to local Worlds resolution.
- Kept approved PeerTube channel links inside the Worlds resolver, corrected
  shared BookWyrm and Funkwhale workflow guidance, and repaired corrupted
  quotation marks in the local discovery explanation.
- Made PeerTube playlist cards retain bare-URL channel attribution, display
  their channel ordering, and navigate to the locally resolvable channel actor
  instead of an external-only profile.
- Corrected PeerTube playlist ordering labels to use the protocol's already
  one-based `videoChannelPosition` value without incrementing it again.
- Made ValueFlows and mutual-aid records paginatable, exposed active resources
  and processes during normal browsing, and connected known publishers,
  providers, and receivers to named local actor-resolution workflows.
- Connected Pixelfed-compatible gallery cards to locally resolvable,
  name-hydrated photographer profiles instead of reducing photographers to
  source domains and external-only links.
- Made Owncast live-directory results paginatable, tightened remote URL
  validation, and repaired corrupted lifecycle guidance while retaining
  explicit artwork loading and source-owned playback.
- Made PeerTube video and channel cards navigate the locally resolvable channel
  `Group` and its separate owner account, leading approved channel search with
  the local follow workflow while retaining a distinct source link and
  validating every returned remote URL.
- Turned received Funkwhale catalog objects into a browsable music workflow
  with distinct artist, album, library, and playlist presentations, useful
  relationship links, validated MusicBrainz handoffs, and honest source-owned
  access guidance for protected libraries.
- Made received Mobilizon and Gancio events organizer-aware and
  lifecycle-sensitive, with source attendance modes, anonymous participation,
  comment policy, discussions, venue maps, timezone context, and cancellation
  or tentative state in downloaded calendar records.
- Turned received ForgeFed data into navigable development workflows with
  paged mixed resources, issue and merge-request distinctions, origin-to-target
  context, diffs, patches, approvals, project components, subprojects,
  discussions, dependencies, patch trackers, repository moves, and clone
  endpoints.
- Made received Wanderer trails paginatable and author-aware, hardened remote
  trail and GPX links, corrected duration presentation, and distinguished the
  federated route-start pin from source-owned waypoints, comments, and summit
  logs.
- Improved marketplace cards with validated currency-definition links, locally
  known seller names and handles, and explicit source-owned negotiation and
  location privacy language.
- Made NeoDB activity cards present the federated cultural item itself with
  cover art, category/date, catalogue description, aggregate rating context,
  credits, tags, and external references without conflating those values with
  the reviewer's own rating or collection state.
- Made Manyfold discovery preserve named creator and collection navigation,
  clickable SPDX licence references, explicit commercial-term warnings, and
  an accurate source-side file handoff while tightening remote URL validation.
- Extended federated chess discovery with validated recent SAN moves,
  FEN-derived position counters, explicitly reported active, checkmate, or draw
  state, local move resolution for replies, and authoritative Castling PGN
  downloads.
- Replaced the generic coordination-object form with a guided ValueFlows offer
  and request workflow that explains resource flow, derives the local
  participant role automatically, and keeps replies as the discussion channel.
- Made ValueFlows and mutual-aid discovery browse active local records
  immediately, distinguish publisher/provider/receiver roles, render primary
  and reciprocal terms with lifecycle context, and direct users to confirm
  availability and agreement at the source.
- Expanded BookWyrm discovery cards with named Work/Edition context, authors,
  identifiers, format, pages, publishers, progress and quotation units,
  spoiler-aware review rendering, and meaningful named books inside shelves
  and lists.
- Aligned Worlds authoring with each instance's configured primary color scale
  and normal surface language instead of a fixed gradient or fork-specific
  colors. Reduced the nine object types to compact title selectors with hover
  descriptions, and reordered each workflow around its title and main content
  before optional metadata.
- Removed the generic canonical-link field because locally authored objects
  receive their permanent ActivityPub URL from the server. Hid lifecycle and
  provider details that the site already knows, inferred file formats from
  uploads, and added plain-language guidance to the remaining domain fields.

### Fixed
- Prevented intermittent sidebar navigation failures from flashing the generic
  Soapbox error screen by retrying transient route chunk fetches and keeping
  the normal loading presentation visible during one-time reload recovery.
- Restored route-level WebSocket filtering so live updates cannot bypass the
  same reply, media, account, tag, and native-world constraints as initial
  timeline requests.
- Aligned the Bluesky account workflow with the hardened backend by trimming
  pasted handles before authorization and accurately presenting native edit
  and delete synchronization.
- Preserved backend-provided canonical current and exact revision status IDs in
  normalized Worlds discovery results so ordinary local interaction links stay
  stable even when federation delivered duplicate Create envelopes.
- Fixed personal book libraries disappearing when Elixir returned valid naive
  ISO timestamps, made shelf-loading failures visible and retryable, and
  progressively rendered large libraries instead of mounting every book at
  once.
- Fixed the shared test renderer so rerender-based coverage exercises updated
  component state instead of silently retaining the initial child tree.
- Hardened tab measurement for browsers without `scrollIntoView`, touch swipe
  coordinate handling, and same-origin browser-link parsing so malformed plain
  text cannot be promoted into a local route.
- Restored the strict TypeScript gate by tightening credential-boundary mocks,
  separating current and legacy status action types, safely normalizing legacy
  local-reference maps, and explicitly mapping archive-import states.
- Hid the group composer when a remote group only permits moderators to post
  and presented the server-supplied restriction instead of allowing a doomed
  submission.
- Prevented quote actions from replacing the active edit composer, stopped
  update requests from carrying create-only quote targets, and allowed
  intentionally bodyless polls and quotes to be submitted.
- Matched the current status renderer to the legacy quote fallback by showing a
  validated external quote link when structured metadata exists but the quoted
  status has not been hydrated locally.
- Made photograph discovery action metadata fail closed, while distinguishing
  an explicit remote restriction from capability support that will be checked
  when the photograph is opened locally.
- Kept search pagination bound to the original query, account, result type,
  remote-resolution mode, and short-video filter, and cleared stale cursors
  before a replacement search can be continued.
- Disabled reply, quote, repost, like, dislike, and reaction controls when the
  target account is blocked by local federation policy, matching the backend's
  pre-creation enforcement instead of presenting actions that cannot succeed.
- Fixed shared navigation tabs so long or numerous labels scroll horizontally
  instead of shrinking or becoming partly hidden, and selected tabs reveal
  themselves while the animated indicator follows scrolling and resizing.
- Preserved GPX, TCX, and KML segment boundaries while deriving route distance
  and elevation, accepted namespace-prefixed route XML, and normalized route
  upload media types instead of trusting browser file guesses.
- Made every paged Worlds discovery workflow recover to its first page when a
  stale offset returns an empty result or request failure, while preserving
  normal first-page error reporting.
- Updated the followed-hashtags collection immediately after successful follow
  and unfollow actions, without waiting for a page reload or redundant fetch.
- Stopped hidden, suspended, and deactivated profiles from requesting or
  displaying familiar-follower information.
- Prevented concealed sensitive videos from preloading media or requesting
  remote poster images before the viewer explicitly reveals the content.
- Preserved scheduled quote targets when loading scheduled posts and rendered
  the quoted post through the normal status presentation, including on-demand
  loading when the target is not already in local frontend state.
- Cleared stale quote state when the composer switches to a normal or event
  reply, preventing an intended reply from retaining an earlier quote target.
- Kept admin reports usable after the reporter or reported account has been
  deleted by showing the preserved ActivityPub identity and suppressing links
  and moderation actions that require a live account.
- Concealed quoted posts from blocked domains, blocked accounts, and muted
  accounts by default while retaining an explicit show-anyway action.
- Routed explicitly tagged Group mentions to native group pages while preserving
  ordinary account mention behavior.
- Preserved an existing composer content warning when adding a quote, and
  inherited the quoted post's warning only when the composer had none.
- Kept the default-post-privacy selector synchronized with asynchronously
  loaded account settings so its displayed choice cannot drift from the
  privacy the composer will actually use.
- Restored a clear, theme-colored keyboard focus outline for ordinary buttons
  so controls remain visible when platform-specific styles or resets remove the
  browser default.
- Fixed link preview cards behind content warnings so they remain concealed
  initially and appear when the user expands the warning in timeline,
  detailed-status, and specialized world-item presentations.
- Fixed multi-factor enrollment so opening security settings cannot silently
  regenerate an enabled account's recovery codes, settings failures do not
  expose a false setup state, and new one-time codes remain visible after TOTP
  confirmation until the user acknowledges saving them.
- Preserved each post's existing quote permission when opening it for editing
  instead of submitting the composer's default policy.
- Allowed the composer to upload multiple files from one clipboard paste
  instead of silently ignoring paste events containing more than one file.
- Normalized ActivityPub mention links before matching them to account data,
  so browser-added trailing slashes no longer turn valid mentions into generic
  external links in statuses or announcements.
- Classified bounded JSON-LD `type` arrays consistently with the backend,
  preferring specialized BookWyrm, ForgeFed, ValueFlows, mutual-aid, and other
  native object families over generic ActivityStreams fallback types.
- Treated remote polls as expired when their advertised expiry has passed,
  hiding stale voting controls while a delayed closing federation Update is
  still pending.
- Kept remote quotes useful while their originals hydrate asynchronously by
  showing a theme-aware link to the canonical quoted post, without leaking the
  URL when backend visibility rules mark the quote unavailable.
- Applied PeerTube's recent presentation lesson by hiding stale scheduled-live
  labels after their timestamp has passed and formatting future schedules in
  the viewer's locale.
- Added a native accepted-answer workflow to ordinary post menus and status
  presentation, allowing thread authors and group moderators to select or
  clear answers without leaving the conversation interface.
- Fixed media lightbox navigation in right-to-left locales so previous/next
  controls, arrow keys, icons, and swipe gestures share the same logical order.
- Fixed pending follow-request cancellation so it asks for the correct action,
  clears requested state immediately, preserves follower counts, restores the
  pending state on failure, and reconciles with the server relationship.
- Prevented Enter from sending a chat message while an input method editor is
  still composing text.
- Resolved parent accounts for replies that omit explicit Mention tags, as
  Minds commonly does, so status cards identify who a response is replying to
  without treating carbon-copy delivery recipients as human-visible mentions.
- Restored threaded conversations on individual group pages by requesting the
  backend's reply-inclusive group timeline, ranking active conversations by
  recency, and rendering visible parents and replies with standard Soapbox
  status cards and thread connectors. The aggregate groups feed remains
  roots-only.
- Completed native Nostr group presentation with resolved owner cards, real
  post counts, public member directories, compact internal NIP-21 links, and an
  owner-avatar fallback when an upstream group image has expired; compact
  timeline group cards can no longer erase hydrated owner and post-count data
  from the shared entity cache.
- Preserved complete `note` and `nevent` identifiers while opening posts so the
  backend can use their signed author and approved relay hints instead of
  treating a Nostr event hash as a missing Mastodon status ID.
- Displayed server-validated Nostr profile metadata through ordinary account
  fields and made the profile menu copy a relay-aware `nprofile` when one is
  available, with the familiar `npub` retained as a fallback.
- Allowed long unbroken group-description addresses and URLs to wrap within the
  standard header instead of widening or visually corrupting the page.
- Fixed populated feeds below long group or profile headers appearing blank
  until a manual scroll by seeding the first row in window-scrolling virtual
  lists.
- Stopped signed-out group pages from making an authenticated empty personal
  group query and showing a misleading invalid-credentials warning.
- Marked signed-out login username and password fields for password-manager autofill so
  public group pages no longer produce Chromium autocomplete warnings.
- Enriched native Nostr community pages with their relay identity and
  authoritative moderator details while preserving the standard Soapbox group
  header and interaction workflow.
- Deferred optional remote catalogue requests until a user opens `More ways to
  find things`, improving Worlds privacy, provider courtesy, and initial page
  responsiveness while keeping the local finder immediately available.
- Stopped empty primary World finders from automatically loading provider
  recommendations; browsing without a query now requires the user to press
  Search explicitly.
- Made the Games participation tab explicit about its Castling-owned challenge
  workflow, and kept the opponent finder visible while provider availability
  is checked instead of presenting a control-free loading page.
- Reworked every Worlds finder around novice user stories: each Search tab now
  begins with one visible, family-specific task using ordinary words, while
  ecosystem-specific catalogues and exact-link tools remain optional deeper
  paths instead of hiding the primary workflow.
- Expanded the read-only Worlds Chromium audit into a user-story acceptance
  run covering Feed, Find, and Create for all 16 families, with strict checks
  for missing controls, visible failures, console warnings, browser exceptions,
  same-origin HTTP failures, and websocket errors without publishing,
  following, reacting, joining, or contacting anyone.
- Replaced fixed lazy-load snapshots in the Worlds audit with bounded readiness
  checks, preventing slow chunks from being mistaken for missing user workflows.
- Correlated browser network failures with their requested URLs so a failed
  world audit identifies the affected resource instead of an opaque Chromium
  request identifier.
- Added focused family selection and Chromium blocked-reason reporting to the
  Worlds audit so a failing ecosystem can be diagnosed without repeating
  unrelated read-only routes.
- Added an explicit media-inclusive mode to the live Chromium page audit so
  operators can expose same-origin media-proxy failures instead of always
  suppressing remote-media traffic during deterministic route checks.
- Aligned Worlds creation with the backend's native contracts: software issues
  now visibly belong to a project, and route and publication workflows start
  with the required route or document file instead of accepting forms that the
  server must reject later.
- Completed the remaining Worlds authoring paths: Games now exposes the native
  Castling challenge workflow, direct Event and Group create links open their
  established modals, Culture can select federated NeoDB catalogue records,
  optional resource notes no longer block publishing, and structured fields
  expose accessible names.
- Stopped narrow or legacy OAuth tokens from issuing admin badge requests on
  every page, required an admin-capable token before entering admin routes,
  and made denied admin rule and announcement responses render safely.
- Redirected the optional Domains admin route to the dashboard when its
  backend API is unavailable instead of leaving a dead client route.
- Stopped authenticated page audits from granting every operator-supplied
  token a synthetic admin scope; admin route coverage now requires explicit
  `UNFATHOMABLY_AUDIT_SCOPES` matching the token being exercised.
- Added a dependency-free Chromium page-audit command that exercises every
  concrete public, account, settings, group, feed, Worlds, developer, and admin
  route, reports frontend exceptions and same-origin HTTP failures, and can use
  an operator-supplied token for authenticated coverage without printing it.
- Reworked Worlds Search around each ecosystem's native starting point: books,
  cultural works, audio catalogs, 3D models, and game catalogs now appear
  before generic post/profile lookup, Games mounts its previously unreachable
  catalog search, and Create tabs use task verbs such as `Plan event`, `List
  item`, and `Book activity` instead of a universal protocol-shaped `Create`.
- Allowed NeoDB-style list and rating actions to stand on their own after a
  cultural item is selected, instead of silently requiring an unnecessary
  written review despite presenting review text as optional.
- Rendered received NeoDB collection states as ordinary actions such as
  `Want to try`, `In progress`, and `Finished` instead of exposing raw
  protocol field names in cultural activity cards.
- Limited staff pending-registration checks and the approval waitlist to local
  signups, avoiding repeated full remote-actor scans on every staff page load.
- Kept failed media loads behind the backend media proxy instead of retrying
  raw third-party attachment URLs, preventing remote-image privacy leaks and
  Content-Security-Policy errors across timelines, Worlds feeds, galleries,
  and media modals.
- Added BookWyrm-style content warnings to reviews, comments, and quotations,
  including draft persistence and normal sensitive-post rendering after
  publication.
- Fixed post-quote timelines so routed status IDs reach their API requests
  instead of producing `/statuses/undefined/quotes`, and strengthened the live
  page auditor around slow route chunks, Windows browser cleanup, and
  nonessential proxy-media loading that could throttle remote peers.
- Fixed profile pinned-post routes so they consume the username supplied by
  the shared route wrapper instead of crashing while reading an undefined
  direct router parameter.
- Made the Communities world use a bounded public forum/community discovery
  timeline rather than the signed-in user's followed-groups feed, and allowed
  public post cards to receive neutral group relationship state without
  console errors.
- Stopped public pages from requesting authenticated account suggestions before
  login state is available, eliminating repeated 403 resource errors from
  Worlds and other anonymous routes.
- Reworked Culture creation around the native NeoDB workflow: users choose a
  real catalog item and then track, rate, or review it without re-entering
  provider-owned credits, dates, and language metadata.
- Reworked Books around the native social-reading workflow: personal shelves
  now lead the page, book cards expose Want to read, Reading, Read, progress,
  and Review directly, and received reviews remain ordinary interactive post
  cards rather than a parallel catalogue UI.
- Distinguished actionable federated BookWyrm editions from metadata-only Open
  Library matches, preventing catalogue HTML pages from being submitted as
  ActivityPub review targets while still allowing metadata to seed a draft.
- Preserved action-only book drafts when a reader chooses Want to read,
  Reading, Read, or Did not finish before selecting a catalog title, so the
  guided workflow survives navigation and refreshes consistently.
- Replaced schema-first Worlds authoring with guided native workflows for the
  first major families: books now begin with a catalog match and a reading or
  review action, file-backed media and 3D models reveal metadata only after the
  resource is ready, and classifieds lead with offer/request intent, photos,
  and an optional privacy-rounded nearby-market area instead of raw connector
  and coordinate fields.
- Re-audited every static application route and the authenticated page API
  contract after the Worlds and native-Nostr work, confirming that unsupported
  Ditto-only administration screens remain capability-gated and that empty
  native feeds do not fall through to unrelated ordinary statuses.
- Fixed Worlds infinite scrolling so every page retains its native-only family
  and search filters instead of following pagination links with empty enum
  values or falling through to unrelated public posts.
- Fixed native sharing and copy-link actions for projected statuses by using
  local permalinks for Nostr posts, canonical article links for RSS posts, and
  a copy fallback when the browser share service rejects the request.
- Fixed the full-screen attachment carousel so multi-image posts display one
  full-width image at a time and arrow or swipe navigation advances by exactly
  one image instead of squeezing every attachment into one row or translating
  into an empty black viewport.
- Removed Zod's optional JavaScript JIT capability probe from production
  bundles, including the Zod copy embedded by Nostrify, so strict CSP pages no
  longer report blocked `eval` attempts without enabling `unsafe-eval`.
- Restored family-specific Worlds routes by consuming the route parameters
  supplied by the shared page wrapper, preventing Books, Audio, Marketplace,
  Models, Software, and other native workflows from collapsing into the
  generic feed after nested layout navigation.
- Refreshed supported frontend dependencies, kept TypeScript on the newest
  release officially supported by typescript-eslint, and restored a clean
  zero-warning strict lint baseline across federation and core UI surfaces.
- Prevented overlapping streaming reconnect loops by leaving ordinary
  WebSocket close recovery to the transport's bounded exponential backoff,
  while retaining explicit reconnects for browser lifecycle and health events.
- Fixed first-navigation communication failures after frontend deployments by
  recovering once from stale lazy chunks and retaining prior hashed assets,
  made entity-list invalidation trigger real refetches, gave Bookmarks
  deterministic empty/error/retry states.
- Prevented incomplete account settings from overwriting server preferences
  during startup, retained the last confirmed theme for hydration fallback,
  and kept the selected black theme stable across frontend reloads.
- Moved the notification grouping control into the filter tab row so it no
  longer appears as a detached, misaligned second header.
- Unified desktop and mobile navigation around the same primary destination
  order, removed a hard-coded mobile scrollbar color that conflicted with
  configured themes, improved the mobile menu control's keyboard and screen
  reader behavior, and consistently named the Worlds surface.
- Made installed-app identity follow backend instance branding by linking the
  runtime `/manifest.json` and disabling the conflicting build-time frontend
  manifest while retaining the generated service worker.
- Polished the central Worlds creator with accessible template focus states,
  Soapbox checkboxes that retain field guidance, and readable marketplace
  delivery copy.
- Aligned the chess challenge workflow with Soapbox input and button
  primitives while preserving composer review, arbiter discovery, and the
  compound challenge-and-view controls.
- Rebuilt the shared exact-link opener, primary Worlds search, Mobilizon
  search, and playlist search with Soapbox input and button primitives while
  retaining URL validation, sign-in behavior, mode selection, and blank browse.
- Unified coordination, ForgeFed, NeoDB activity, received-model, and route
  searches with shared Soapbox controls, while retaining safety guidance,
  create actions, clear actions, and minimum-query rules.
- Removed connector provider hostnames from trail discovery, where they exposed
  implementation detail rather than helping users choose a route.
- Unified cultural catalogue, social reading, music catalogue, received-audio,
  and received-video search entry with shared Soapbox controls while retaining
  category filters, browse-latest reset, and provider-specific query rules.
- Completed the standard Worlds pagination migration across native directory
  results, audio catalogues, model search, PeerTube channels, Owncast,
  Mobilizon, and NeoDB activity.
- Extended shared Worlds pagination to coordination records, ForgeFed
  resources, received 3D models, trails, and video playlists while preserving
  useful range labels on software and route result grids.
- Extended shared Worlds pagination to cultural catalogues, social reading,
  music catalogues, received audio, and received video, including an inset
  mode for already-padded media panels.
- Added a shared Soapbox-styled pagination row for Worlds discovery and
  migrated event, marketplace, photo, and publishing results to consistent
  loading, disabled, spacing, and mobile tap-target behavior.
- Migrated photo, publishing, and Owncast discovery to the shared responsive
  Worlds search controls while preserving Owncast's deliberate artwork-loading
  privacy choice as a standard secondary action.
- Unified event discovery and its clear-search action with the shared Worlds
  search controls, and removed connector hostnames from event cards where the
  organizer and source actions already provide meaningful origin context.
- Brought marketplace discovery into the shared Worlds search workflow and
  removed provider hostnames that exposed connector internals instead of
  helping users find listings.
- Consolidated straightforward Worlds search headings, descriptions, borders,
  spacing, and forms into one Soapbox-styled section shared by video, audio,
  model, software-project, and PeerTube-channel discovery.
- Unified video, audio, model, software-project, and PeerTube-channel searches
  behind one responsive Soapbox-styled form, removing per-World differences in
  input theming, focus behavior, submit buttons, and narrow-screen layout.
- Aligned empty, error, and retry rows across every Worlds discovery workflow
  with Soapbox's shared typography and button primitives, removing another
  bespoke visual seam from specialized federation pages.
- Applied the configured instance theme through a preloaded, immutable asset
  before the application bundle starts, preventing a light browser-canvas
  flash on dark and black installations without a recurring validation request.
- Kept the FormatJS plural-rules compatibility bundle out of modern browsers'
  startup graph by loading it before React only when the native
  `Intl.PluralRules` API is absent, while retaining the service worker's
  independent compatibility path.
- Unified the pre-React and in-app loading experience around a correctly
  centered, accessible full-screen state that follows the configured theme and
  primary palette instead of flashing a hard-coded gray/black loader.
- Kept ordinary ActivityPub sessions server-mediated by loading the Nostr relay
  client and opening its same-site WebSocket only when a Nostr login, relay,
  or signer workflow actually needs it.
- Integrated Nostr provenance into the normal account and timestamp metadata
  line instead of inserting a separate platform row between post text and
  media.
- Made locally resolvable Worlds search results lead into the normal
  Unfathomably viewing workflow, while keeping the original remote page as a
  clearly secondary source link.
- Reused the normal Soapbox status placeholder while World searches and
  status-backed native results hydrate, removing the bespoke spinner and
  skeleton seam between specialized discovery and ordinary feeds.
- Made Worlds searches survive refresh and browser history through shareable
  query URLs, cleaned resolver and composer state when changing workflow tabs,
  and localized the shared post-publication actions.
- Aligned specialized status-card contact, discussion, and review actions with
  the configured black theme instead of allowing light fallback controls to
  break the surrounding Soapbox visual language.
- Made Worlds search behavior deterministic across every specialized family by
  honoring browse-on-open policies, rejecting accidental one-character scans,
  and preventing slower stale requests from replacing newer search results.
- Reduced oversized Worlds timeline pages to the standard incremental feed
  size, improving first paint and rich-media response cost while preserving
  the existing infinite-scroll workflow.
- Replaced protocol-shaped native discovery copy such as "resolve ActivityPub
  object" with direct user actions including open, follow, listen, watch, and
  clone, while keeping the same deliberate no-background-fetch behavior.
- Kept specialized ActivityPub facts inside the standard status-card language
  by showing a compact four-field summary first and progressively revealing
  larger native vocabularies on request.
- Made link and media previews honor configured black and primary-color themes,
  added accessible media/source actions and useful provider fallbacks, and
  simplified standalone native item cards so they read like part of Soapbox
  rather than a separate technical metadata interface.
- Integrated Nostr provenance more quietly into standard status cards by
  replacing visible relay plumbing with a plain source label and moving the
  relay hostname into a tooltip that follows the configured color scheme.
- Turned empty World feeds into useful Search and Create entry points, replaced
  protocol-oriented resolver labels with user-facing language, and corrected a
  visible encoding defect in known-source guidance.
- Consolidated World URL searches into the primary search panel, removed a
  duplicate timeline query that counted results without rendering them, and
  preserved cached feed items when switching between Feed, Search, and Create.
- Simplified the shared World search hierarchy so ordinary search stays
  primary, specialist catalogs, practical tips, and exact-link opening remain
  clearly named secondary actions, and shell loading and errors use the same
  timeline states as the results they precede.
- Kept recently received audio and cultural activity visible across quick
  World tab changes by applying the same short query freshness window used by
  other local federation feeds.
- Added a consistent retry action to recoverable World search errors while
  preserving challenge-specific recovery, clear-search controls, and exact-link
  resolvers where those actions already carry more useful context.
- Routed the remaining received-data initial loads through the shared World
  status skeleton and kept populated music, cultural, and audio panels quiet
  during background refreshes.
- Unified World empty and error states with normal timeline-row styling and
  replaced provider, bridge, backend, and cache jargon with concise guidance
  that tells people what is empty, unavailable, or worth trying next.
- Replaced implementation-oriented World loading sentences across specialized
  discovery panels with a shared themed status-list skeleton and an
  accessible progress label.
- Extended configured black-theme surfaces across inherited announcements,
  domains, invites, relays, rules, and FASP provider management so the
  surrounding admin area remains visually consistent with federation tools.
- Aligned federation connector, queue, unreachable-host, and delivery-endpoint
  cards with the configured black theme, and corrected the connector loading
  label so admin federation tools no longer look detached from the main FE.
- Aligned shared World status extensions with the configured black theme so
  route maps, model resources, live-video details, lifecycle controls,
  metadata rows, source-item cards, pop-out controls, and generic platform
  badges no longer render as foreign light or gray widgets inside a themed
  timeline.
- Replaced the obsolete post-publication World issue route with the current
  tab router and kept internal success navigation inside the application
  instead of forcing full page reloads.
- Simplified catalogue-assisted World creation into a normal themed result
  list that collapses after selection, and removed redundant tutorial copy
  already expressed by the specialized form fields.
- Made World creation drafts account- and object-scoped, restored unfinished
  fields and uploaded media safely, cleared published drafts, and added an
  explicit clear action so specialized creation follows the normal composer
  lifecycle.
- Kept route-selected World creators synchronized when moving between object
  types, while preserving unfinished work for each type and making the type
  chooser fit narrow screens without hiding labels.
- Fixed Worlds tab navigation so switching back to Feed clears stale search and
  resolver parameters instead of silently retaining a filtered timeline, and
  synchronized resolver state when moving between World families.
- Mounted the Federation connectors and FASP provider pages through the outer
  application router so their existing Admin routes no longer fall through to
  the generic not-found page.
- Replaced the inherited Ditto username-request and review UI with automatic
  NIP-05 presentation of each user's existing local ActivityPub nickname,
  including identity settings, onboarding, profile editing, and composer
  notices.
- Refreshed an opened Nostr conversation after the backend completes its
  bounded on-demand ancestor and reply lookup, so normal status pages gain
  available thread context without permanent browser relay subscriptions.
- Displayed Nostr profiles through their NIP-01/NIP-24 names and verified
  NIP-05 address, with a NIP-19 `npub` fallback, instead of exposing internal
  mirror-account handles throughout standard account UI.
- Restored click-to-enlarge behavior for individual lightbox images while
  preserving multi-attachment navigation and touch pinch zoom, and made the
  download action consistently target the currently displayed attachment.
- Made Nostr relay startup fail open after a bounded connection attempt instead
  of holding the entire frontend loading screen when a relay is unavailable,
  and reset relay subscriptions cleanly when filters change.
- Connected the Groups world feed to the authenticated followed-groups
  timeline, so it shows posts from groups the user follows instead of querying
  the unrelated native object-family index.
- Kept audio and video pop-out controls above player layers, stopped their
  clicks from opening the surrounding status, and moved source-card actions
  below full-width media so the controls remain visible and clickable.
- Fixed published compose drafts returning after refresh by resetting from a
  clean composer template, removing the saved draft as soon as publication
  succeeds, ignoring legacy drafts stored under the reducer template, and
  propagating safe cross-tab clears. Added a themed Clear draft action that
  removes the current draft explicitly without deleting a newer different
  draft in another tab.
- Stopped focused Worlds timelines from serializing absent native-search
  parameters as blank query strings, preventing initial page loads from
  triggering `native_query` minimum-length API validation notices.
- Restored zero-warning frontend static checks by repairing native-federation
  type errors, safely handling unresolved route records, and extracting the
  Worlds navigation copy through static FormatJS descriptors.
- Fixed the FASP provider administration query to parse the Mastodon client
  response body instead of assuming a non-existent `data` property.
- Rendered status-backed results throughout every Worlds discovery surface with
  the standard Soapbox post component and normal local interactions, while keeping
  specialized cards only as fallbacks for source-only native records.
- Removed the provider and server catalogue from user-facing Worlds pages,
  restored exact-link and diagnostic tools to a collapsed secondary section,
  and made locally received native content the first workflow surface.
- Replaced bespoke gray Worlds cards and floating panel shells with configured
  primary surfaces and the flatter section language used by the rest of the FE.
- Clarified specialized creation requirements and replaced the generic
  post-publication promise with the actions actually available on each object.
- Kept Worlds empty states on a configured-primary surface in every color
  scheme and prevented long workflow action labels from shrinking into
  clipped text.
- Fixed the Worlds landing page and every focused `/worlds/:family` route so
  template selection cannot read the normalized family before initialization.
- Redirected unavailable group recommendation, tag, and pending-request paths
  to an available group workflow instead of interpreting their reserved names
  as remote group identifiers and issuing misleading 404 requests.
- Fixed black-theme presentation across every Worlds workflow, including shared
  search, empty-state, composer, guide, catalogue, marketplace, media, event,
  route, project, and coordination surfaces that previously retained light gray
  backgrounds or light-theme contrast after navigating to a focused page.
- Fixed Worlds community/source searches so direct names, handles, and URLs
  preserve the selected native family and always show structural family labels
  instead of falling back to the generic target catalog.
- Fixed Worlds family tabs so they classify presentations from explicit native
  family, verified platform, or ActivityPub object type rather than matching
  arbitrary text and hostnames such as `mastodon.games`, `mastodon.music`, or
  `mastodon.video`.
- Made the Worlds target-search placeholder localizable instead of leaving an
  English-only literal in the interface.
- Fixed the federation-connector admin form's shared event typing and replaced
  corrupted smart punctuation in its marketplace guidance.
- Fixed Worlds discovery pagination and loading state so malformed target rows
  are reported instead of masquerading as an empty result, filtered rows do
  not corrupt the server offset, and a new search does not flash a settled
  empty state before its first response arrives.
- Fixed Worlds family filters on narrow layouts by replacing the clipped,
  scrollbar-hidden single row with evenly spaced responsive button rows.
- Made the Worlds introduction explicitly dismissible and remembered that
  choice permanently in the current browser profile. Added a reusable
  dismissible-introduction component so other unfamiliar screens can provide
  first-visit guidance without repeatedly occupying page space.

### Security
- Bound OAuth headers and service-worker credentials to the configured backend
  origin, stripping authorization from object-storage, media-CDN, embed, and
  other cross-origin URLs even when a caller supplies an authorization header.
- Centralized browser-link resolution so same-origin absolute links use client
  routing, lookalike hosts remain external, and malformed, credential-bearing,
  or non-HTTP links from status markup, previews, and configured navigation are
  inert rather than trusted from string-prefix checks.
- Hardened rich preview iframes with lazy loading, referrer suppression, and a
  constrained sandbox that still permits pointer-lock interaction for native
  Manyfold and other 3D-model embeds.

## [3.4.0] - 2026-07-19

### Added
- Added a discoverable Federated Worlds timeline that scans public federation
  for rich native presentations and lets people browse books, software, 3D
  models, markets, games, routes, culture, coordination, and publishing using
  the existing interactive status cards.
- Added bounded native ActivityPub context cards and platform families for
  BookWyrm, ForgeFed, ActivityPods, Manyfold, Flohmarkt, Castling, Wanderer,
  NeoDB, Bonfire ValueFlows, Mutual Aid, ZenPub/CommonsPub, and related extension
  objects exposed by Unfathomably BE.
- Added a docked-player control to individual video and audio status attachments
  so PeerTube and other remote media can keep playing after navigation.

### Fixed
- Fixed the Federated Worlds empty state so an empty filtered timeline no
  longer requests pages forever, removed automatic and periodic scans, and
  added explicit-submit group/feed discovery that searches local cached actors
  before resolving a complete remote handle or URL.
- Classified XWiki actors and content as publishing resources when NodeInfo is
  unavailable.
- Added a manual Translate/Show original action when language detection hides
  the inline translation control.

## [3.3.1] - 2026-07-17

### Added
- Aligned the federation-health dashboard with Unfathomably BE's bounded
  per-inbox delivery histories, including endpoint status, failures, timing,
  backoff, redirect, gone, and probe-readiness details.
- Ported AdminFE's invite workflow into the maintained frontend dashboard,
  including bounded and expiring invite links, copyable registration URLs,
  email invitations, usage visibility, and confirmed revocation.

### Fixed
- Fixed filtered focused-status rendering so its column title is available
  before the filter notice is rendered, and localized all new quote-policy,
  approval, revocation, and failure UI text.
- Added complete quote-policy controls and quote authorization lifecycle UI,
  including per-post automatic/manual policy selection, disabled quote actions,
  pending and revoked state explanations, and quoted-author approval controls.
- Refreshed open thread context periodically and when the browser regains focus,
  while preventing overlapping refreshes and cancelling pending debounced
  pagination callbacks when a thread or media modal unmounts.
- Disabled touch carousel navigation while an image is pinch-zoomed, surfaced
  zoom state through the image loader, and corrected zoom touch-listener cleanup.
- Replaced the modal overflow toggle with an iOS-safe, position-preserving page
  scroll lock that restores the exact prior body styles and scroll offset.
- Applied centralized content-filter results consistently to focused threads,
  quoted posts, reposted-status ownership checks, and filter-disabled states.
- Made custom frontend notifications explicit screen-reader live announcements,
  using assertive delivery for errors and polite delivery for other updates.
- Completed and corrected the administration workflow by restoring dashboard
  links to theme, ActivityPub relay, and backend-maintenance tools; fixing
  relay follow/unfollow routes and validation; and making standalone AdminFE
  and the maintained operations dashboard link back to each other.
- Corrected the admin dashboard's monthly-active metric label, fixed CSV email
  list exports to read text instead of JSON, surfaced export and relay errors,
  and released temporary download URLs after use.
- Kept replies, including reposted replies, out of the followed Groups and
  Feeds aggregate timeline caches so internal navigation matches direct URL
  entry.

## [3.3.0] - 2026-07-08

### Security
- Refreshed the frontend package set to current audited releases across the
  build, lint, test, React, Vite, and Workbox toolchain.
- Added package resolutions for advisory-sensitive build-time dependencies so the frontend uses current esbuild, glob, and source-map packages while upstream Vite and Workbox tooling catches up.

### Changed
- Improved global search so remote handle and URL-shaped queries prioritize
  account lookup, and ordinary searches surface matching groups and feeds
  alongside posts and accounts.
- Added combined group/feed discovery search to the group discovery surface, so
  remote groups, forums, feeds, blogs, libraries, and channel actors can appear
  in one ranked result list.
- Modernized the ESLint flat-config bridge so the current JSDoc plugin loads
  natively while preserving the existing public UI component documentation rule.
- Centralized Vite/Rolldown warning handling for the main app and service-worker
  builds, keeping known dependency metadata warnings quiet while preserving
  warnings-as-errors behavior for new build warnings.
- Regenerated the default English locale catalog after the dependency and
  tooling refresh.
- Made Pleroma/Rebased list emojis usable from the frontend by preserving list emoji metadata, showing list emojis in list pickers, and sending emoji values from list create/edit forms.
- Refreshed release metadata for the latest deployed static build paired with the verified Unfathomably BE federation matrix across Lemmy, PieFed, MBin, PeerTube, NodeBB, Discourse, Friendica, and Hubzilla.
- Added frontend regression coverage for Misskey quote-note and emoji-reaction
  fields as exposed by Unfathomably BE, keeping Misskey-specific federation
  support wired into the normalized status model.
- Added moderator-facing group notification controls so busy local groups can disable join and join-request notifications.
- Added moderator-facing group discovery controls so local groups can opt into or out of Lemmy-compatible public community discovery.
- Made the Feeds navigation default to the Feed Timeline, with a personal preference to choose either Feed Timeline or My Feeds as the default `/feeds` landing view.
- Added responsive feed-type filters with per-browser preferences and a hide-bots/services option on the Feeds page.
- Expanded the desktop layout so the post column has more room on 1080p and wider displays.
- Improved thread connector lines so replies show clearer parent/child continuity in post and threadiverse discussions.
- Clarified post archive import copy so users know imported posts restore local history without being republished and can reconnect replies to their original threads.
- Added a persistent floating media dock for playable source cards, while keeping Funkwhale and PeerTube media visible in each card by default.
- Improved Funkwhale and audio source cards with album, artist, license, MusicBrainz, bitrate, and file-size metadata when the backend provides it.
- Sources now load followed sources in smaller pages instead of waiting on one large all-at-once response.
- Renamed the Sources navigation surface to Feeds, with new `/feeds` routes and copy focused on RSS/Atom, blogs, libraries, podcasts, and channel-like actors.
- Documented the current release alignment with Unfathomably BE translation capability metadata and the deployed static frontend build.
- Improved stream recovery so visible tabs reconnect after unexpected websocket or event-stream disconnects and silent stalls without requiring refresh.
- Subscribed the Groups Feed and Feeds Feed to Unfathomably BE aggregate websocket streams, keeping HTTP timeline loading as the initial-load and fallback path.
- Added an in-progress translation spinner and duplicate-click guard while slower OpenTranslate requests complete.
- Documented release alignment with the backend PostgreSQL peer-statistics and
  large-table maintenance tuning; no frontend runtime changes were required for
  this database-side rollout.

### Fixed
- Fixed the inline translate button so remote statuses with a concrete detected
  source language outside the advertised provider list can still use the
  backend's `auto` source-language fallback.
- Rewrote translation action menu label selection without nested ternaries so
  the stricter refreshed ESLint rule set stays warning-free without changing
  translation behavior.
- Changed followed Groups and Feeds aggregate websocket subscriptions to use
  the query-style streaming endpoint as the compatibility path, avoiding
  fragile proxy handling of the new path-style aggregate routes.
- Stopped sending grouped notification keys to Pleroma's numeric
  `/api/v1/pleroma/notifications/read` endpoint and caught mark-read failures so
  notification rendering does not surface uncaught promise errors.
- Fixed a desktop layout regression that dropped the wider post-column class covered by the layout regression test.
- Hardened service-worker push notification formatting when notification targets arrive as string IDs instead of embedded account objects.
- Kept Mitra `.oga` attachments classified and tested as playable audio media.
- Fixed group follow notifications so they say someone followed or requested to join the group, rather than saying they followed the group owner personally.
- Changed ordinary My Feeds searches to filter followed feeds locally through the followed-scope API, while keeping URL and full-handle lookups on the broader feed discovery endpoint.
- Added media fallback handling so images, GIFs, video, and audio try the original remote URL when the backend media proxy URL fails to load.
- Fixed remote group pages so WordPress-style actor outbox previews render as a normal page section when the local group timeline has not cached posts yet.
- Polished Feeds filter counts and checkbox contrast so the new controls read cleanly on the site theme.
- Fixed shared input, select, textarea, checkbox, and file controls so unlabeled form fields still receive stable DOM ids.
- Fixed copyable settings inputs so their generated form labels point at the real input element.
- Fixed the settings theme selector so its list label points at the rendered select element.
- Fixed bookmark and group/source search fields to expose useful form names for browser autofill and diagnostics.
- Fixed profile media panels to render cached media immediately and avoid forced reload spinners when revisiting an account.
- Added regression coverage for unknown-language translation flows where the backend advertises provider-side source-language detection.

## [3.2.1] - 2026-06-25

### Added
- Unfathomably FE branding, package metadata, GitHub repository links, and release documentation.
- Frontend installation notes that point operators to the complete source install guide in Unfathomably BE.
- Frontend upgrade notes that point operators to the rehearsed backend-owned upgrade guide.
- Dedicated Groups and Sources navigation for remote actors that are not ordinary profile timelines.
- Group Feed tab showing root posts from followed groups.
- Source Feed tab showing root posts from followed sources.
- Native group/source preview components with schema coverage and interaction-aware rendering.
- Grouped notification handling for Unfathomably/Rebased-compatible notification APIs, including importer and reducer coverage.
- Translation controls that use backend capability metadata and can fall back to provider-side source-language detection.
- Admin federation health page showing remote instance reachability, outgoing federation queue state, and unreachable host samples.
- Websocket stream reconnection coverage and stream behavior tests.
- Post archive export and import controls in data settings, using ActivityPub archive ZIPs and backend review policy metadata.
- Importer regression tests for settings and account-data import paths.
- Hashtags: let users follow hashtags (Mastodon, Akkoma).
- Posts: Support posts filtering on recent Mastodon versions
- Reactions: Support custom emoji reactions
- Compatibility: Support Mastodon v2 timeline filters.
- Compatibility: Preliminary support for Ditto backend.
- Compatibility: Support Firefish.
- Posts: Support dislikes on Friendica.
- UI: added a character counter to some textareas.
- UI: added new experience for viewing Media
- Hotkeys: Added `/` as a hotkey for search field.

### Changed
- Updated default logos to use the configured site logo rather than a fixed project mark.
- Refined source display toward collapsed source listings with expandable previews.
- Improved group preview item rendering so remote posts can use normal status-card interaction affordances where supported.
- Improved source preview rendering so source posts can use normal status-card affordances where replies, likes, shares, or navigation are supported by the backend.
- Posts: truncate Nostr pubkeys in reply mentions.
- Posts: upgraded emoji picker component.
- Posts: improved design of threads.
- UI: unified design of "approve" and "reject" buttons in follow requests and waitlist.
- UI: added sticky column header.
- UI: add specific zones the user can drag-and-drop files.
- UI: disable toast notifications for API errors.
- Chats: Display year for older messages creation date.

### Fixed
- Fixed reply composer feature detection so compatible backends keep recipients out of the visible reply text.
- Fixed frontend backend detection so Unfathomably BE inherits the expected Rebased and Pleroma API-family capabilities.
- Improved mobile connection recovery by retrying transient browser fetch failures and reconnecting streams after mobile page restores.
- Fixed deep frontend routes that could fail on refresh instead of falling back to the SPA entry point.
- Fixed source preview card behavior and tests for remote source items.
- Fixed group preview item behavior and tests for remote group posts.
- Fixed translation button visibility and failed-translation behavior for posts where backend language metadata or provider source-language selection is incomplete.
- Fixed remote group/source posts with closed comments so the reply button is disabled instead of opening a compose box that cannot succeed.
- Fixed stale composer drafts so sent posts clear saved text while unsent drafts can still be discarded.
- Fixed browser-console issues around duplicate form IDs and unlabeled fields where the frontend owned the markup.
- Fixed virtualized lists so empty conditional rows do not trigger React Virtuoso zero-sized element warnings.
- Fixed dashboard report navigation losing admin affordances after a forbidden response.
- Posts: fixed emojis being cut off in reactions modal.
- Posts: fix audio player progress bar visibility.
- Posts: fix audio player avatar aspect ratio for non-square avatars.
- Posts: added missing gap in pending status.
- Compatibility: fixed quote posting compatibility with custom Pleroma forks.
- Profile: fix "load more" button height on account gallery page.
- 18n: fixed Chinese language being detected from the browser.
- Conversations: fixed pagination (Mastodon).
- Compatibility: fix version parsing for Friendica.
- UI: fixed various overflow issues related to long usernames.
- UI: fixed display of Markdown code blocks in the reply indicator.
- Auth: fixed too many API requests when the server has an error.
- Auth: Don't display "username or e-mail" if username is not allowed.

## [3.2.0] - 2023-02-15

### Added
- Admin: redirect the homepage to any URL.
- Compatibility: added compatibility with Friendica.
- Posts: bot badge on statuses from bot accounts.
- Compatibility: improved browser support for older browsers.
- Events: allow to repost events in event menu.
- Profile: Add RSS link to user profiles.
- Reactions: adds support for reacting to chat messages.
- Groups: initial support for groups.
- Profile: add RSS link to user profiles.
- Chats: reset chat message field height after sending a message.
- Admin: allow to manage announcements.

### Changed
- Chats: improved display of media attachments.
- ServiceWorker: switch to a network-first strategy. The "An update is available!" prompt goes away.
- Posts: increased font size of focused status in threads.
- Posts: let "mute conversation" be clicked from any feed, not just noficiations.
- Posts: display all emoji reactions.
- Reactions: improved UI of reactions on statuses.
- Profile: make verified badge more prominent, overlapping with avatar.

### Fixed
- Admin: fixed hover card in reports modal shows reporter not reportee
- Chats: media attachments rendering at the wrong size and/or causing the chat to scroll on load.
- Chats: don't display "copy" button for messages without text.
- Posts: don't have to click the play button twice for embedded videos.
- index.html: remove `referrer` meta tag so it doesn't conflict with backend's `Referrer-Policy` header.
- Modals: fix media modal automatically switching to video.
- Navigation: profile dropdown erratic behavior.
- Posts: fix posts filtering.

### Removed
- Admin: single user mode. Now the homepage can be redirected to any URL.

## [3.1.0] - 2023-01-13

### Added
- Compatibility: rudimentary support for Takahē.
- UI: added backdrop blur behind modals.
- Admin: let admins configure media preview for attachment thumbnails.
- Login: accept `?server` param in external login, eg `/login/external?server=example.com`.
- Backups: restored Pleroma backups functionality.
- Export: restored "Export data" to CSV.

### Changed
- Posts: letterbox images to 19:6 again.
- Status Info: moved context (repost, pinned) to improve UX.
- Posts: remove file icon from empty link previews.
- Settings: moved "Import data" under settings.
- Composer: add more descriptive discard confirmation message.

### Fixed
- Layout: use accent color for "floating action button" (mobile compose button).
- ServiceWorker: don't serve favicon, robots.txt, and others from ServiceWorker.
- Datepicker: correctly default to the current year.
- Scheduled posts: fix page crashing on deleting a scheduled post.
- Events: don't crash when searching for a location.
- Search: fixes an abort error when using the navbar search component.
- Posts: fix monospace font in Markdown code blocks.
- Modals: fix action buttons overflow
- Editing: don't insert edited posts to the top of the feed.
- Editing: don't display edited posts as pending posts.
- Modals: close modal when navigating to a different page.
- Modals: fix "View context" button in media modal.
- Posts: let unauthenticated users to translate posts if allowed by backend.
- Chats: fix jumpy scrollbar.
- Composer: fix alignment of icon in submit button.
- Login: add a border around QR codes.
- Composer: don't display action button in reply indicator.

## [3.0.0] - 2022-12-25

### Added
- Editing: ability to edit posts and view edit history (on Rebased, Pleroma, and Mastodon).
- Events: ability to create, view, and comment on Events (on Rebased).
- Onboarding: display an introduction wizard to newly registered accounts.
- Posts: translate foreign language posts into your native language (on Rebased, Mastodon; if configured by the admin).
- Posts: ability to view quotes of a post (on Rebased).
- Posts: hover the "replying to" line to see a preview card of the parent post.
- Chats: ability to leave a chat (on Rebased, Truth Social).
- Chats: ability to disable chats for yourself.
- Layout: added right-to-left support for Arabic, Hebrew, Persian, and Central Kurdish languages.
- Composer: support custom emoji categories.
- Search: ability to search posts from a specific account (on Pleroma, Rebased).
- Theme: auto-detect system theme by default.
- Profile: remove a specific user from your followers (on Rebased, Mastodon).
- Suggestions: ability to view all suggested profiles.
- Feeds: display suggested accounts in Home feed (optional by admin).
- Compatibility: added compatibility with Truth Social, Fedibird, Pixelfed, Akkoma, and Glitch.
- Developers: added Test feed, Service Worker debugger, and Network Error preview.
- Reports: display server rules in reports. Let users select rule violations when submitting a report.
- Admin: added Theme Editor, a GUI for customizing the color scheme.
- Admin: custom badges. Admins can add non-federating badges to any user's profile (on Rebased, Pleroma).
- Admin: consolidated user dropdown actions (verify/suggest/etc) into a unified "Moderate User" modal.
- i18n: updated translations for Italian, Polish, Arabic, Hebrew, and German.
- Toast: added the ability to dismiss toast notifications.

### Changed
- UI: the whole UI has been overhauled both inside and out. 97% of the codebase has been rewritten to TypeScript, and a new component library has been introduced with Tailwind CSS.
- Chats: redesigned chats. Includes an improved desktop UI, unified chat widget, expanding textarea, and autosuggestions.
- Lists: ability to edit and delete a list.
- Settings: unified settings under one path with separate sections.
- Posts: changed the thumbs-up icon to a heart.
- Posts: move instance favicon beside username instead of post timestamp.
- Posts: changed the behavior of content warnings. CWs and sensitive media are unified into one design.
- Posts: redesigned interaction counters to use text instead of icons.
- Posts: letterbox images taller than 1:1.
- Profile: overhauled user profiles to be consistent with the rest of the UI.
- Composer: move emoji button alongside other composer buttons, add numerical counter.
- Birthdays: move today's birthdays out of notifications into right sidebar.
- Performance: improve scrolling/navigation between feeds by using a virtual window library.
- Admin: reorganize UI into 3-column layout.
- Admin: include external link to frontend repo for the running commit.
- Toast: redesigned toast notifications.

### Removed
- Theme: Halloween theme.
- Settings: advanced notification settings.
- Settings: dyslexic mode.
- Settings: demetricator.
- Profile: ability to set and view private notes on an account.
- Feeds: per-feed filters for replies, media, etc.
- Backup and export functionality (for now).
- Posts: hide non-emoji images embedded in post content.

### Security
- Glitch Social: fixed XSS vulnerability on Glitch Social where custom emojis could be exploited to embed a script tag.

## [2.0.0] - 2022-05-01
### Added
- Quote Posting: repost with comment on Fedibird and Rebased.
- Profile: ability to feature other users on your profile (on Rebased, Mastodon).
- Profile: ability to add location to the user's profile (on Rebased, Truth Social).
- Birthdays: ability to add a birthday to your profile (on Rebased, Pleroma).
- Birthdays: support for age-gated registration if configured by the admin (on Rebased, Pleroma).
- Birthdays: display today's birthdays in notifications.
- Notifications: added unread badge to favicon when user has notifications.
- Notifications: display full attachments in notifications instead of links.
- Search: added a dedicated search page with prefilled suggestions.
- Compatibility: improved support for Mastodon, added support for Mitra.
- Ethereum: Metamask sign-in with Mitra.
- i18n: added Shavian alphabet (`en-Shaw`) transliteration.
- i18n: added Icelandic translation.

### Changed
- Feeds: added gaps between posts in feeds.
- Feeds: automatically load new posts when scrolled to the top of the feed.
- Layout: improved design of top navigation bar.
- Layout: add left sidebar navigation.
- Icons: replaced Fork Awesome icons with Tabler icons.
- Posts: moved mentions out of the post content into an area above the post for replies (on Pleroma and Rebased - Mastodon falls back to the old behavior).
- Composer: use graphical ring counter for character count.

### Fixed
- Multi-Account: fix switching between profiles on different servers with the same local username.

## [1.3.0] - 2021-07-02
### Changed
- Layout: show right sidebar on all pages.
- Statuses: improve display of multiple rich media items.
- Statuses: let media be cropped less (when dimensions are provided).
- Profile metadata: show only 4 by default, let items be added and removed.

### Fixed
- Performance: fixed various performance issues, especially related to the post composer and chats.
- Composer: fixed upload form style on light theme.
- Composer: fixed emoji search when a custom emoji was invalid.
- Composer: fixed uploaded images sometimes being turned sideways.
- Chats: fix "Message" button on intermediate screen sizes.
- Chats: filter out invalid chats.
- Notifications: fixed notification counter on Brave Android (and possibly others).
- Localization: fixed hardcoded strings.
- Lists: fixed frontend issues related to lists (there are still backend issues).
- Modals: fixed unauthorized modal style.
- Hotkeys: remove unused hotkeys, fix broken ones.
- Sidebar: fix alignment of icons.
- Various iOS fixes.

### Added
- Statuses: added greentext support, configurable site-wide by admin.
- Statuses: added Mastodon's audio player.
- Statuses: indicate > 4 attachments.
- Statuses: display tombstones in place of deleted posts (to not break threads).
- Composer: added blurhash to upload form.
- Localization: support localization of About pages, Promo Panel items, and Link Footer items.
- Localization: display labels for default emoji reactions.
- Alerts: return detailed error for 502.
- Profile: support hidden stats.
- Profile: support blocking notifications from people you don't follow.
- Notifications: support account move notification.
- Timelines: let Fediverse explanation box be dismissed.
- Admin: optimistic user deletion.
- Admin: add monthly active users count to dashboard.
- Admin: add user retention % to dashboard.

## [1.2.3] - 2021-04-18
### Changed
- Twemoji now bundled

### Fixed
- Redirect user after registration
- Delete invalid auth users from browser
- Uploaded files ending in .blob

## [1.2.2] - 2021-04-13
### Fixed
- verify_credentials infinite loop bug
- Emoji reacts not being sent through notifications
- Contrast of Polls

### Added
- Configurable FQN for local accounts
- Polish translations

## [1.2.1] - 2021-04-06
### Fixed
- "View context" button on videos
- Login page successfully redirects Home

## [1.2.0] - 2021-04-02
### Added
- Remote follow button
- Display "Bot" tag for bot users
- Ability to view remote timelines
- Admin interface
- Integrated moderation features
- Multiple account support
- Verification (blue checkmark)
- Better support for follow requests
- Improve feedback when registering a new account
- Ability to import Mutes from CSV
- Add server information page
- "Follow" button is more responsive
- Portuguese translations

### Fixed
- Heart reaction works on Pleroma >= 2.3.0
- Pagination of Blocks and Mutes

## [1.1.0] - 2020-10-05
### Fixed
- General user interface and ease-of-use improvements for both mobile and desktop
- General loading and performance improvements, including shrinking bundle size
- GIF handling: AutoPlayGif Preference support, including avatars and profile banners
- Sidebar menu browser compatibility
- React 17.x compatibility
- Timeline jumping during scroll
- Collapse of compose modal after privacy scope change
- Media attachment rendering
- Thread view reply post rendering
- Thread view scroll to selected post rendering
- Bookmarking of posts
- Edit Profile: checkbox handling
- Edit Profile: multi-line bio with link support
- Muted Users: posts of muted users now appear in profile view
- Forms: security issue resolved with POST method on all forms
- Internationalization: increased elements that are internationalizable
- Composer: Forcing the scope to default after settings save.

### Added
- Chats, currently one-to-one, evolving with Pleroma BE capabilities, including:
    - Initiate chat via `Message` button on profile
    - Up to 4 open foreground chat windows in desktop, with open/minimize/close and notification counter
    - Browser tab notification counter includes total chat and post notifications
    - Chats list with total chats notification counter and audio notification toggle
    - Unique chat audio notification
    - Add attachment
    - Delete chat message
    - Report chat account
    - Chats icon with notification counter in top navbar in mobile view
    - Chats marked read on chat hover or on chat key event
- Audio player for audio uploads, including ogg, oga, and wav support
- Integration with Patron recurring donations platform
- Profile hover panels, with click to Follow/Unfollow
- Posts: Favicon of user's home instance included on post
- Site configuration page, including:
    - Site preview, including light/dark theme toggle rendering
    - Logo
    - Brand color using color picker
    - Copyright footer
    - Promo panel custom links for timeline pages
    - Home footer custom links for static pages
    - Editable JSON based configuration option
- Themes: Light/dark theme toggle in top navbar
- Themes: Halloween mode in Preferences page
- Markdown support in post composer, as default
- Loading indicator general improvements
- Polls: Add media attachments
- Polls: Mouseover hint on poll compose radiobutton to teach single/multi-choice poll type toggling
- Polls: Remove blank poll by either toggling Poll icon or by removing poll options
- Registration: Support for `Account approval required` setting in Pleroma AdminFE, via dynamic `Why do you want to join?` textarea on registration page
- Filtering: `Muted Words` menu item and page
- Filtering: Direct messages filter toggle on Home timeline
- Floating top navbar during scroll
- Import Data: `Import follows` and `import blocks`
- Profile: Media panel
- Media: Media gallery thumbnails
- Media: Any media type as attachment
- General documentation improvements
- Delete Account feature for user self-deletion in Security page
- Registration: Captcha reload on image click
- Fediverse timeline explanation accordion toggle
- Tests: React reducers tests
- Profile: Max profile meta fields defined by Pleroma BE capability
- Profile: Verified user checkbox
- Admin: Reports counter and top navbar element for admin accounts, linked to Pleroma AdminFE
- [Renovate.json](https://docs.renovatebot.com/configuration-options/) support

### Changed
- Revoke OAuth token on logout
- Home sidebar rearrangement
- Compose form icons
- User event notifications: improved rendering and added color coding
- Home timeline: `Show reposts` filter toggle default to `off`
- Direct Messages: Changed API usage from `conversations` to `direct`
- Project documentation management system, using CI
- Documentation: site customization and installation on sub-domain
- Redux update

### Removed
- FontAwesome dependencies, with full switch to ForkAwesome
- Requirement for use of soapbox.json for configuration
- Direct Message links from menus, partial deprecation due to chats

## [1.0.0] - 2020-06-15
### Added
- Emoji reactions.
- Ability to set brand color in soapbox.json.
- Security UI.
- Proper i18n support.
- Link to AdminFE.
- Password reset.
- Ability to edit profile fields.
- Many new automated tests.

### Changed
- Overhauled theming system to use native CSS variables.
- Reorganized folder structure.
- Redesigned post composer.
- All references to "Gab" removed.
- Disable notification sounds by default.
- Rename 'Favourite' to 'Like'
- Improve design of floating compose button.
- Force media to have a static height, fixing jumpy timelines.

### Fixed
- Composer: Move cursor to end of text.
- Composer: Tagging yourself in replies.
- Composer: State issues between compose modal and inline composer.
- AutoPlayGif for images in posts.
- Handle registration when email confirmation is required.
- Ability to add non-follows to Lists.
- Don't hide locked accounts from non-followers.
- Delete + Redraft errors.
- Preferences: Display name limitations removed.
- Hide "Embed" functionality from menus.
- Only show 'Trends' and 'Who To Follow' when supported by the backend.
- Hide reposted media from account media tab.

## [0.9.0] - 2020-04-30
### Added
- Initial beta release.

[Unreleased]: https://github.com/fbxl-sj0/unfathomably-fe/compare/v3.5.0...HEAD
[3.5.0]: https://github.com/fbxl-sj0/unfathomably-fe/compare/v3.4.0...v3.5.0
[3.4.0]: https://github.com/fbxl-sj0/unfathomably-fe/compare/v3.3.1...v3.4.0
[3.3.1]: https://github.com/fbxl-sj0/unfathomably-fe/compare/v3.3.0...v3.3.1
[3.3.0]: https://github.com/fbxl-sj0/unfathomably-fe/compare/v3.2.1...v3.3.0
[3.2.1]: https://github.com/fbxl-sj0/unfathomably-fe/compare/v3.2.0...v3.2.1
[3.2.0]: https://github.com/fbxl-sj0/unfathomably-fe/compare/v3.1.0...v3.2.0
[3.1.0]: https://github.com/fbxl-sj0/unfathomably-fe/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/fbxl-sj0/unfathomably-fe/compare/v2.0.0...v3.0.0
[2.0.0]: https://github.com/fbxl-sj0/unfathomably-fe/compare/v1.3.0...v2.0.0
[1.3.0]: https://github.com/fbxl-sj0/unfathomably-fe/compare/v1.2.3...v1.3.0
[1.2.3]: https://github.com/fbxl-sj0/unfathomably-fe/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/fbxl-sj0/unfathomably-fe/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/fbxl-sj0/unfathomably-fe/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/fbxl-sj0/unfathomably-fe/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/fbxl-sj0/unfathomably-fe/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/fbxl-sj0/unfathomably-fe/releases/tag/v1.0.0
[0.9.0]: https://github.com/fbxl-sj0/unfathomably-fe/releases/tag/v0.9.0
