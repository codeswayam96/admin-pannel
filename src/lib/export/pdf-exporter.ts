import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFExportOptions {
  title?: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
}

/**
 * Export data table to PDF format
 */
export async function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; header: string }[],
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    title = 'Data Export',
    subtitle = `Generated on ${new Date().toLocaleDateString()}`,
    orientation = 'landscape',
    format = 'a4',
  } = options;

  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Determine columns to export
  const exportColumns = columns || Object.keys(data[0]).slice(0, 8).map((key) => ({
    key: key as keyof T,
    header: key.toString().replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  // Create PDF document
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, margin + 5);

  // Add subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(subtitle, margin, margin + 12);

  // Reset text color
  doc.setTextColor(0);

  // Table settings
  const startY = margin + 20;
  const cellPadding = 3;
  const headerHeight = 10;
  const rowHeight = 8;
  const colWidth = contentWidth / exportColumns.length;

  // Draw table header
  doc.setFillColor(59, 130, 246); // Blue
  doc.rect(margin, startY, contentWidth, headerHeight, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255);

  exportColumns.forEach((col, index) => {
    const x = margin + index * colWidth + cellPadding;
    doc.text(col.header, x, startY + headerHeight - 3, { maxWidth: colWidth - cellPadding * 2 });
  });

  // Draw table rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.setFontSize(8);

  let currentY = startY + headerHeight;
  const maxRowsPerPage = Math.floor((pageHeight - currentY - margin) / rowHeight);

  data.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (rowIndex > 0 && rowIndex % maxRowsPerPage === 0) {
      doc.addPage();
      currentY = margin;

      // Redraw header on new page
      doc.setFillColor(59, 130, 246);
      doc.rect(margin, currentY, contentWidth, headerHeight, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255);

      exportColumns.forEach((col, index) => {
        const x = margin + index * colWidth + cellPadding;
        doc.text(col.header, x, currentY + headerHeight - 3, { maxWidth: colWidth - cellPadding * 2 });
      });

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);
      doc.setFontSize(8);
      currentY += headerHeight;
    }

    // Alternate row colors
    if (rowIndex % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
    }

    // Draw cell content
    exportColumns.forEach((col, colIndex) => {
      const value = row[col.key];
      const x = margin + colIndex * colWidth + cellPadding;
      let text = '';

      if (value === null || value === undefined) {
        text = '-';
      } else if (typeof value === 'boolean') {
        text = value ? 'Yes' : 'No';
      } else if (value instanceof Date) {
        text = value.toLocaleDateString();
      } else if (typeof value === 'object') {
        text = JSON.stringify(value).substring(0, 20) + '...';
      } else {
        text = String(value).substring(0, 30);
      }

      doc.text(text, x, currentY + rowHeight - 2, { maxWidth: colWidth - cellPadding * 2 });
    });

    currentY += rowHeight;
  });

  // Draw table border
  doc.setDrawColor(200);
  doc.rect(margin, startY, contentWidth, currentY - startY);

  // Add footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin - 20,
      pageHeight - 10
    );
    doc.text(
      'CodeSwayam Admin Panel',
      margin,
      pageHeight - 10
    );
  }

  // Save PDF
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Export a DOM element to PDF (useful for charts/dashboards)
 */
export async function exportElementToPDF(
  elementId: string,
  filename: string,
  options: PDFExportOptions = {}
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: options.orientation || 'landscape',
      unit: 'mm',
      format: options.format || 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (options.title) {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(options.title, 10, 15);
    }

    const startY = options.title ? 25 : 10;
    pdf.addImage(imgData, 'PNG', 10, startY, imgWidth, Math.min(imgHeight, pageHeight - startY - 10));

    pdf.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch {
    // Export errors are non-critical; silently fail to avoid exposing internals
  }
}
