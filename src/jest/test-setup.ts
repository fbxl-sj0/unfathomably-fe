import { act } from '@testing-library/react';
import { enableMapSet } from 'immer';
import { toast } from 'react-hot-toast';

import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { afterEach, vi } from 'vitest';

import { queryClient } from '@/queries/client.ts';

enableMapSet();

const createMemoryStorage = (): Storage => {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.get(String(key)) ?? null;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key) {
      values.delete(String(key));
    },
    setItem(key, value) {
      values.set(String(key), String(value));
    },
  };
};

const installMemoryStorage = (property: 'localStorage' | 'sessionStorage'): void => {
  Object.defineProperty(window, property, {
    configurable: true,
    writable: true,
    value: createMemoryStorage(),
  });
};

installMemoryStorage('localStorage');
installMemoryStorage('sessionStorage');

// Query mocking
vi.mock('soapbox/queries/client');

// Clear toasts after each test.
afterEach(() => {
  act(() => {
    toast.remove();
  });
  queryClient.clear();
});

const intersectionObserverMock = () => ({ observe: () => null, disconnect: () => null });
window.IntersectionObserver = vi.fn().mockImplementation(intersectionObserverMock);

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
