/*
 * Unfathomably FASP discovery disclosure
 * ---------------------------------------
 *
 * File: useFaspDiscoveryProviders.ts
 *
 * Purpose:
 *   Load the third-party providers that may participate in account discovery.
 *
 * Responsibilities:
 *   - validate the backend's public provider disclosure
 *   - retain provider names, HTTPS origins, and HTTPS privacy policies
 *   - avoid requesting disclosure when account discovery is not being used
 *
 * This file intentionally does not register providers, activate capabilities,
 * send search terms, or infer which provider returned a specific account.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

interface FaspPrivacyPolicy {
  language: string;
  url: string;
}

export interface FaspDiscoveryProvider {
  base_url: string;
  name: string;
  privacy_policy: FaspPrivacyPolicy[];
}

interface FaspDiscoveryResponse {
  providers: FaspDiscoveryProvider[];
}

const emptyResponse: FaspDiscoveryResponse = { providers: [] };

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';
const stringValue = (value: unknown): string | undefined => typeof value === 'string' && value.length > 0 ? value : undefined;

const secureUrl = (value: unknown): string | undefined => {
  const url = stringValue(value);
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
};

const normalizePolicy = (value: unknown): FaspPrivacyPolicy | null => {
  if (!isRecord(value)) return null;

  const language = stringValue(value.language);
  const url = secureUrl(value.url);
  return language && url ? { language, url } : null;
};

const normalizeProvider = (value: unknown): FaspDiscoveryProvider | null => {
  if (!isRecord(value)) return null;

  const baseUrl = secureUrl(value.base_url);
  const name = stringValue(value.name);

  if (!baseUrl || !name) return null;

  return {
    base_url: baseUrl,
    name,
    privacy_policy: Array.isArray(value.privacy_policy)
      ? value.privacy_policy.map(normalizePolicy).filter((policy): policy is FaspPrivacyPolicy => policy !== null)
      : [],
  };
};

const normalizeResponse = (value: unknown): FaspDiscoveryResponse => {
  if (!isRecord(value) || !Array.isArray(value.providers)) return emptyResponse;

  return {
    providers: value.providers
      .map(normalizeProvider)
      .filter((provider): provider is FaspDiscoveryProvider => provider !== null),
  };
};

export const useFaspDiscoveryProviders = (enabled: boolean) => {
  const api = useApi();

  const result = useQuery<FaspDiscoveryResponse>({
    queryKey: ['faspDiscoveryProviders', api.baseUrl],
    queryFn: async () => {
      const response = await api.get('/fasp/providers');
      return normalizeResponse(await response.json());
    },
    enabled,
    staleTime: 15 * 60 * 1000,
    placeholderData: emptyResponse,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of useFaspDiscoveryProviders.ts */
