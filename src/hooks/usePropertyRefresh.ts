import { useEffect, useRef } from 'react';

// Keep open public pages current; pause background-tab polling and serialize reads.
export function usePropertyRefresh(refresh: () => Promise<void>) {
  const latest = useRef(refresh);
  latest.current = refresh;
  useEffect(() => {
    let busy = false;
    const run = async () => {
      if (busy || document.visibilityState === 'hidden') return;
      busy = true;
      try { await latest.current(); } finally { busy = false; }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'nova-properties-changed') void run();
    };
    const timer = window.setInterval(run, 15000);
    window.addEventListener('focus', run);
    document.addEventListener('visibilitychange', run);
    window.addEventListener('nova-properties-changed', run);
    window.addEventListener('storage', onStorage);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', run);
      document.removeEventListener('visibilitychange', run);
      window.removeEventListener('nova-properties-changed', run);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
}
