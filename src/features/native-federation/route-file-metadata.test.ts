/*
 * Unfathomably route file metadata tests
 * ---------------------------------------
 *
 * File: route-file-metadata.test.ts
 *
 * Purpose:
 *   Cover safe, deterministic route metadata extraction in the browser.
 *
 * Responsibilities:
 *   - prove GPX name, distance, elevation, and timing extraction
 *   - prove separate and namespace-prefixed GPX segments remain separate
 *   - prove upload media types do not depend on browser file guesses
 *   - prove XML entity declarations are rejected
 *
 * This file intentionally does not test uploads, maps, or reverse geocoding.
 */

import { describe, expect, it } from 'vitest';

import { prepareRouteDataFileForUpload, readRouteFileMetadata } from './route-file-metadata.ts';

describe('readRouteFileMetadata', () => {
  it('derives ordinary trail facts from GPX points', async () => {
    const file = new File([`<?xml version="1.0"?>
      <gpx><trk><name>River Walk</name><trkseg>
        <trkpt lat="43.6500" lon="-79.3800"><ele>100</ele><time>2026-08-01T12:00:00Z</time></trkpt>
        <trkpt lat="43.6510" lon="-79.3800"><ele>112</ele><time>2026-08-01T12:10:00Z</time></trkpt>
      </trkseg></trk></gpx>`], 'river-walk.gpx', { type: 'application/gpx+xml' });

    const metadata = await readRouteFileMetadata(file);

    expect(metadata?.title).toBe('River Walk');
    expect(Number(metadata?.fields.distance)).toBeGreaterThan(100);
    expect(metadata?.fields.distance_unit).toBe('m');
    expect(metadata?.fields.elevation_gain).toBe('12');
    expect(metadata?.fields.duration).toBe('600');
    expect(metadata?.fields.start_time).toBe('2026-08-01T12:00:00.000Z');
  });

  it('does not count the gap between separate prefixed GPX segments', async () => {
    const file = new File([`<?xml version="1.0"?>
      <gpx:gpx xmlns:gpx="http://www.topografix.com/GPX/1/1"><gpx:trk><gpx:name>Two Walks</gpx:name>
        <gpx:trkseg>
          <gpx:trkpt lat="43.6500" lon="-79.3800"><gpx:ele>100</gpx:ele></gpx:trkpt>
          <gpx:trkpt lat="43.6510" lon="-79.3800"><gpx:ele>110</gpx:ele></gpx:trkpt>
        </gpx:trkseg>
        <gpx:trkseg>
          <gpx:trkpt lat="45.5000" lon="-73.5700"><gpx:ele>200</gpx:ele></gpx:trkpt>
          <gpx:trkpt lat="45.5010" lon="-73.5700"><gpx:ele>205</gpx:ele></gpx:trkpt>
        </gpx:trkseg>
      </gpx:trk></gpx:gpx>`], 'two-walks.gpx', { type: 'text/plain' });

    const metadata = await readRouteFileMetadata(file);

    expect(metadata?.title).toBe('Two Walks');
    expect(metadata?.pointCount).toBe(4);
    expect(metadata?.segmentCount).toBe(2);
    expect(Number(metadata?.fields.distance)).toBeLessThan(1_000);
    expect(metadata?.fields.elevation_gain).toBe('15');
  });

  it('normalizes route upload media types', () => {
    const source = new File(['<gpx/>'], 'route.gpx', { type: 'text/plain' });
    const prepared = prepareRouteDataFileForUpload(source);

    expect(prepared.name).toBe('route.gpx');
    expect(prepared.type).toBe('application/gpx+xml');
    expect(prepared.lastModified).toBe(source.lastModified);
  });

  it('rejects XML entity declarations', async () => {
    const file = new File([
      '<!DOCTYPE gpx [<!ENTITY unsafe SYSTEM "file:///etc/passwd">]><gpx><trkpt lat="1" lon="1"/><trkpt lat="2" lon="2"/></gpx>',
    ], 'unsafe.gpx', { type: 'application/gpx+xml' });

    await expect(readRouteFileMetadata(file)).resolves.toBeNull();
  });
});

/* end of route-file-metadata.test.ts */
