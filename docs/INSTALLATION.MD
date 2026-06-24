# Installing Unfathomably FE

Unfathomably FE is normally deployed together with
`fbxl-sj0/unfathomably-be`. The complete source install guide lives in the
backend repository at:

```text
docs/INSTALLATION.MD
```

The short version for the frontend is:

```sh
sudo -Hu pleroma git clone https://github.com/fbxl-sj0/unfathomably-fe /opt/unfathomably-fe

pleroma-run bash -lc 'asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git || asdf plugin update nodejs'

cd /opt/unfathomably-fe
pleroma-run asdf install
pleroma-run asdf reshim
pleroma-run bash -lc 'command -v corepack >/dev/null || { npm install -g corepack && asdf reshim nodejs; }'
pleroma-run npm exec -- corepack yarn install --immutable
pleroma-run env NODE_OPTIONS=--max-old-space-size=4096 npm exec -- corepack yarn build

sudo -Hu pleroma mkdir -p /var/lib/pleroma/static/frontends/unfathomably-fe/current

sudo -Hu pleroma rsync -a --delete \
  /opt/unfathomably-fe/dist/ \
  /var/lib/pleroma/static/frontends/unfathomably-fe/current/

cd /opt/pleroma
pleroma-run mix pleroma.frontend enable unfathomably-fe --ref current --primary
sudo systemctl restart pleroma
```

Leave `BACKEND_URL` unset when the frontend is served from the same origin as
the backend. Set it before the build command only when intentionally hosting
the frontend on a different origin.
