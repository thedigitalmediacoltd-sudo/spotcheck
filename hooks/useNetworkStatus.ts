import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable ?? null);
    });

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable ?? null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Consider offline if not connected OR internet is explicitly not reachable
  const isOffline = isConnected === false || isInternetReachable === false;

  return {
    isConnected: isConnected === true,
    isInternetReachable: isInternetReachable === true,
    isOffline,
  };
}
