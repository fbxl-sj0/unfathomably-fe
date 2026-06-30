import { ExponentialBackoff, WebsocketBuilder } from 'websocket-ts';

import { getAccessToken } from '@/utils/auth.ts';

import type { AppDispatch, RootState } from '@/store.ts';

interface ConnectStreamCallbacks {
  onConnect(): void;
  onDisconnect(): void;
  onReceive(data: unknown): void;
}

interface StreamingRequest {
  eventSourceUrl: string;
  websocketUrl: string;
}

interface StreamSubscription {
  close(): void;
}

interface StreamConnectionNotifier {
  connect(): void;
  disconnect(): void;
}

interface ParsedStreamDescriptor {
  params: URLSearchParams;
  stream: string;
}

const STREAMING_PATH = '/api/v1/streaming';
const STREAM_HIDDEN_RECONNECT_AFTER = 30 * 1000;
const STREAM_ONLINE_RECONNECT_DELAY = 500;
const STREAM_VISIBLE_RECONNECT_DELAY = 1000;
const STREAM_RECONNECT_JITTER = 750;
const STREAM_DISCONNECTED_RECONNECT_DELAY = 1500;
const STREAM_FOCUS_RECONNECT_AFTER = 15 * 1000;
const STREAM_HEALTH_CHECK_INTERVAL = 30 * 1000;
const STREAM_VISIBLE_STALE_RECONNECT_AFTER = 5 * 60 * 1000;

const EVENT_SOURCE_EVENTS = [
  'announcement',
  'announcement.delete',
  'announcement.reaction',
  'chat_message.created',
  'chat_message.deleted',
  'chat_message.reaction',
  'chat_message.read',
  'conversation',
  'delete',
  'filters_changed',
  'marker',
  'notification',
  'pleroma:chat_update',
  'pleroma:follow_relationships_update',
  'status.update',
  'update',
];

export function connectStream(
  path: string,
  callbacks: (dispatch: AppDispatch, getState: () => RootState) => ConnectStreamCallbacks,
) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const streamingAPIBaseURL = normalizeStreamingAPIBaseURL(getState().instance.configuration.urls.streaming);

    if (!streamingAPIBaseURL) {
      return () => {};
    }

    const accessToken = getAccessToken(getState());
    const { onConnect, onDisconnect, onReceive } = callbacks(dispatch, getState);
    const connection = createStreamConnectionNotifier(onConnect, onDisconnect);

    let hiddenAt: number | undefined;
    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;
    let healthCheckInterval: ReturnType<typeof setInterval> | undefined;
    let streamEpoch = 0;
    let subscription: StreamSubscription | undefined;
    let closed = false;
    let lastActivityAt = Date.now();

    const isCurrentStream = (epoch: number) => !closed && epoch === streamEpoch;

    const touchActivity = () => {
      lastActivityAt = Date.now();
    };

    const clearScheduledReconnect = () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = undefined;
      }
    };

    const createSubscription = (epoch: number): StreamSubscription | undefined => {
      // If the WebSocket fails to be created, don't crash the whole page,
      // and fall back to EventSource when the browser supports it. Some
      // reverse proxies are friendlier to long-lived HTTP responses than
      // WebSocket upgrades, and the backend exposes the same Mastodon
      // streaming events over both transports.
      try {
        return getStream(streamingAPIBaseURL, accessToken, path, {
          connected() {
            if (isCurrentStream(epoch)) {
              touchActivity();
              connection.connect();
            }
          },

          disconnected() {
            if (isCurrentStream(epoch)) {
              connection.disconnect();
              scheduleRestart(STREAM_DISCONNECTED_RECONNECT_DELAY);
            }
          },

          received(data) {
            if (isCurrentStream(epoch)) {
              touchActivity();
              onReceive(data);
            }
          },

          reconnected() {
            if (isCurrentStream(epoch)) {
              touchActivity();
              connection.connect();
            }
          },

        });
      } catch (e) {
        console.error(e);

        if (typeof EventSource === 'undefined') {
          return undefined;
        }

        try {
          return getEventSourceStream(streamingAPIBaseURL, accessToken, path, {
            connected() {
              if (isCurrentStream(epoch)) {
                touchActivity();
                connection.connect();
              }
            },

            disconnected() {
              if (isCurrentStream(epoch)) {
                connection.disconnect();
                scheduleRestart(STREAM_DISCONNECTED_RECONNECT_DELAY);
              }
            },

            received(data) {
              if (isCurrentStream(epoch)) {
                touchActivity();
                onReceive(data);
              }
            },
          });
        } catch (eventSourceError) {
          console.error(eventSourceError);
          return undefined;
        }
      }
    };

    const start = () => {
      if (browserIsOffline()) return;

      touchActivity();

      const epoch = ++streamEpoch;

      subscription = createSubscription(epoch);

      if (!subscription) {
        connection.disconnect();
      }
    };

    const stopCurrentSubscription = () => {
      const oldSubscription = subscription;

      subscription = undefined;
      streamEpoch += 1;
      closeSubscription(oldSubscription);
    };

    const restart = () => {
      reconnectTimeout = undefined;

      if (closed || browserIsOffline()) return;

      stopCurrentSubscription();
      start();
    };

    const scheduleRestart = (delay: number) => {
      if (closed || browserIsOffline()) return;

      clearScheduledReconnect();
      reconnectTimeout = setTimeout(restart, reconnectDelayWithJitter(delay));
    };

    const handleOnline = () => {
      scheduleRestart(STREAM_ONLINE_RECONNECT_DELAY);
    };

    const handleOffline = () => {
      clearScheduledReconnect();
      stopCurrentSubscription();
      connection.disconnect();
    };

    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return;

      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }

      if (document.visibilityState === 'visible') {
        if (shouldReconnectAfterVisibilityChange(hiddenAt, Date.now())) {
          scheduleRestart(STREAM_VISIBLE_RECONNECT_DELAY);
        }

        hiddenAt = undefined;
      }
    };

    const handlePageHide = () => {
      hiddenAt = Date.now();
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (shouldReconnectAfterPageShow(hiddenAt, Date.now(), event.persisted)) {
        scheduleRestart(STREAM_VISIBLE_RECONNECT_DELAY);
      }

      hiddenAt = undefined;
    };

    const handleFocus = () => {
      if (Date.now() - lastActivityAt >= STREAM_FOCUS_RECONNECT_AFTER) {
        scheduleRestart(STREAM_VISIBLE_RECONNECT_DELAY);
      }
    };

    const handleHealthCheck = () => {
      if (closed || browserIsOffline()) return;

      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }

      if (Date.now() - lastActivityAt >= STREAM_VISIBLE_STALE_RECONNECT_AFTER) {
        scheduleRestart(STREAM_VISIBLE_RECONNECT_DELAY);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      window.addEventListener('pagehide', handlePageHide);
      window.addEventListener('pageshow', handlePageShow);
      window.addEventListener('focus', handleFocus);
    }

    if (typeof document !== 'undefined') {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      }

      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    healthCheckInterval = setInterval(handleHealthCheck, STREAM_HEALTH_CHECK_INTERVAL);

    start();

    const disconnect = () => {
      closed = true;
      clearScheduledReconnect();

      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
        healthCheckInterval = undefined;
      }

      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('pagehide', handlePageHide);
        window.removeEventListener('pageshow', handlePageShow);
        window.removeEventListener('focus', handleFocus);
      }

      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }

      stopCurrentSubscription();
      connection.disconnect();
    };

    return disconnect;
  };
}

export default function getStream(
  streamingAPIBaseURL: string,
  accessToken: string | null | undefined,
  stream: string,
  { connected, received, disconnected, reconnected }: {
    connected: ((ev: Event) => any) | null;
    received: (data: any) => void;
    disconnected: ((ev: Event) => any) | null;
    reconnected: ((ev: Event) => any);
  },
) {
  const request = buildStreamingRequest(streamingAPIBaseURL, stream, accessToken);
  let builder = new WebsocketBuilder(request.websocketUrl);

  if (accessToken) {
    builder = builder.withProtocols(accessToken);
  }

  const ws = builder
    .withBackoff(new ExponentialBackoff(1000, 6))
    .onOpen((_ws, ev) => {
      connected?.(ev);
    })
    .onClose((_ws, ev) => {
      disconnected?.(ev);
    })
    .onReconnect((_ws, ev) => {
      reconnected(ev);
    })
    .onMessage((_ws, e) => {
      if (!e.data) return;
      try {
        received(JSON.parse(e.data));
      } catch (error) {
        console.error(e);
        console.error(`Could not parse the above streaming event.\n${error}`);
      }
    })
    .build();

  return ws;
}

function getEventSourceStream(
  streamingAPIBaseURL: string,
  accessToken: string | null | undefined,
  stream: string,
  { connected, received, disconnected }: {
    connected: ((ev: Event) => any) | null;
    received: (data: any) => void;
    disconnected: ((ev: Event) => any) | null;
  },
) {
  const request = buildStreamingRequest(streamingAPIBaseURL, stream, accessToken);
  const eventSource = new EventSource(request.eventSourceUrl);

  eventSource.onopen = (ev) => {
    connected?.(ev);
  };

  eventSource.onerror = (ev) => {
    disconnected?.(ev);
  };

  eventSource.onmessage = (ev) => {
    try {
      received(JSON.parse(ev.data));
    } catch {
      received({ event: 'message', payload: ev.data });
    }
  };

  EVENT_SOURCE_EVENTS.forEach((event) => {
    eventSource.addEventListener(event, (ev) => {
      received({ event, payload: ev.data });
    });
  });

  return eventSource;
}

function parseStreamDescriptor(streamDescriptor: string): ParsedStreamDescriptor {
  const paramStart = streamDescriptor.indexOf('&');

  if (paramStart === -1) {
    return {
      stream: streamDescriptor,
      params: new URLSearchParams(),
    };
  }

  return {
    stream: streamDescriptor.slice(0, paramStart),
    params: new URLSearchParams(streamDescriptor.slice(paramStart + 1)),
  };
}

function buildMastodonPath(stream: string, params: URLSearchParams): string | null {
  switch (stream) {
    case 'direct':
      return `${STREAMING_PATH}/direct`;
    case 'hashtag':
      return `${STREAMING_PATH}/hashtag`;
    case 'hashtag:local':
      return `${STREAMING_PATH}/hashtag/local`;
    case 'list':
      return `${STREAMING_PATH}/list`;
    case 'public':
      return `${STREAMING_PATH}/public`;
    case 'public:local':
      return `${STREAMING_PATH}/public/local`;
    case 'public:local:media':
      params.set('only_media', 'true');
      return `${STREAMING_PATH}/public/local`;
    case 'public:media':
      params.set('only_media', 'true');
      return `${STREAMING_PATH}/public`;
    case 'public:remote':
      return `${STREAMING_PATH}/public/remote`;
    case 'public:remote:media':
      params.set('only_media', 'true');
      return `${STREAMING_PATH}/public/remote`;
    case 'user':
      return `${STREAMING_PATH}/user`;
    case 'user:notification':
      return `${STREAMING_PATH}/user/notification`;
    case 'user:groups':
      return `${STREAMING_PATH}/user/groups`;
    case 'user:sources':
      return `${STREAMING_PATH}/user/sources`;
    case 'group': {
      const group = params.get('group');

      if (!group) {
        return null;
      }

      params.delete('group');

      return `${STREAMING_PATH}/group/${encodeURIComponent(group)}`;
    }
    case 'source': {
      const source = params.get('source');

      if (!source) {
        return null;
      }

      params.delete('source');

      return `${STREAMING_PATH}/source/${encodeURIComponent(source)}`;
    }
    default:
      return null;
  }
}

function appendParams(url: URL, params: URLSearchParams) {
  params.forEach((value, key) => {
    url.searchParams.append(key, value);
  });
}

function eventSourceUrlFromWebsocketUrl(websocketUrl: string, accessToken: string | null | undefined): string {
  const url = new URL(websocketUrl);

  if (url.protocol === 'wss:') {
    url.protocol = 'https:';
  } else if (url.protocol === 'ws:') {
    url.protocol = 'http:';
  }

  if (accessToken) {
    url.searchParams.set('access_token', accessToken);
  }

  return url.toString();
}

function streamingBaseUrl(streamingAPIBaseURL: string): string {
  return streamingAPIBaseURL.replace(/\/+$/, '');
}

function browserIsOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function closeSubscription(subscription: StreamSubscription | undefined) {
  if (!subscription) return;

  try {
    subscription.close();
  } catch (error) {
    console.error(error);
  }
}

export function createStreamConnectionNotifier(
  onConnect: () => void,
  onDisconnect: () => void,
): StreamConnectionNotifier {
  let connected = false;

  return {
    connect() {
      if (connected) return;

      connected = true;
      onConnect();
    },

    disconnect() {
      if (!connected) return;

      connected = false;
      onDisconnect();
    },
  };
}

export function reconnectDelayWithJitter(
  delay: number,
  randomValue = Math.random(),
  jitterWindow = STREAM_RECONNECT_JITTER,
): number {
  const normalizedDelay = Math.max(0, delay);
  const normalizedJitterWindow = Math.max(0, jitterWindow);
  const normalizedRandomValue = Number.isFinite(randomValue) ? Math.min(Math.max(randomValue, 0), 1) : 0;

  return normalizedDelay + Math.floor(normalizedJitterWindow * normalizedRandomValue);
}

export function shouldReconnectAfterVisibilityChange(hiddenAt: number | undefined, now: number): boolean {
  if (typeof hiddenAt !== 'number') return false;

  return now - hiddenAt >= STREAM_HIDDEN_RECONNECT_AFTER;
}

export function shouldReconnectAfterPageShow(
  hiddenAt: number | undefined,
  now: number,
  persisted: boolean,
): boolean {
  return persisted || shouldReconnectAfterVisibilityChange(hiddenAt, now);
}

export function normalizeStreamingAPIBaseURL(streamingAPIBaseURL: string | undefined): string | undefined {
  if (!streamingAPIBaseURL || typeof window === 'undefined') {
    return streamingAPIBaseURL;
  }

  try {
    const configuredUrl = new URL(streamingAPIBaseURL);
    const pageUrl = new URL(window.location.href);

    if (!['http:', 'https:'].includes(pageUrl.protocol)) {
      return streamingAPIBaseURL;
    }

    configuredUrl.protocol = pageUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    configuredUrl.host = pageUrl.host;
    configuredUrl.pathname = '';
    configuredUrl.search = '';
    configuredUrl.hash = '';

    return configuredUrl.toString();
  } catch {
    return streamingAPIBaseURL;
  }
}

export function buildStreamingRequest(
  streamingAPIBaseURL: string,
  streamDescriptor: string,
  accessToken?: string | null,
): StreamingRequest {
  const baseUrl = streamingBaseUrl(streamingAPIBaseURL);
  const { stream, params } = parseStreamDescriptor(streamDescriptor);
  const mastodonPath = buildMastodonPath(stream, params);

  let websocketUrl: URL;

  if (mastodonPath) {
    websocketUrl = new URL(mastodonPath, `${baseUrl}/`);
    appendParams(websocketUrl, params);
  } else {
    websocketUrl = new URL(`${STREAMING_PATH}/`, `${baseUrl}/`);
    websocketUrl.searchParams.set('stream', stream);
    appendParams(websocketUrl, params);
  }

  const websocketUrlString = websocketUrl.toString();

  return {
    websocketUrl: websocketUrlString,
    eventSourceUrl: eventSourceUrlFromWebsocketUrl(websocketUrlString, accessToken),
  };
}
