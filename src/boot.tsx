import '@/zod-jitless.ts';

import { enableMapSet } from 'immer';
import { createRoot } from 'react-dom/client';

import * as BuildConfig from '@/build-config.ts';
import Soapbox from '@/init/soapbox.tsx';

import '@fontsource/inter/200.css';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/900.css';
import '@fontsource/vazirmatn/arabic.css';
import '@fontsource/noto-sans-javanese/javanese.css';
import '@fontsource/roboto-mono/400.css';
import 'line-awesome/dist/font-awesome-line-awesome/css/all.css';

import './iframe.ts';
import './styles/tailwind.css';

import ready from './ready.ts';
import { registerSW, lockSW } from './utils/sw.ts';

const PRELOAD_RELOAD_KEY = 'unfathomably:preload-reload-at';
const PRELOAD_RELOAD_COOLDOWN = 60_000;

enableMapSet();

/*
  A tab opened before a frontend deployment can still request a lazy chunk
  from the previous build. Vite emits this event before surfacing the failed
  import. Reload once so the tab receives the current entrypoint, but retain a
  cooldown in session storage to prevent a broken deployment from causing a
  reload loop.
*/
window.addEventListener('vite:preloadError', (event) => {
  const now = Date.now();

  try {
    const lastReloadAt = Number(window.sessionStorage.getItem(PRELOAD_RELOAD_KEY));

    if (Number.isFinite(lastReloadAt) && now - lastReloadAt < PRELOAD_RELOAD_COOLDOWN) {
      return;
    }

    window.sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(now));
  } catch {
    return;
  }

  event.preventDefault();
  window.location.reload();
});

if (BuildConfig.NODE_ENV === 'production') {
  registerSW('/sw.js');
  lockSW();
}

ready(() => {
  const container = document.getElementById('soapbox') as HTMLElement;
  const root = createRoot(container);

  root.render(<Soapbox />);
});
