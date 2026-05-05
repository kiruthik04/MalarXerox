import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateBillPDF(billData) {
  const { billId, customerName, phone, items, grandTotal, createdAt } = billData;

  // Items might be a JSON string if coming directly from DB
  const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const green = [22, 163, 74];
  const darkGreen = [20, 83, 45];
  const lightGreen = [240, 253, 244];

  // ── Header background ──
  doc.setFillColor(...green);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Shop name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('MALAR XEROX & STUDIO', pageWidth / 2, 16, { align: 'center' });

  // Tagline
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 252, 231);
  doc.text('Printing | E-Services | Stationery | FASTag KYC', pageWidth / 2, 23, { align: 'center' });

  // Address
  doc.setFontSize(8);
  doc.text('Sathy Rd, North Rangasamuthram, Sathyamangalam, TN 638402', pageWidth / 2, 29, { align: 'center' });
  doc.text('Ph: 9865325212  |  WhatsApp: 9443933539  |  malarsathy@gmail.com', pageWidth / 2, 35, { align: 'center' });

  // ── TAX INVOICE label ──
  doc.setFillColor(...lightGreen);
  doc.roundedRect(0, 44, pageWidth, 10, 0, 0, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkGreen);
  doc.text('TAX INVOICE / RECEIPT', pageWidth / 2, 51, { align: 'center' });

  // ── Bill Info ──
  const infoY = 60;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);

  // Left: Customer info
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 14, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(customerName ? customerName : 'Walk-in Customer', 14, infoY + 6);
  if (phone) doc.text(`Ph: ${phone}`, 14, infoY + 12);

  // Right: Bill details
  doc.setFont('helvetica', 'bold');
  doc.text(`Bill No: #${String(billId).padStart(5, '0')}`, pageWidth - 14, infoY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  const dateStr = createdAt ? new Date(createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
  doc.text(`Date: ${dateStr}`, pageWidth - 14, infoY + 6, { align: 'right' });

  // Divider
  doc.setDrawColor(...green);
  doc.setLineWidth(0.5);
  doc.line(14, infoY + 18, pageWidth - 14, infoY + 18);

  // ── Items Table ──
  autoTable(doc, {
    startY: infoY + 22,
    head: [['#', 'Service / Product', 'Qty', 'Unit Price', 'Total']],
    body: (parsedItems || []).map((item, i) => [
      i + 1,
      { 
        content: item.service + (item.note ? `\n(${item.note})` : ''), 
        styles: { fontStyle: item.note ? 'normal' : 'bold' } 
      },
      item.qty,
      `Rs. ${parseFloat(item.price).toFixed(2)}`,
      `Rs. ${parseFloat(item.total).toFixed(2)}`,
    ]),
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
      textColor: [31, 41, 55],
    },
    headStyles: {
      fillColor: green,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: [249, 255, 254] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
    theme: 'grid',
    margin: { left: 14, right: 14 },
  });

  const finalY = doc.lastAutoTable.finalY + 6;

  // ── Total Box ──
  doc.setFillColor(...lightGreen);
  doc.roundedRect(pageWidth - 80, finalY, 66, 18, 3, 3, 'F');
  doc.setDrawColor(...green);
  doc.setLineWidth(0.4);
  doc.roundedRect(pageWidth - 80, finalY, 66, 18, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkGreen);
  doc.text('GRAND TOTAL', pageWidth - 77, finalY + 7);
  doc.setFontSize(13);
  doc.text(`Rs. ${parseFloat(grandTotal).toFixed(2)}`, pageWidth - 16, finalY + 13, { align: 'right' });

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 22;
  doc.setDrawColor(...green);
  doc.setLineWidth(0.3);
  doc.line(14, footerY, pageWidth - 14, footerY);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('Thank you for visiting Malar Xerox & Studio! We appreciate your business.', pageWidth / 2, footerY + 6, { align: 'center' });
  doc.text('This is a computer-generated receipt and does not require a signature.', pageWidth / 2, footerY + 11, { align: 'center' });

  // Page number
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, footerY + 17, { align: 'center' });

  return doc;
}
