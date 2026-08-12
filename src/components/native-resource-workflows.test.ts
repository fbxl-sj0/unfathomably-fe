/*
  Project: Unfathomably FE native federation
  -------------------------------------------

  File: src/components/native-resource-workflows.test.ts

  Purpose: Cover the safety boundary for route coordinates and model links.

  This file intentionally does NOT render maps or fetch remote resources.
*/

import { describe, expect, it } from 'vitest';

import { describeModelResource, parseRouteCoordinates } from './native-resource-workflows.ts';

describe('native resource workflows', () => {
  it('accepts finite route coordinates and rejects invalid ranges', () => {
    expect(parseRouteCoordinates('44.5', '-79.3')).toEqual([44.5, -79.3]);
    expect(parseRouteCoordinates(91, 0)).toBeNull();
    expect(parseRouteCoordinates('not-a-number', 0)).toBeNull();
  });

  it('describes a direct model file without requesting it', () => {
    expect(describeModelResource('https://models.example/files/knob.stl', '', 'model/stl')).toEqual({
      fileName: 'knob.stl',
      format: 'model/stl',
      isDirectFile: true,
      url: 'https://models.example/files/knob.stl',
    });
  });

  it('rejects executable and malformed resource schemes', () => {
    expect(describeModelResource('javascript:alert(1)', null, null)).toBeNull();
    expect(describeModelResource('not a url', null, null)).toBeNull();
  });
});

/* end of native-resource-workflows.test.ts */
