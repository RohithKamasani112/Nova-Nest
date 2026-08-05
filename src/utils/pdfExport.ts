import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Rasterizes rendered billing-document DOM node(s) into an A4 PDF Blob,
// entirely client-side — no backend and no manual print dialog, so "Save"
// can upload the result straight to S3 in one step. This is why every
// billing template uses plain inline styles rather than Tailwind's
// CSS-variable driven classes: html2canvas rasterizes computed styles, and
// hex/rgb values are the most reliably reproduced across browsers.
//
// Multi-page support: each page of a document is its own child element
// marked `data-pdf-page` inside `container`, already sized to true A4
// (210mm x 297mm) — e.g. the 2-page Sale Booking Confirmation. Each page node
// is rasterized independently and appended to the PDF with addPage(), so the
// output is a real multi-page PDF rather than one squashed image. If no
// `data-pdf-page` children exist, the whole container is treated as a single
// page (the 1-page Commission/Service invoices).
export const renderNodeToPdf = async (
  container: HTMLElement,
  orientation: 'portrait' | 'landscape' = 'portrait'
): Promise<Blob> => {
  const pageNodes = Array.from(
    container.querySelectorAll<HTMLElement>('[data-pdf-page]')
  );
  const pages = pageNodes.length > 0 ? pageNodes : [container];

  const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const [pageWidthMm, pageHeightMm] = orientation === 'landscape' ? [297, 210] : [210, 297];

  for (let i = 0; i < pages.length; i += 1) {
    const canvas = await html2canvas(pages[i], {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    const imgData = canvas.toDataURL('image/png');

    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidthMm, pageHeightMm);
  }

  return pdf.output('blob');
};
