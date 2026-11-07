import { useEffect } from 'react';
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const navigate = (event: Event) => { if (!window.confirm('You have unsaved changes. Leave this form? Your draft remains in this tab.')) event.preventDefault(); };
    window.addEventListener('beforeunload', unload);
    window.addEventListener('nova-before-navigate', navigate);
    return () => { window.removeEventListener('beforeunload', unload); window.removeEventListener('nova-before-navigate', navigate); };
  }, [dirty]);
}
