/*
 * Project: Unfathomably FE
 *
 * File: native-federation/worlds-route.ts
 *
 * Purpose:
 *   Resolve the native presentation family selected by a Worlds route.
 *
 * Responsibilities:
 *   - prefer the match parameters supplied by WrappedRoute
 *   - retain a pathname fallback for nested page layouts
 *   - decode a bounded single route segment without throwing
 *
 * This file intentionally does NOT validate presentation family names or
 * choose the active Worlds tab.
 */

const WORLDS_FAMILY_PATH = /^\/worlds\/([^/]+)\/?$/;

const decodeRouteSegment = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const resolveWorldsRouteFamily = (
  matchedFamily: string | undefined,
  pathname: string,
): string | undefined => {
  const routeSegment = matchedFamily || WORLDS_FAMILY_PATH.exec(pathname)?.[1];

  return routeSegment ? decodeRouteSegment(routeSegment) : undefined;
};

export { resolveWorldsRouteFamily };

/* end of src/features/native-federation/worlds-route.ts */
