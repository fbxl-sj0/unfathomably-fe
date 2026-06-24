# Upgrading Unfathomably FE

Unfathomably FE is normally upgraded as part of the full backend and frontend
source upgrade documented in:

```text
unfathomably-be/docs/UPGRADE.MD
```

That guide covers the safe order:

1. Back up the database, backend source, uploads, and static data.
2. Upgrade and migrate `unfathomably-be`.
3. Build this frontend from `https://github.com/fbxl-sj0/unfathomably-fe`.
4. Install the built `dist/` output under the backend static frontend path.
5. Enable `unfathomably-fe` as the primary frontend.
6. Restart and smoke test the backend and browser entry point.

For frontend-only rebuilds after the backend is already running
Unfathomably, the core commands are:

```sh
cd /opt/unfathomably-fe
sudo -Hu pleroma git pull --ff-only

pleroma-run asdf install
pleroma-run asdf reshim
pleroma-run bash -lc 'command -v corepack >/dev/null || { npm install -g corepack && asdf reshim nodejs; }'
pleroma-run npm exec -- corepack yarn install --immutable
pleroma-run env NODE_OPTIONS=--max-old-space-size=4096 npm exec -- corepack yarn build

sudo rsync -a --delete \
  /opt/unfathomably-fe/dist/ \
  /var/lib/pleroma/static/frontends/unfathomably-fe/current/

sudo chown -R pleroma:pleroma /var/lib/pleroma/static/frontends/unfathomably-fe
sudo systemctl restart pleroma
```

Use `npm exec -- corepack yarn ...` rather than relying on an asdf-generated
`yarn` shim. Upgrade rehearsals found that old Soapbox installs can leave a
stale Yarn shim from an older Node runtime.

<!-- end of UPGRADE.MD -->
