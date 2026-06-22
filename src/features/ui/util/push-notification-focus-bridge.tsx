/*
  Project: Unfathomably FE
  File: features/ui/util/push-notification-focus-bridge.tsx

  Purpose:
    Tell the service worker when the app is visible again.

  Responsibilities:
    Close stale native notifications after focus returns so web-push does not
    keep shouting after the user is already looking at the app.

  This file intentionally does NOT contain:
    Push subscription management or notification rendering.
*/

import { useEffect } from 'react';

const PushNotificationFocusBridge: React.FC = () => {
  useEffect(() => {
    const closeVisibleNotifications = () => {
      if (document.visibilityState !== 'visible') return;
      if (!('serviceWorker' in navigator)) return;

      // eslint-disable-next-line compat/compat
      navigator.serviceWorker?.controller?.postMessage({
        type: 'notifications:close_visible',
      });
    };

    window.addEventListener('focus', closeVisibleNotifications);
    document.addEventListener('visibilitychange', closeVisibleNotifications);

    closeVisibleNotifications();

    return () => {
      window.removeEventListener('focus', closeVisibleNotifications);
      document.removeEventListener('visibilitychange', closeVisibleNotifications);
    };
  }, []);

  return null;
};

export default PushNotificationFocusBridge;

/* end of features/ui/util/push-notification-focus-bridge.tsx */
