/*
  Project: Unfathomably FE native federation
  -------------------------------------------

  File: src/components/native-resource-workflows.ts

  Purpose:

      Validate remote route coordinates and describe model resources before
      UI components expose them to users.

  Responsibilities:

      * reject non-finite and out-of-range geographic coordinates
      * accept only HTTP(S) model resource links
      * derive a human-readable model filename and format

  This file intentionally does NOT contain:

      * network requests
      * map rendering
      * 3D model parsing
*/

const modelExtensions = new Set(['3mf', 'amf', 'glb', 'gltf', 'obj', 'ply', 'step', 'stl', 'stp']);

interface ModelResourceDescriptor {
  fileName: string | null;
  format: string | null;
  isDirectFile: boolean;
  url: string;
}

const parseRouteCoordinates = (latitude: unknown, longitude: unknown): [number, number] | null => {
  const parsedLatitude = typeof latitude === 'number' ? latitude : Number(latitude);
  const parsedLongitude = typeof longitude === 'number' ? longitude : Number(longitude);

  if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) return null;
  if (parsedLatitude < -90 || parsedLatitude > 90) return null;
  if (parsedLongitude < -180 || parsedLongitude > 180) return null;

  return [parsedLatitude, parsedLongitude];
};

const describeModelResource = (
  resourceUrl: unknown,
  suppliedName: unknown,
  suppliedFormat: unknown,
): ModelResourceDescriptor | null => {
  if (typeof resourceUrl !== 'string') return null;

  let url: URL;

  try {
    url = new URL(resourceUrl);
  } catch (_error) {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const encodedName = url.pathname.split('/').pop() || '';
  let pathName = encodedName;

  try {
    pathName = decodeURIComponent(encodedName);
  } catch (_error) {
    // A malformed remote escape sequence must not break status rendering.
  }

  pathName = pathName.trim();
  const extension = pathName.includes('.') ? pathName.split('.').pop()!.toLowerCase() : '';
  const suppliedFileName = typeof suppliedName === 'string' ? suppliedName.trim() : '';
  const format = typeof suppliedFormat === 'string' && suppliedFormat.trim()
    ? suppliedFormat.trim()
    : extension || null;

  return {
    fileName: suppliedFileName || pathName || null,
    format,
    isDirectFile: modelExtensions.has(extension),
    url: url.toString(),
  };
};

export { describeModelResource, parseRouteCoordinates };
export type { ModelResourceDescriptor };

/* end of native-resource-workflows.ts */
