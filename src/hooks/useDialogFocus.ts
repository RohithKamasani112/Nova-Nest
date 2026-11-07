import { useEffect, type RefObject } from 'react';
export function useDialogFocus(open: boolean, ref: RefObject<HTMLElement>, onClose: () => void) {
  useEffect(() => {
    if (!open || !ref.current) return;
    const root = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    const candidates = () => Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select,textarea,a[href],[tabindex="0"]'));
    candidates()[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const elements = candidates(); const first = elements[0]; const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    root.addEventListener('keydown', key);
    const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { root.removeEventListener('keydown', key); document.body.style.overflow = overflow; previous?.focus(); };
  }, [open, ref, onClose]);
}
