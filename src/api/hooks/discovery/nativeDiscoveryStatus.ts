/*
 * Unfathomably native discovery status references
 * ------------------------------------------------
 *
 * File: nativeDiscoveryStatus.ts
 *
 * Purpose:
 *   Preserve a backend-provided local status identity while heterogeneous
 *   native discovery records are normalized for their specialized views.
 *
 * Responsibilities:
 *   - accept only bounded non-empty local status identifiers
 *   - attach the identifier without changing each discovery item's public type
 *   - expose one safe reader for the shared status-backed renderer
 *
 * This file intentionally does not fetch statuses, resolve remote objects, or
 * decide whether a source-only native record should have social controls.
 */

interface NativeDiscoveryStatusReference {
  current_status_id?: string;
  revision_status_id?: string;
  status_id?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const statusId = (value: unknown): string | undefined => (
  typeof value === 'string' && value.length > 0 && value.length <= 128 ? value : undefined
);

const withNativeDiscoveryStatus = <T extends object>(item: T | null, source: unknown): T | null => {
  if (!item || !isRecord(source)) return item;

  const currentStatusId = statusId(source.current_status_id) || statusId(source.status_id);
  const revisionStatusId = statusId(source.revision_status_id) || currentStatusId;

  return currentStatusId
    ? Object.assign(item, {
      current_status_id: currentStatusId,
      revision_status_id: revisionStatusId,
      status_id: currentStatusId,
    })
    : item;
};

const nativeDiscoveryStatusId = (item: unknown): string | undefined => (
  isRecord(item)
    ? statusId((item as NativeDiscoveryStatusReference).current_status_id)
      || statusId((item as NativeDiscoveryStatusReference).status_id)
    : undefined
);

const nativeDiscoveryRevisionStatusId = (item: unknown): string | undefined => (
  isRecord(item)
    ? statusId((item as NativeDiscoveryStatusReference).revision_status_id)
      || nativeDiscoveryStatusId(item)
    : undefined
);

export { nativeDiscoveryRevisionStatusId, nativeDiscoveryStatusId, withNativeDiscoveryStatus };

/* end of nativeDiscoveryStatus.ts */
