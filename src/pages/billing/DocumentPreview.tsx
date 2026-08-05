import React, { useEffect, useRef, useState } from 'react';

// 210mm at 96dpi — matches DocumentPage's `width: '210mm'`. Scaling via a CSS
// transform (not shrinking font sizes) keeps the preview a faithful miniature
// of what actually prints/exports.
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123; // 297mm at 96dpi — used only as a first-paint guess before ResizeObserver reports the real height

type ZoomMode = 'fit' | '50' | '100';

// The preview's scale transform lives directly on the same node passed to
// renderNodeToPdf (see DocumentPreviewProps.contentRef below), so PDF export
// must run with that transform switched off — otherwise html2canvas would
// rasterize the zoomed-down preview instead of the true-size document. This
// wraps any capture call so callers don't have to remember the reset.
export async function captureUnscaled<T>(node: HTMLElement, capture: () => Promise<T>): Promise<T> {
  const prevTransform = node.style.transform;
  node.style.transform = 'none';
  try {
    return await capture();
  } finally {
    node.style.transform = prevTransform;
  }
}

interface DocumentPreviewProps {
  // Ref to the actual (unscaled, true-A4-size) content node — the same node
  // src/utils/pdfExport.ts rasterizes. The transform lives on this node, so
  // callers must neutralize it (style.transform = 'none') immediately before
  // calling renderNodeToPdf and restore it after, so html2canvas always
  // captures true-size content regardless of the current preview zoom.
  contentRef: React.RefObject<HTMLDivElement | null>;
  pageCount?: number;
  children: React.ReactNode;
}

// Fit-to-page live preview: renders the document at true A4 proportions and
// scales the whole thing down with a CSS transform to fit the pane, so what
// you approve here is pixel-for-pixel what prints — never achieved by
// shrinking font sizes. Recomputes on container resize (ResizeObserver), not
// just once on mount, so it keeps fitting as the pane's own size changes
// (window resize, sidebar collapse, etc).
export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ contentRef, pageCount = 1, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.6);
  const [contentHeight, setContentHeight] = useState(A4_HEIGHT_PX * pageCount);
  const [zoom, setZoom] = useState<ZoomMode>('fit');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      if (width > 0) setFitScale(Math.min(1, (width - 16) / A4_WIDTH_PX));
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Tracks the content's true (unscaled) height so the scroll container's
  // own box can be sized to `height * scale` — otherwise a transform:scale()
  // child leaves its parent's layout box at the pre-scale height, either
  // stranding blank space (scale < 1) or clipping the page (scale > 1 cases
  // aside, still wrong for 2-page documents at fit-scale).
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const ro = new ResizeObserver((entries) => {
      const height = entries[0].contentRect.height;
      if (height > 0) setContentHeight(height);
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, [contentRef]);

  const scale = zoom === 'fit' ? fitScale : zoom === '50' ? 0.5 : 1;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 text-xs">
          {(['fit', '50', '100'] as ZoomMode[]).map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setZoom(z)}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                zoom === z ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {z === 'fit' ? 'Fit' : `${z}%`}
            </button>
          ))}
        </div>
        {pageCount > 1 && <span className="text-xs font-medium text-gray-500">{pageCount} pages</span>}
      </div>
      <div
        ref={containerRef}
        className="preview-scroll-root w-full overflow-auto rounded-xl border border-gray-200 bg-gray-100 p-2"
        style={{ maxHeight: '82vh' }}
      >
        <div className="preview-size-root" style={{ width: A4_WIDTH_PX * scale, height: contentHeight * scale, margin: '0 auto' }}>
          <div
            ref={contentRef}
            className="preview-scale-root"
            style={{ width: A4_WIDTH_PX, transform: `scale(${scale})`, transformOrigin: 'top left' }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
