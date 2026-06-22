import { render } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MemoryRouter } from '@/compat/react-router-dom.tsx';

import { SwitchingColumnsArea } from './index.tsx';

const mockFeatures = vi.hoisted(() => {
  const defaults: Record<string, boolean> = {
    ditto: false,
    federating: false,
    groups: false,
    groupsTags: false,
    nostr: false,
    nostrSignup: false,
  };

  return {
    current: { ...defaults },
    defaults,
  };
});

vi.mock('@/hooks/useFeatures.ts', () => ({
  useFeatures: () => mockFeatures.current,
}));

vi.mock('@/hooks/useInstance.ts', () => ({
  useInstance: () => ({
    instance: {
      registrations: {
        enabled: false,
      },
    },
    isNotFound: false,
  }),
}));

vi.mock('@/hooks/useLoggedIn.ts', () => ({
  useLoggedIn: () => ({
    isLoggedIn: false,
  }),
}));

vi.mock('@/hooks/useSoapboxConfig.ts', () => ({
  useSoapboxConfig: () => ({
    authenticatedProfile: false,
    cryptoAddresses: {
      size: 0,
    },
  }),
}));

vi.mock('./util/compose-draft-recovery.tsx', () => ({
  default: () => null,
}));

vi.mock('./util/push-notification-focus-bridge.tsx', () => ({
  default: () => null,
}));

vi.mock('./util/react-router-helpers.tsx', () => ({
  WrappedRoute: ({ path, exact }: { path?: string; exact?: boolean }) => (
    <Route
      path={path}
      exact={exact}
      render={() => (
        <div data-testid='matched-route'>{path ?? '__fallback__'}</div>
      )}
    />
  ),
}));

const renderPath = (path: string): string => {
  const { getByTestId, unmount } = render(
    <MemoryRouter initialEntries={[path]}>
      <SwitchingColumnsArea>
        {null}
      </SwitchingColumnsArea>
    </MemoryRouter>,
  );
  const matchedRoute = getByTestId('matched-route').textContent ?? '';

  unmount();
  return matchedRoute;
};

describe('SwitchingColumnsArea', () => {
  beforeEach(() => {
    mockFeatures.current = { ...mockFeatures.defaults };
  });

  it('does not register Ditto routes for Pleroma', () => {
    expect(renderPath('/login/nostr')).toBe('__fallback__');
    expect(renderPath('/wallet')).toBe('__fallback__');
    expect(renderPath('/wallet/relays')).toBe('__fallback__');
    expect(renderPath('/soapbox/admin/ditto-server')).toBe('__fallback__');
    expect(renderPath('/soapbox/admin/zap-split')).toBe('__fallback__');
    expect(renderPath('/soapbox/admin/nostr/relays')).toBe('__fallback__');
  });

  it('does not treat a Pleroma relay as Ditto', () => {
    mockFeatures.current = {
      ...mockFeatures.defaults,
      ditto: false,
      nostr: true,
      nostrSignup: false,
    };

    expect(renderPath('/settings/relays')).toBe('/settings/relays');
    expect(renderPath('/login/nostr')).toBe('__fallback__');
    expect(renderPath('/wallet')).toBe('__fallback__');
    expect(renderPath('/soapbox/admin/ditto-server')).toBe('__fallback__');
  });

  it('registers Ditto routes for Ditto', () => {
    mockFeatures.current = {
      ...mockFeatures.defaults,
      ditto: true,
      nostr: true,
      nostrSignup: true,
    };

    expect(renderPath('/login/nostr')).toBe('/login/nostr');
    expect(renderPath('/wallet')).toBe('/wallet');
    expect(renderPath('/wallet/relays')).toBe('/wallet/relays');
    expect(renderPath('/soapbox/admin/ditto-server')).toBe('/soapbox/admin/ditto-server');
    expect(renderPath('/soapbox/admin/zap-split')).toBe('/soapbox/admin/zap-split');
    expect(renderPath('/soapbox/admin/nostr/relays')).toBe('/soapbox/admin/nostr/relays');
  });

  it('keeps Fediverse aliases on the public timeline', () => {
    mockFeatures.current = {
      ...mockFeatures.defaults,
      federating: true,
    };

    expect(renderPath('/timeline/fediverse')).toBe('/timeline/fediverse');
    expect(renderPath('/timelines/public')).toBe('/timeline/global');
    expect(renderPath('/main/all')).toBe('/timeline/global');
  });

  it('registers singular group slug routes', () => {
    mockFeatures.current = {
      ...mockFeatures.defaults,
      groups: true,
      groupsTags: true,
    };

    expect(renderPath('/group/local-news')).toBe('/group/:groupSlug');
    expect(renderPath('/group/local-news/tags')).toBe('/group/:groupSlug/tags');
    expect(renderPath('/group/local-news/tag/breaking')).toBe('/group/:groupSlug/tag/:tagId');
    expect(renderPath('/group/local-news/members')).toBe('/group/:groupSlug/members');
    expect(renderPath('/group/local-news/statuses/status-1')).toBe('/group/:groupSlug/posts/:statusId');
    expect(renderPath('/groups/group-1/tag/breaking')).toBe('/groups/:groupId/tag/:tagId');
  });
});
