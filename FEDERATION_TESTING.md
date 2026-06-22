# Unfathomably Frontend Federation Testing

The frontend test regime treats federation UI as a contract layer, not as a
pile of one-off cards.

## Lanes

`npm run test:federation`

Runs the fast platform-family and source/group compatibility tests.

`npm run strict`

Runs the full frontend hard gate: TypeScript, Vitest, and production build. The
Vite build treats Rollup warnings as errors.

## What this is meant to catch

The first target is platform drift. If a platform such as Lemmy, Funkwhale,
WordPress, Pixelfed, or PeerTube starts arriving through a different metadata
shape, the classification tests should catch it before the UI silently falls
back to generic cards.

The second target is renderer drift. Every family has a render hint, so adding a
platform means deciding whether it feels like audio, video, long-form writing,
microblogging, photos, books, bookmarks, communities, events, local content, or
generic ActivityPub content.

The third target is build drift. Type errors, Vitest failures, and production
build warnings all belong in the same release gate.

## Inspired practices

* Mastodon splits JavaScript testing, linting, type checking, and browser tests.
* Lemmy keeps API tests around follow, unfollow, and federated community state.
* Misskey has separate backend, frontend, federation, migration, and API schema
  validation workflows.
* PeerTube runs a matrix of service-backed suites and preserves failure logs.
* GoToSocial documents disposable test rigs for realistic client behavior.

## Next layers

The platform tests are the first fixture layer. The next frontend layers should
add component tests for native cards:

* audio player card
* video/live card
* long-form article card
* microblog status card
* photo gallery card
* book/review card
* bookmark/link card
* group/community card
* event card
* generic ActivityPub fallback card

# end of FEDERATION_TESTING.md
