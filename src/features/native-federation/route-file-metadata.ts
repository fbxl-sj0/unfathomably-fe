/*
 * Unfathomably route file metadata
 * ---------------------------------
 *
 * File: route-file-metadata.ts
 *
 * Purpose:
 *   Derive ordinary trail facts from user-selected GPS files before upload.
 *
 * Responsibilities:
 *   - parse bounded GPX, TCX, and KML text files in the browser
 *   - preserve route segment boundaries while deriving aggregate facts
 *   - derive a title, distance, elevation change, and recorded timing
 *   - normalize route upload media types when browsers provide weak defaults
 *   - reject XML declarations that could carry external entity definitions
 *
 * This file intentionally does not upload files, reverse-geocode private
 * coordinates, parse binary FIT data, draw maps, or alter the source file.
 */

export interface RouteFileMetadata {
  fields: Record<string, string>;
  pointCount: number;
  segmentCount: number;
  title?: string;
}

interface RoutePoint {
  elevation?: number;
  latitude: number;
  longitude: number;
  time?: number;
}

const maximumTextFileSize = 8 * 1024 * 1024;
const maximumPointCount = 100_000;
const routeExtensions = ['.fit', '.gpx', '.kml', '.tcx'];
const routeMediaTypes: Record<string, string> = {
  '.fit': 'application/vnd.ant.fit',
  '.gpx': 'application/gpx+xml',
  '.kml': 'application/vnd.google-earth.kml+xml',
  '.tcx': 'application/vnd.garmin.tcx+xml',
};

const finiteCoordinate = (value: string | null, minimum: number, maximum: number): number | undefined => {
  if (value === null) return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum ? number : undefined;
};

const elementsByLocalName = (root: Document | Element, localName: string): Element[] => (
  Array.from(root.getElementsByTagName('*')).filter((element) => element.localName.toLowerCase() === localName)
);

const directChildrenByLocalName = (element: Element, localName: string): Element[] => (
  Array.from(element.children).filter((child) => child.localName.toLowerCase() === localName)
);

const childText = (element: Element, localName: string): string | undefined => {
  const value = directChildrenByLocalName(element, localName)[0]?.textContent?.trim();
  return value || undefined;
};

const pointFromGpx = (element: Element): RoutePoint | null => {
  const latitude = finiteCoordinate(element.getAttribute('lat'), -90, 90);
  const longitude = finiteCoordinate(element.getAttribute('lon'), -180, 180);
  if (latitude === undefined || longitude === undefined) return null;

  const elevation = Number(childText(element, 'ele'));
  const time = Date.parse(childText(element, 'time') || '');

  return {
    latitude,
    longitude,
    elevation: Number.isFinite(elevation) ? elevation : undefined,
    time: Number.isFinite(time) ? time : undefined,
  };
};

const pointFromTcx = (element: Element): RoutePoint | null => {
  const position = elementsByLocalName(element, 'position')[0];
  const latitude = finiteCoordinate(position ? childText(position, 'latitudedegrees') || null : null, -90, 90);
  const longitude = finiteCoordinate(position ? childText(position, 'longitudedegrees') || null : null, -180, 180);
  if (latitude === undefined || longitude === undefined) return null;

  const elevation = Number(childText(element, 'altitudemeters'));
  const time = Date.parse(childText(element, 'time') || '');

  return {
    latitude,
    longitude,
    elevation: Number.isFinite(elevation) ? elevation : undefined,
    time: Number.isFinite(time) ? time : undefined,
  };
};

const boundedSegments = (
  containers: Element[],
  pointElements: (container: Element) => Element[],
  pointFromElement: (element: Element) => RoutePoint | null,
  pointBudget: { remaining: number } = { remaining: maximumPointCount },
): RoutePoint[][] => {
  const segments: RoutePoint[][] = [];

  for (const container of containers) {
    if (pointBudget.remaining <= 0) break;

    const points = pointElements(container)
      .slice(0, pointBudget.remaining)
      .flatMap((element) => pointFromElement(element) || []);

    pointBudget.remaining -= points.length;
    if (points.length > 0) segments.push(points);
  }

  return segments;
};

const segmentsFromGpx = (document: Document): RoutePoint[][] => {
  const pointBudget = { remaining: maximumPointCount };
  const trackSegments = boundedSegments(
    elementsByLocalName(document, 'trkseg'),
    (segment) => directChildrenByLocalName(segment, 'trkpt'),
    pointFromGpx,
    pointBudget,
  );
  const routeSegments = boundedSegments(
    elementsByLocalName(document, 'rte'),
    (route) => directChildrenByLocalName(route, 'rtept'),
    pointFromGpx,
    pointBudget,
  );
  const segments = [...trackSegments, ...routeSegments];

  if (segments.length > 0) return segments;

  const legacyPoints = [
    ...elementsByLocalName(document, 'trkpt'),
    ...elementsByLocalName(document, 'rtept'),
  ].slice(0, maximumPointCount).flatMap((element) => pointFromGpx(element) || []);

  return legacyPoints.length > 0 ? [legacyPoints] : [];
};

const segmentsFromTcx = (document: Document): RoutePoint[][] => boundedSegments(
  elementsByLocalName(document, 'track'),
  (track) => elementsByLocalName(track, 'trackpoint'),
  pointFromTcx,
);

const segmentsFromKml = (document: Document): RoutePoint[][] => {
  const segments: RoutePoint[][] = [];
  let pointCount = 0;

  for (const coordinates of elementsByLocalName(document, 'coordinates')) {
    const segment: RoutePoint[] = [];

    for (const tuple of (coordinates.textContent || '').trim().split(/\s+/)) {
      if (pointCount >= maximumPointCount) return segments;
      const [longitudeText, latitudeText, elevationText] = tuple.split(',');
      const latitude = finiteCoordinate(latitudeText || null, -90, 90);
      const longitude = finiteCoordinate(longitudeText || null, -180, 180);
      if (latitude === undefined || longitude === undefined) continue;

      const elevation = Number(elevationText);
      segment.push({
        latitude,
        longitude,
        elevation: Number.isFinite(elevation) ? elevation : undefined,
      });
      pointCount += 1;
    }

    if (segment.length > 0) segments.push(segment);
  }

  return segments;
};

const radians = (degrees: number): number => degrees * Math.PI / 180;

const distanceBetween = (left: RoutePoint, right: RoutePoint): number => {
  const latitudeDelta = radians(right.latitude - left.latitude);
  const longitudeDelta = radians(right.longitude - left.longitude);
  const leftLatitude = radians(left.latitude);
  const rightLatitude = radians(right.latitude);
  const chord = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 6_371_000 * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(Math.max(0, 1 - chord)));
};

const derivedFields = (segments: RoutePoint[][]): Record<string, string> => {
  let distance = 0;
  let elevationGain = 0;
  let elevationLoss = 0;

  for (const points of segments) {
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const current = points[index];
      distance += distanceBetween(previous, current);

      if (previous.elevation !== undefined && current.elevation !== undefined) {
        const change = current.elevation - previous.elevation;
        if (change > 0) elevationGain += change;
        if (change < 0) elevationLoss += Math.abs(change);
      }
    }
  }

  const fields: Record<string, string> = {
    distance: distance.toFixed(0),
    distance_unit: 'm',
  };

  if (elevationGain > 0) fields.elevation_gain = elevationGain.toFixed(0);
  if (elevationLoss > 0) fields.elevation_loss = elevationLoss.toFixed(0);

  const timedPoints = segments
    .flat()
    .filter((point): point is RoutePoint & { time: number } => point.time !== undefined);
  if (timedPoints.length >= 2) {
    const duration = Math.max(0, timedPoints[timedPoints.length - 1].time - timedPoints[0].time);
    fields.duration = String(Math.round(duration / 1000));
    fields.start_time = new Date(timedPoints[0].time).toISOString();
  }

  return fields;
};

const titleFromFileName = (name: string): string | undefined => {
  const title = name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  return title || undefined;
};

export const isRouteDataFile = (file: File): boolean => {
  const name = file.name.toLowerCase();
  return routeExtensions.some((extension) => name.endsWith(extension));
};

export const prepareRouteDataFileForUpload = (file: File): File => {
  const name = file.name.toLowerCase();
  const extension = routeExtensions.find((candidate) => name.endsWith(candidate));
  const mediaType = extension ? routeMediaTypes[extension] : undefined;

  if (!mediaType || file.type === mediaType) return file;

  return new File([file], file.name, {
    lastModified: file.lastModified,
    type: mediaType,
  });
};

export const readRouteFileMetadata = async (file: File): Promise<RouteFileMetadata | null> => {
  const name = file.name.toLowerCase();
  if (!isRouteDataFile(file) || name.endsWith('.fit') || file.size > maximumTextFileSize) return null;

  const source = await file.text();
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) return null;

  const document = new DOMParser().parseFromString(source, 'application/xml');
  if (document.querySelector('parsererror')) return null;

  let segments: RoutePoint[][];
  let title: string | undefined;

  if (name.endsWith('.gpx')) {
    segments = segmentsFromGpx(document);
    const titleContainer = [
      ...elementsByLocalName(document, 'metadata'),
      ...elementsByLocalName(document, 'trk'),
      ...elementsByLocalName(document, 'rte'),
    ].find((element) => childText(element, 'name'));
    title = titleContainer ? childText(titleContainer, 'name') : undefined;
  } else if (name.endsWith('.tcx')) {
    segments = segmentsFromTcx(document);
    const activity = elementsByLocalName(document, 'activity')[0];
    title = activity ? childText(activity, 'id') : undefined;
  } else {
    segments = segmentsFromKml(document);
    const titleContainer = [
      ...elementsByLocalName(document, 'document'),
      ...elementsByLocalName(document, 'placemark'),
    ].find((element) => childText(element, 'name'));
    title = titleContainer ? childText(titleContainer, 'name') : undefined;
  }

  const pointCount = segments.reduce((count, segment) => count + segment.length, 0);
  if (pointCount < 2) return null;

  return {
    fields: derivedFields(segments),
    pointCount,
    segmentCount: segments.length,
    title: title?.slice(0, 200) || titleFromFileName(file.name),
  };
};

/* end of route-file-metadata.ts */
