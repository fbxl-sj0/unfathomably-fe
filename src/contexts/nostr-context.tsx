import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useInstance } from '@/hooks/useInstance.ts';

import type { NRelay1 } from '@nostrify/nostrify';

interface NostrContextType {
  relay?: NRelay1;
  isRelayLoading: boolean;
  connectionRequested: boolean;
  requestRelayConnection: () => void;
}

const NostrContext = createContext<NostrContextType | undefined>(undefined);

interface NostrProviderProps {
  children: React.ReactNode;
}

export const NostrProvider: React.FC<NostrProviderProps> = ({ children }) => {
  const { instance } = useInstance();

  const [relay, setRelay] = useState<NRelay1>();
  const [isRelayLoading, setIsRelayLoading] = useState(false);
  const [connectionRequested, setConnectionRequested] = useState(false);

  const relayUrl = instance.nostr?.relay;
  const requestRelayConnection = useCallback(() => {
    setIsRelayLoading(true);
    setConnectionRequested(true);
  }, []);

  useEffect(() => {
    if (!connectionRequested) return;

    if (!relayUrl) {
      setRelay(undefined);
      setIsRelayLoading(false);
      return;
    }

    setRelay(undefined);
    setIsRelayLoading(true);

    let nextRelay: NRelay1 | undefined;
    let socket: WebSocket | undefined;
    let timeout: number | undefined;
    let disposed = false;
    let settled = false;

    const finish = (connected: boolean) => {
      if (settled || disposed) return;

      settled = true;
      if (timeout !== undefined) {
        window.clearTimeout(timeout);
      }
      setRelay(connected ? nextRelay : undefined);
      setIsRelayLoading(false);
    };

    const handleRelayOpen = () => finish(true);
    const handleRelayFailure = () => finish(false);

    void import('@nostrify/nostrify').then(({ NRelay1 }) => {
      if (disposed) return;

      nextRelay = new NRelay1(relayUrl);
      socket = nextRelay.socket.underlyingWebsocket;
      timeout = window.setTimeout(handleRelayFailure, 5000);

      socket.addEventListener('open', handleRelayOpen);
      socket.addEventListener('error', handleRelayFailure);
      socket.addEventListener('close', handleRelayFailure);
    }).catch(handleRelayFailure);

    return () => {
      disposed = true;
      settled = true;
      if (timeout !== undefined) {
        window.clearTimeout(timeout);
      }
      socket?.removeEventListener('open', handleRelayOpen);
      socket?.removeEventListener('error', handleRelayFailure);
      socket?.removeEventListener('close', handleRelayFailure);
      nextRelay?.close();
    };
  }, [connectionRequested, relayUrl]);

  return (
    <NostrContext.Provider
      value={{ relay, isRelayLoading, connectionRequested, requestRelayConnection }}
    >
      {children}
    </NostrContext.Provider>
  );
};

export const useNostr = () => {
  const context = useContext(NostrContext);
  if (context === undefined) {
    throw new Error('useNostr must be used within a NostrProvider');
  }
  return context;
};

export const useConnectedNostr = (enabled = true) => {
  const context = useNostr();

  useEffect(() => {
    if (enabled) context.requestRelayConnection();
  }, [context.requestRelayConnection, enabled]);

  return {
    relay: context.relay,
    isRelayLoading:
      enabled && (!context.connectionRequested || context.isRelayLoading),
  };
};
