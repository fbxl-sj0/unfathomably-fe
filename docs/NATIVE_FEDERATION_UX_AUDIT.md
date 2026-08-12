# Native federation UX audit

This document records the first source-level UX pass for ActivityPub families
that do not originate in ordinary Pleroma microblogging. It is a maintenance
ledger: each row names the upstream workflow inspected and the Unfathomably
behavior adopted from it.

| Family | Representative source inspected | Entry and viewing pattern carried into Unfathomably |
| --- | --- | --- |
| Audio | Funkwhale `UploadForm.vue`, `UploadMetadataForm.vue`, track views | Choose the audio first, then supply artist, album or series, track number, cover, topics, and license; lead viewing with playable media and release facts. |
| Video | PeerTube `video-upload.component.html`, `video-manage.component.html`, `video-watch.component.html` | Choose the video and channel first, then title, description, category, language, topics, artwork, and captions; lead viewing with the player, publication facts, channel, and actions. |
| Long-form | WriteFreely `templates/pad.tmpl` and `collection-post.tmpl` | Put the headline and writing surface ahead of metadata; render an article as readable prose with byline, publication date, topics, and license. |
| Photos | Pixelfed `Compose.vue`, `Post.vue`, and media components | Choose photographs first, require useful image descriptions, then add caption, place, date, album, and license; keep media dominant in the view. |
| Books | BookWyrm review form and book detail templates | Select or identify the work or edition before reviewing; show cover context, stars, shelf or reading state, edition, and author together. |
| Bookmarks | Postmarks `edit_bookmark.hbs` and `show_bookmark.hbs` | Begin with the URL, annotate it with a title, note, and tags, and make the saved destination and domain obvious in the view. |
| Communities | Lemmy UI community form, header, and sidebar | Use the existing actor-level community creator for name, title, description, artwork, visibility, language, and posting rules; do not disguise a community as a post. |
| Events | Mobilizon `EditView.vue` and `EventView.vue` | Use the existing event creator for title, organizer, banner, start and end, place, description, category, tags, participation, and visibility; keep date and participation prominent. |
| Software development | Forgejo issue form and issue timeline templates | Lead with repository, actionable title, expected and actual behavior, and reproducible steps; show state, impact, labels, version, discussion, and repository as issue concepts. |
| 3D models | Manyfold model form, model view, and file views | Require an actual model or archive, organize creator, collection, tags, license, preview, and entrypoint around it, and make files and download action first-class. |
| Marketplace | Flohmarkt `edit_item.html` and `item.html` | Lead with offer or request, item name, price, description, images, and general place; make price, condition, fulfilment, and contact path easy to scan. |
| Games | Castling.club challenge board and game controller | Describe participation and game state rather than raw protocol fields; show players, state, board position or move, venue, and game link together. |
| Routes | Wanderer upload dialog, route editor, trail schema, and trail information panel | Start from GPX or route data, then describe activity, terrain, place, timing, distance, elevation, and safety; group route metrics as human-readable facts. |
| Culture catalog | NeoDB item cards, catalog metadata templates, mark lists, and journal editor | Identify a catalog work first, then add rating, status, and review; display cover-oriented work facts separately from the user journal entry. |
| Coordination | Bonfire ValueFlows Intent schema and proposal/resource views | Ask what is offered, requested, or proposed, then resource, amount, people, place, and time; phrase the view as coordination instead of exposing vocabulary keys. |
| Publishing resources | ZenPub resource and share-link LiveViews | Start with the resource or document and its reader-facing title and summary, then author, subject, audience, language, license, and download; keep the resource action obvious. |

The implementation intentionally reuses the mature local community and event
creators. Those objects have actor, membership, moderation, attendance, and
privacy behavior that cannot be represented safely by a generic status form.

<!-- end of docs/NATIVE_FEDERATION_UX_AUDIT.md -->
