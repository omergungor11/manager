import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  return `${num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}

function formatDate(value: Date | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'Taslak',
    SENT: 'Gönderildi',
    PAID: 'Ödendi',
    PARTIALLY_PAID: 'Kısmi Ödeme',
    OVERDUE: 'Vadesi Geçti',
    CANCELLED: 'İptal',
  };
  return map[status] ?? status;
}

@Injectable()
export class PdfService {
  constructor(private readonly prisma: PrismaService) {}

  async generateInvoicePdf(invoiceId: string): Promise<Buffer> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        customer: true,
        workOrder: { include: { vehicle: true } },
        payments: { orderBy: { date: 'desc' } },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const vehicle = invoice.workOrder?.vehicle;
    const vehicleLine = vehicle
      ? [vehicle.licensePlate, vehicle.brandName, vehicle.modelName].filter(Boolean).join(' — ')
      : '-';

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // --- Header ---
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('FATURA', 14, y);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fatura No: ${invoice.invoiceNo}`, pageWidth - 14, y, { align: 'right' });
    y += 6;
    doc.text(`Tarih: ${formatDate(invoice.date)}`, pageWidth - 14, y, { align: 'right' });
    y += 6;
    doc.text(`Vade: ${formatDate(invoice.dueDate)}`, pageWidth - 14, y, { align: 'right' });
    y += 6;
    doc.text(`Durum: ${statusLabel(invoice.status)}`, pageWidth - 14, y, { align: 'right' });
    y += 6;
    if (invoice.workOrder) {
      doc.text(`İş Emri: ${invoice.workOrder.orderNo}`, pageWidth - 14, y, { align: 'right' });
    }

    // --- Divider ---
    y += 8;
    doc.setDrawColor(200);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    // --- Customer Info ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('MÜŞTERİ BİLGİLERİ', 14, y);
    doc.text('ARAÇ BİLGİLERİ', pageWidth / 2 + 10, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(invoice.customer?.name ?? '-', 14, y);
    doc.text(vehicleLine, pageWidth / 2 + 10, y);
    y += 5;

    if (invoice.customer?.phone) {
      doc.setFontSize(9);
      doc.text(invoice.customer.phone, 14, y);
      y += 5;
    }
    if (invoice.customer?.email) {
      doc.text(invoice.customer.email, 14, y);
      y += 5;
    }
    if (invoice.customer?.taxId) {
      doc.text(`Vergi No: ${invoice.customer.taxId}`, 14, y);
      y += 5;
    }

    // --- Divider ---
    y += 4;
    doc.setDrawColor(230);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    // --- Items Table ---
    const tableHead = [['#', 'Açıklama', 'Miktar', 'Birim Fiyat', 'Toplam']];
    const tableBody = invoice.items.map((item, idx) => [
      String(idx + 1),
      item.description,
      String(Number(item.quantity)),
      formatCurrency(Number(item.unitPrice)),
      formatCurrency(Number(item.total)),
    ]);

    (doc as unknown as { autoTable: (opts: unknown) => void }).autoTable({
      startY: y,
      head: tableHead,
      body: tableBody,
      theme: 'striped',
      headStyles: {
        fillColor: [44, 44, 44],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        2: { halign: 'right', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'right', cellWidth: 30 },
      },
      margin: { left: 14, right: 14 },
    });

    // Get Y position after table
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // --- Totals ---
    const totalsX = pageWidth - 14;
    let ty = finalY;
    doc.setFontSize(10);

    doc.setFont('helvetica', 'normal');
    doc.text('Ara Toplam:', totalsX - 50, ty, { align: 'right' });
    doc.text(formatCurrency(Number(invoice.subtotal)), totalsX, ty, { align: 'right' });
    ty += 6;

    doc.text(`KDV (%${Number(invoice.taxRate).toFixed(0)}):`, totalsX - 50, ty, { align: 'right' });
    doc.text(formatCurrency(Number(invoice.taxAmount)), totalsX, ty, { align: 'right' });
    ty += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('Genel Toplam:', totalsX - 50, ty, { align: 'right' });
    doc.text(formatCurrency(Number(invoice.total)), totalsX, ty, { align: 'right' });
    ty += 6;

    doc.setFont('helvetica', 'normal');
    doc.text('Ödenen:', totalsX - 50, ty, { align: 'right' });
    doc.text(formatCurrency(Number(invoice.paidAmount)), totalsX, ty, { align: 'right' });
    ty += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('Kalan:', totalsX - 50, ty, { align: 'right' });
    doc.text(
      formatCurrency(Math.max(0, Number(invoice.total) - Number(invoice.paidAmount))),
      totalsX,
      ty,
      { align: 'right' },
    );

    // --- Footer ---
    ty += 30;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(170);
    doc.text('Bu fatura bilgisayar ortamında oluşturulmuştur.', pageWidth / 2, ty, { align: 'center' });

    // Return as Buffer
    const arrayBuffer = doc.output('arraybuffer');
    return Buffer.from(arrayBuffer);
  }
}
