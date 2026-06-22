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

interface ParsedStreamDescriptor {
  params: URLSearchParams;
  stream: string;
}

const STREAMING_PATH = '/api/v1/streaming';

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
    const accessToken = getAccessToken(getState());
    const { onConnect, onDisconnect, onReceive } = callbacks(dispatch, getState);

    let subscription: { close(): void } | undefined;

    // If the WebSocket fails to be created, don't crash the whole page,
    // and fall back to EventSource when the browser supports it. Some
    // reverse proxies are friendlier to long-lived HTTP responses than
    // WebSocket upgrades, and the backend exposes the same Mastodon
    // streaming events over both transports.
    try {
      subscription = getStream(streamingAPIBaseURL!, accessToken, path, {
        connected() {
          onConnect();
        },

        disconnected() {
          onDisconnect();
        },

        received(data) {
          onReceive(data);
        },

        reconnected() {
          onConnect();
        },

      });
    } catch (e) {
      console.error(e);

      if (typeof EventSource !== 'undefined') {
        try {
          subscription = getEventSourceStream(streamingAPIBaseURL!, accessToken, path, {
            connected() {
              onConnect();
            },

            disconnected() {
              onDisconnect();
            },

            received(data) {
              onReceive(data);
            },
          });
        } catch (eventSourceError) {
          console.error(eventSourceError);
        }
      }
    }

    const disconnect = () => {
      if (subscription) {
        subscription.close();
      }
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
    }    default:
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
