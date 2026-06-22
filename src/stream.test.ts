import { describe, expect, it } from 'vitest';

import { buildStreamingRequest, normalizeStreamingAPIBaseURL } from './stream.ts';

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
