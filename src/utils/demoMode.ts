import toast from 'react-hot-toast';

export const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

/** Demo keeps CRUD functional but prevents contacting actual people/services. */
export function installDemoMode() {
  if (!isDemo) return;
  const base = new URL(import.meta.env.VITE_CRM_API_BASE_URL);
  if (!base.hostname.endsWith('.lambda-url.ap-south-1.on.aws')) throw new Error('Configure the isolated demo API before sharing this build.');
  const banner = document.createElement('div');
  banner.setAttribute('role', 'note');
  banner.dataset.demoNotice = 'true';
  banner.textContent = 'CLIENT DEMO · Sample data only · Changes reset nightly · Calls and messages are simulated';
  banner.style.cssText = 'position:relative;z-index:10;background:#153b32;color:white;text-align:center;padding:10px 16px;font:600 12px/1.5 system-ui;';
  document.body.prepend(banner);
  // The admin menu is fixed to the viewport; reserve the notice's visible
  // height, including wrapped mobile text, and release it as the notice scrolls.
  const style = document.createElement('style');
  style.textContent = 'button[aria-label="Open admin menu"]{top:calc(var(--demo-notice-visible-height, 0px) + 12px)}';
  document.head.appendChild(style);
  const updateNoticeHeight = () => document.documentElement.style.setProperty('--demo-notice-visible-height', `${Math.max(0, banner.getBoundingClientRect().bottom)}px`);
  new ResizeObserver(updateNoticeHeight).observe(banner);
  window.addEventListener('scroll', updateNoticeHeight, { passive: true });
  updateNoticeHeight();
  const block = () => toast('Demo only: no real call, message or external share was sent.');
  const forbidden = (value: string) => /^(tel:|mailto:|sms:)|^https?:\/\/(?:[^/]+\.)?(?:wa\.me|whatsapp\.com|instagram\.com|youtube\.com|facebook\.com|linkedin\.com|twitter\.com|x\.com|novanest\.co\.in)(?:\/|$)/i.test(value);
  document.addEventListener('click', event => {
    const anchor = (event.target as Element)?.closest?.('a');
    if (anchor && forbidden(anchor.href)) { event.preventDefault(); event.stopImmediatePropagation(); block(); }
  }, true);
  const open = window.open.bind(window);
  window.open = ((url?: string | URL, ...rest: any[]) => {
    if (url && forbidden(String(url))) { block(); return null; }
    return open(url, ...rest);
  }) as typeof window.open;
  if (navigator.share) Object.defineProperty(navigator, 'share', { value: async () => { block(); }, configurable: true });
}
