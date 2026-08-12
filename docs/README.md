<!--
  Project: Unfathomably FE
  File: docs/README.md
  Purpose: Index the project documentation by audience and task.
  This file does not duplicate the detailed guides it links to.
-->

# Unfathomably FE documentation

Documentation for current Unfathomably behavior lives in this repository. The
original Soapbox documentation can still help explain inherited code, but it
is not authoritative for Unfathomably-specific APIs, deployment, or Worlds
workflows.

## Start here

- [`README.md`](../README.md) explains what the project is, which backends it
  supports, and how to run the common checks.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) explains startup, state ownership, API
  boundaries, capability detection, streaming, routing compatibility, and
  branding.
- [`DEVELOPMENT.md`](DEVELOPMENT.md) provides the local setup, repository map,
  change checklists, and verification commands.

## Operators

- [`INSTALLATION.MD`](INSTALLATION.MD) gives the frontend portion of a source
  installation.
- [`UPGRADE.MD`](UPGRADE.MD) gives the frontend-only rebuild procedure and
  points to the complete backend-owned upgrade order.
- [`docker.conf.template`](../installation/docker.conf.template) is the Nginx
  template for the container deployment shape.
- [`mastodon.conf`](../installation/mastodon.conf) is the Nginx example for a
  Mastodon-style deployment shape.

The paired backend documentation is authoritative for database work,
ActivityPub, media storage, server policy, migrations, and service management.

## Federation maintainers

- [`FEDERATION_TESTING.md`](../FEDERATION_TESTING.md) defines the focused
  compatibility test lanes.
- [`NATIVE_FEDERATION_UX_AUDIT.md`](NATIVE_FEDERATION_UX_AUDIT.md) records the
  upstream user workflows that shape native Worlds presentations.
- [`WORLDS_UPSTREAM_AUDIT_2026.md`](WORLDS_UPSTREAM_AUDIT_2026.md) records
  frontend consequences from the 2026 backend ecosystem audit.

## Project record

- [`CHANGELOG.md`](../CHANGELOG.md) contains Unfathomably releases followed by
  inherited Soapbox history.
- [`COFE_OF_CONDUCT.md`](../COFE_OF_CONDUCT.md) contains the project conduct
  policy.
- [`LICENSE`](../LICENSE) contains the AGPL-3.0-or-later license text.

<!-- end of docs/README.md -->
