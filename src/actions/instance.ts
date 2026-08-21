import { createAsyncThunk } from '@reduxjs/toolkit';

import { instanceV1Schema, instanceV2Schema, upgradeInstance } from '@/schemas/instance.ts';
import { RootState } from '@/store.ts';
import { getAuthUserUrl, getMeUrl } from '@/utils/auth.ts';
import { getFeatures } from '@/utils/features.ts';

import api from '../api/index.ts';

/** Figure out the appropriate instance to fetch depending on the state */
export const getHost = (state: RootState) => {
  const accountUrl = getMeUrl(state) || getAuthUserUrl(state) as string;

  try {
    return new URL(accountUrl).host;
  } catch {
    return null;
  }
};

interface InstanceData {
  instance: Record<string, any>;
  host: string | null | undefined;
}

export const fetchInstance = createAsyncThunk<InstanceData, InstanceData['host'], { state: RootState }>(
  'instance/fetch',
  async(host, { getState, rejectWithValue }) => {
    try {
      const v1Response = await api(getState).get('/api/v1/instance');
      const v1Data = await v1Response.json();
      const v1Instance = instanceV1Schema.parse(v1Data);
      const fallbackInstance = upgradeInstance(v1Instance);

      if (getFeatures(v1Instance).instanceV2) {
        try {
          const v2Response = await api(getState).get('/api/v2/instance');
          const v2Data = await v2Response.json();
          return { instance: instanceV2Schema.parse(v2Data), host };
        } catch {
          // A backend may overstate v2 support during an upgrade. V1 remains
          // the universal compatibility contract and is already validated.
        }
      }

      return { instance: fallbackInstance, host };
    } catch (e) {
      return rejectWithValue(e);
    }
  },
);

export const fetchInstanceV2 = createAsyncThunk<InstanceData, InstanceData['host'], { state: RootState }>(
  'instanceV2/fetch',
  async(host, { getState, rejectWithValue }) => {
    try {
      const response = await api(getState).get('/api/v2/instance');
      const data = await response.json();
      const instance = instanceV2Schema.parse(data);
      return { instance, host };
    } catch (e) {
      return rejectWithValue(e);
    }
  },
);
