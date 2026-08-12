/*
 * Unfathomably FE
 *
 * File: followed-tags.test.ts
 * Purpose: Verify local followed-hashtag collection reconciliation.
 * This file intentionally does not test HTTP requests or tag-page rendering.
 */

import { describe, expect, it } from 'vitest';

import {
  HASHTAG_FOLLOW_SUCCESS,
  HASHTAG_UNFOLLOW_SUCCESS,
} from '@/actions/tags.ts';

import reducer from './followed-tags.ts';

const tag = {
  name: 'activitypub',
  url: 'https://social.example/tags/activitypub',
  history: [],
  following: true,
};

describe('followed tags reducer', () => {
  it('adds and removes successful hashtag relationship changes immediately', () => {
    const followed = reducer(undefined, {
      type: HASHTAG_FOLLOW_SUCCESS,
      name: tag.name,
      tag,
    });

    const duplicate = reducer(followed, {
      type: HASHTAG_FOLLOW_SUCCESS,
      name: tag.name,
      tag,
    });

    expect(duplicate.items.map(item => item.name).toArray()).toEqual([tag.name]);

    const unfollowed = reducer(duplicate, {
      type: HASHTAG_UNFOLLOW_SUCCESS,
      name: tag.name,
      tag: { ...tag, following: false },
    });

    expect(unfollowed.items.isEmpty()).toBe(true);
  });
});

/* end of followed-tags.test.ts */
