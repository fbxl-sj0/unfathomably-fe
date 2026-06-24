import { describe, expect, it } from 'vitest';

import { buildInstance } from '@/jest/factory.ts';

import {
  parseVersion,
  getFeatures,
} from './features.ts';
import { getInstanceScopes } from './scopes.ts';

const formatSemver = (version: ReturnType<typeof parseVersion>['version']) => {
  const prereleaseParts = version.prerelease ?? [];
  const buildParts = version.build ?? [];
  const prerelease = prereleaseParts.length ? `-${prereleaseParts.join('.')}` : '';
  const build = buildParts.length ? `+${buildParts.join('.')}` : '';

  return `${version.major}.${version.minor}.${version.patch}${prerelease}${build}`;
};

const formatBackend = (backend: ReturnType<typeof parseVersion>) => ({
  build: backend.build,
  compatVersion: formatSemver(backend.compatVersion),
  software: backend.software,
  version: formatSemver(backend.version),
});

describe('parseVersion', () => {
  it('with Pleroma version string', () => {
    const version = '2.7.2 (compatible; Pleroma 2.0.5-6-ga36eb5ea-plerasstodon+dev)';
    expect(formatBackend(parseVersion(version))).toEqual({
      software: 'Pleroma',
      version: '2.0.5-6-ga36eb5ea-plerasstodon+dev',
      compatVersion: '2.7.2',
      build: 'dev',
    });
  });

  it('with Mastodon version string', () => {
    const version = '3.0.0';
    expect(formatBackend(parseVersion(version))).toEqual({
      build: undefined,
      software: 'Mastodon',
      version: '3.0.0',
      compatVersion: '3.0.0',
    });
  });

  it('with a Pixelfed version string', () => {
    const version = '2.7.2 (compatible; Pixelfed 0.11.2)';
    expect(formatBackend(parseVersion(version))).toEqual({
      build: undefined,
      software: 'Pixelfed',
      version: '0.11.2',
      compatVersion: '2.7.2',
    });
  });

  it('with a Truth Social version string', () => {
    const version = '3.4.1 (compatible; TruthSocial 1.0.0)';
    expect(formatBackend(parseVersion(version))).toEqual({
      build: undefined,
      software: 'TruthSocial',
      version: '1.0.0',
      compatVersion: '3.4.1',
    });
  });

  it('with a Mastodon fork', () => {
    const version = '3.5.1+glitch';
    expect(formatBackend(parseVersion(version))).toEqual({
      software: 'Mastodon',
      version: '3.5.1+glitch',
      compatVersion: '3.5.1+glitch',
      build: 'glitch',
    });
  });

  it('with a Pleroma fork', () => {
    const version = '2.7.2 (compatible; Pleroma 2.4.2+cofe)';
    expect(formatBackend(parseVersion(version))).toEqual({
      software: 'Pleroma',
      version: '2.4.2+cofe',
      compatVersion: '2.7.2',
      build: 'cofe',
    });
  });

  it('with an Unfathomably BE version string', () => {
    const version = '2.7.2 (compatible; unfathomably-be 2.6.50+unfathomably-be.dev)';
    expect(formatBackend(parseVersion(version))).toEqual({
      software: 'unfathomably-be',
      version: '2.6.50+unfathomably-be.dev',
      compatVersion: '2.7.2',
      build: 'unfathomably-be',
    });
  });

  it('with Mastodon nightly build', () => {
    const version = '4.1.2+nightly-20230627';
    expect(formatBackend(parseVersion(version))).toEqual({
      software: 'Mastodon',
      version: '4.1.2+nightly-20230627',
      compatVersion: '4.1.2+nightly-20230627',
      build: 'nightly-20230627',
    });
  });
});

describe('getInstanceScopes', () => {
  it('requests admin scope for Unfathomably BE', () => {
    expect(getInstanceScopes('2.7.2 (compatible; unfathomably-be 2.6.50+unfathomably-be.dev)')).toBe('read write follow push admin');
  });
});

describe('getFeatures', () => {
  describe('ditto', () => {
    it('is false for Pleroma without a relay', () => {
      const instance = buildInstance({
        version: '2.7.2 (compatible; Pleroma 2.4.50)',
      });
      const features = getFeatures(instance);

      expect(features.ditto).toBe(false);
      expect(features.nostr).toBe(false);
      expect(features.nostrSignup).toBe(false);
    });

    it('is false for Pleroma with a relay', () => {
      const instance = buildInstance({
        nostr: {
          pubkey: '0000000000000000000000000000000000000000000000000000000000000000',
          relay: 'wss://relay.example.com',
        },
        version: '2.7.2 (compatible; Pleroma 2.4.50)',
      });
      const features = getFeatures(instance);

      expect(features.ditto).toBe(false);
      expect(features.nostr).toBe(true);
      expect(features.nostrSignup).toBe(false);
    });

    it('is true for Ditto', () => {
      const instance = buildInstance({
        nostr: {
          pubkey: '0000000000000000000000000000000000000000000000000000000000000000',
          relay: 'wss://relay.example.com',
        },
        version: '4.0.0 (compatible; Ditto 0.0.0)',
      });
      const features = getFeatures(instance);

      expect(features.ditto).toBe(true);
      expect(features.nostr).toBe(true);
      expect(features.nostrSignup).toBe(true);
    });
  });

  describe('emojiReacts', () => {
    it('is true for Pleroma 2.0+', () => {
      const instance = buildInstance({
        version: '2.7.2 (compatible; Pleroma 2.0.5-6-ga36eb5ea-plerasstodon+dev)',
      });
      const features = getFeatures(instance);
      expect(features.emojiReacts).toBe(true);
    });

    it('is false for Pleroma < 2.0', () => {
      const instance = buildInstance({
        version: '2.7.2 (compatible; Pleroma 1.1.50-42-g3d9ac6ae-develop)',
      });
      const features = getFeatures(instance);
      expect(features.emojiReacts).toBe(false);
    });

    it('is false for Mastodon', () => {
      const instance = buildInstance({ version: '3.1.4' });
      const features = getFeatures(instance);
      expect(features.emojiReacts).toBe(false);
    });
  });

  describe('Truth Social feature flags', () => {
    it('enables Truth policy and password requirements for TruthSocial', () => {
      const instance = buildInstance({
        version: '3.4.1 (compatible; TruthSocial 1.0.0)',
      });
      const features = getFeatures(instance);

      expect(features.passwordRequirements).toBe(true);
      expect(features.truthPolicies).toBe(true);
    });

    it('keeps Truth policy and password requirements disabled for Pleroma', () => {
      const instance = buildInstance({
        version: '2.7.2 (compatible; Pleroma 2.4.50)',
      });
      const features = getFeatures(instance);

      expect(features.passwordRequirements).toBe(false);
      expect(features.truthPolicies).toBe(false);
    });
  });

  describe('Unfathomably BE feature flags', () => {
    it('keeps Rebased-family features available under the project backend name', () => {
      const instance = buildInstance({
        version: '2.7.2 (compatible; unfathomably-be 2.6.50+unfathomably-be.dev)',
        pleroma: {
          metadata: {
            features: ['bookmark_folders', 'groups', 'groups_discovery', 'notifications_v2', 'pleroma_explicit_addressing', 'sources', 'v2_suggestions'],
          },
        },
      });
      const features = getFeatures(instance);

      expect(features.accountAliases).toBe(true);
      expect(features.accountByUsername).toBe(true);
      expect(features.accountEndorsements).toBe(true);
      expect(features.accountLookup).toBe(true);
      expect(features.accountMoving).toBe(true);
      expect(features.accountNotifies).toBe(true);
      expect(features.accountSubscriptions).toBe(true);
      expect(features.adminAnnouncements).toBe(true);
      expect(features.adminFE).toBe(true);
      expect(features.announcements).toBe(true);
      expect(features.backups).toBe(true);
      expect(features.bookmarkFolders).toBe(true);
      expect(features.bookmarks).toBe(true);
      expect(features.bots).toBe(true);
      expect(features.chatsV2).toBe(true);
      expect(features.conversations).toBe(true);
      expect(features.customEmojiReacts).toBe(true);
      expect(features.directTimeline).toBe(true);
      expect(features.domainBlocks).toBe(true);
      expect(features.editProfile).toBe(true);
      expect(features.emojiReacts).toBe(true);
      expect(features.explicitAddressing).toBe(true);
      expect(features.familiarFollowers).toBe(true);
      expect(features.filters).toBe(true);
      expect(features.filtersExpiration).toBe(true);
      expect(features.followRequests).toBe(true);
      expect(features.frontendConfigurations).toBe(true);
      expect(features.groups).toBe(true);
      expect(features.groupsDiscovery).toBe(true);
      expect(features.groupsSearch).toBe(true);
      expect(features.groupedNotifications).toBe(true);
      expect(features.hideNetwork).toBe(true);
      expect(features.import).toBe(true);
      expect(features.importData).toBe(true);
      expect(features.lists).toBe(true);
      expect(features.logInWithUsername).toBe(true);
      expect(features.muteStrangers).toBe(true);
      expect(features.mutesDuration).toBe(true);
      expect(features.notes).toBe(true);
      expect(features.notificationsIncludeTypes).toBe(true);
      expect(features.pleromaRemoteFollow).toBe(true);
      expect(features.polls).toBe(true);
      expect(features.profileFields).toBe(true);
      expect(features.publicTimeline).toBe(true);
      expect(features.quotePosts).toBe(true);
      expect(features.remoteInteractions).toBe(true);
      expect(features.resetPassword).toBe(true);
      expect(features.richText).toBe(true);
      expect(features.rssFeeds).toBe(true);
      expect(features.scheduledStatuses).toBe(true);
      expect(features.searchFromAccount).toBe(true);
      expect(features.security).toBe(true);
      expect(features.sessions).toBe(true);
      expect(features.settingsStore).toBe(true);
      expect(features.suggestions).toBe(false);
      expect(features.suggestionsV2).toBe(false);
      expect(features.sources).toBe(true);
      expect(features.unrestrictedLists).toBe(true);
    });
  });

  describe('suggestions', () => {
    it('is true for Mastodon 2.4.3+', () => {
      const instance = buildInstance({ version: '2.4.3' });
      const features = getFeatures(instance);
      expect(features.suggestions).toBe(true);
    });

    it('is false for Mastodon < 2.4.3', () => {
      const instance = buildInstance({ version: '2.4.2' });
      const features = getFeatures(instance);
      expect(features.suggestions).toBe(false);
    });

    it('is false for Pleroma', () => {
      const instance = buildInstance({
        version: '2.7.2 (compatible; Pleroma 1.1.50-42-g3d9ac6ae-develop)',
      });
      const features = getFeatures(instance);
      expect(features.suggestions).toBe(false);
    });
  });

  describe('trends', () => {
    it('is true for Mastodon 3.0.0+', () => {
      const instance = buildInstance({ version: '3.0.0' });
      const features = getFeatures(instance);
      expect(features.trends).toBe(true);
    });

    it('is false for Mastodon < 3.0.0', () => {
      const instance = buildInstance({ version: '2.4.3' });
      const features = getFeatures(instance);
      expect(features.trends).toBe(false);
    });

    it('is false for Pleroma', () => {
      const instance = buildInstance({
        version: '2.7.2 (compatible; Pleroma 1.1.50-42-g3d9ac6ae-develop)',
      });
      const features = getFeatures(instance);
      expect(features.trends).toBe(false);
    });
  });

  describe('focalPoint', () => {
    it('is true for Mastodon 2.3.0+', () => {
      const instance = buildInstance({ version: '2.3.0' });
      const features = getFeatures(instance);
      expect(features.focalPoint).toBe(true);
    });

    it('is false for Pleroma', () => {
      const instance = buildInstance({
        version: '2.7.2 (compatible; Pleroma 1.1.50-42-g3d9ac6ae-develop)',
      });
      const features = getFeatures(instance);
      expect(features.focalPoint).toBe(false);
    });
  });
});
