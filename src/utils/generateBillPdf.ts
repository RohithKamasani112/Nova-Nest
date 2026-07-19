import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Rasterizes the rendered bill letterhead DOM node into a single-page A4 PDF
// Blob, entirely client-side — no backend and no manual print dialog, so
// "Save Bill" can upload the result straight to S3 in one step. This is why
// the letterhead uses plain inline styles rather than Tailwind's CSS-variable
// driven classes: html2canvas rasterizes computed styles, and hex/rgb values
// are the most reliably reproduced across browsers.
//
// The node itself is styled to true A4 dimensions (210mm x 297mm), so its
// captured canvas already has the correct 210:297 aspect ratio — the image
// is placed full-bleed at 0,0 rather than being fitted/centered with margins.
export const generateBillPdf = async (node: HTMLElement): Promise<Blob> => {
  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);

  return pdf.output('blob');
};
