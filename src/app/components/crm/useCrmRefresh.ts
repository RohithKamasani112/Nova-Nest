import { useEffect, useRef } from 'react';

// Shared records refresh while the workspace is visible, and on returning to it.
export function useCrmRefresh(refresh: () => void, enabled = true) {
  const latest = useRef(refresh);
  latest.current = refresh;
  useEffect(() => {
    if (!enabled) return;
    const run = () => { if (document.visibilityState === 'visible') latest.current(); };
    const timer = window.setInterval(run, 30_000);
    window.addEventListener('focus', run);
    document.addEventListener('visibilitychange', run);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', run);
      document.removeEventListener('visibilitychange', run);
    };
  }, [enabled]);
}
