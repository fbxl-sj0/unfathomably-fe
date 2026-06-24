import { describe, expect, it } from 'vitest';

import {
  buildStreamingRequest,
  createStreamConnectionNotifier,
  normalizeStreamingAPIBaseURL,
  reconnectDelayWithJitter,
  shouldReconnectAfterPageShow,
  shouldReconnectAfterVisibilityChange,
} from './stream.ts';

describe('buildStreamingRequest', () => {
  it('uses Mastodon path-style URLs for public streams', () => {
    expect(buildStreamingRequest('wss://social.test', 'public')).toEqual({
      websocketUrl: 'wss://social.test/api/v1/streaming/public',
      eventSourceUrl: 'https://social.test/api/v1/streaming/public',
    });

    expect(buildStreamingRequest('wss://social.test/', 'public:media')).toEqual({
      websocketUrl: 'wss://social.test/api/v1/streaming/public?only_media=true',
      eventSourceUrl: 'https://social.test/api/v1/streaming/public?only_media=true',
    });
  });

  it('uses Mastodon path-style URLs for protected streams without leaking tokens into WebSocket URLs', () => {
    expect(buildStreamingRequest('wss://social.test', 'user', 'token-1')).toEqual({
      websocketUrl: 'wss://social.test/api/v1/streaming/user',
      eventSourceUrl: 'https://social.test/api/v1/streaming/user?access_token=token-1',
    });

    expect(buildStreamingRequest('wss://social.test', 'user:notification', 'token-1')).toEqual({
      websocketUrl: 'wss://social.test/api/v1/streaming/user/notification',
      eventSourceUrl: 'https://social.test/api/v1/streaming/user/notification?access_token=token-1',
    });
  });

  it('keeps remote timeline parameters encoded', () => {
    expect(buildStreamingRequest('wss://social.test', 'public:remote&instance=example.com')).toEqual({
      websocketUrl: 'wss://social.test/api/v1/streaming/public/remote?instance=example.com',
      eventSourceUrl: 'https://social.test/api/v1/streaming/public/remote?instance=example.com',
    });

    expect(buildStreamingRequest('wss://social.test', 'public:remote:media&instance=video.example')).toEqual({
      websocketUrl: 'wss://social.test/api/v1/streaming/public/remote?instance=video.example&only_media=true',
      eventSourceUrl: 'https://social.test/api/v1/streaming/public/remote?instance=video.example&only_media=true',
    });
  });

  it('uses path-style URLs for hashtag and list streams', () => {
    expect(buildStreamingRequest('wss://social.test', 'hashtag&tag=3d%20printing')).toEqual({
      websocketUrl: 'wss://social.test/api/v1/streaming/hashtag?tag=3d+printing',
      eventSourceUrl: 'https://social.test/api/v1/streaming/hashtag?tag=3d+printing',
    });

    expect(buildStreamingRequest('wss://social.test', 'list&list=list-1', 'token-1')).toEqual({
      websocketUrl: 'wss://social.test/api/v1/streaming/list?list=list-1',
      eventSourceUrl: 'https://social.test/api/v1/streaming/list?list=list-1&access_token=token-1',
    });
  });

  it('uses path-style URLs for Rebased group and source streams', () => {
    expect(buildStreamingRequest('wss://social.test', 'group&group=group-1', 'token-1')).toEqual({
      websocketUrl: 'wss://social.test/api/v1/streaming/group/group-1',
      eventSourceUrl: 'https://social.test/api/v1/streaming/group/group-1?access_token=token-1',
    });
  });

  it('can prefer the page origin for integrated frontend deployments', () => {
    const pageUrl = new URL(window.location.href);
    const expectedProtocol = pageUrl.protocol === 'https:' ? 'wss:' : 'ws:';

    expect(normalizeStreamingAPIBaseURL('wss://backend.test:4443')).toBe(`${expectedProtocol}//${pageUrl.host}/`);
  });
});

describe('shouldReconnectAfterVisibilityChange', () => {
  it('waits until the tab has been hidden long enough to make a stale stream likely', () => {
    expect(shouldReconnectAfterVisibilityChange(undefined, 30_000)).toBe(false);
    expect(shouldReconnectAfterVisibilityChange(0, 29_999)).toBe(false);
    expect(shouldReconnectAfterVisibilityChange(0, 30_000)).toBe(true);
  });
});

describe('shouldReconnectAfterPageShow', () => {
  it('reconnects after mobile page cache restores and long background sleeps', () => {
    expect(shouldReconnectAfterPageShow(undefined, 10_000, true)).toBe(true);
    expect(shouldReconnectAfterPageShow(0, 29_999, false)).toBe(false);
    expect(shouldReconnectAfterPageShow(0, 30_000, false)).toBe(true);
  });
});

describe('createStreamConnectionNotifier', () => {
  it('suppresses duplicate connect and disconnect notifications', () => {
    const events: Array<string> = [];
    const notifier = createStreamConnectionNotifier(
      () => events.push('connect'),
      () => events.push('disconnect'),
    );

    notifier.disconnect();
    notifier.connect();
    notifier.connect();
    notifier.disconnect();
    notifier.disconnect();
    notifier.connect();

    expect(events).toEqual(['connect', 'disconnect', 'connect']);
  });
});

describe('reconnectDelayWithJitter', () => {
  it('adds bounded jitter to reconnects so active streams do not stampede the backend', () => {
    expect(reconnectDelayWithJitter(500, 0, 750)).toBe(500);
    expect(reconnectDelayWithJitter(500, 0.5, 750)).toBe(875);
    expect(reconnectDelayWithJitter(500, 1, 750)).toBe(1250);
  });

  it('clamps unusual values before computing a delay', () => {
    expect(reconnectDelayWithJitter(-100, Number.NaN, -50)).toBe(0);
    expect(reconnectDelayWithJitter(500, -1, 750)).toBe(500);
    expect(reconnectDelayWithJitter(500, 2, 750)).toBe(1250);
  });
});
