import { Map as ImmutableMap } from 'immutable';
import { describe, expect, it } from 'vitest';

import { ME_FETCH_SUCCESS } from '@/actions/me.ts';

import reducer from './settings.ts';

describe('settings reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {} as any)).toEqual(ImmutableMap({
      loaded: false,
      saved: true,
    }));
  });

  it('marks account settings loaded without retaining incomplete local state', () => {
    const state = ImmutableMap({
      loaded: false,
      saved: false,
      notifications: ImmutableMap({ grouped: false }),
    });
    const action = {
      type: ME_FETCH_SUCCESS,
      me: {
        pleroma: {
          settings_store: {
            soapbox_fe: {
              notifications: { grouped: true },
              themeMode: 'black',
            },
          },
        },
      },
    };

    expect(reducer(state, action as any).toJS()).toEqual({
      loaded: true,
      saved: true,
      notifications: { grouped: true },
      themeMode: 'black',
    });
  });
});
