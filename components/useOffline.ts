import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useOffline() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const offline = !(state.isConnected ?? true);
      setIsOffline(offline);
    });
    return () => unsub();
  }, []);

  return { isOffline };
}
