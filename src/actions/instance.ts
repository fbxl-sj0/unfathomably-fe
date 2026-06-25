import { createAsyncThunk } from '@reduxjs/toolkit';

import { instanceV1Schema, instanceV2Schema, upgradeInstance } from '@/schemas/instance.ts';
import { RootState } from '@/store.ts';
import { getAuthUserUrl, getMeUrl } from '@/utils/auth.ts';

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
      try {
        const response = await api(getState).get('/api/v2/instance');
        const data = await response.json();
        const instance = instanceV2Schema.parse(data);
        return { instance, host };
      } catch {
        const response = await api(getState).get('/api/v1/instance');
        const data = await response.json();
        const instance = upgradeInstance(instanceV1Schema.parse(data));
        return { instance, host };
      }
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
