import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// pdfmake ships CommonJS; use require() to avoid ESM interop issues.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require('pdfmake');

// pdfmake's built-in virtual fonts (no font files needed on disk).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vfsFonts = require('pdfmake/build/vfs_fonts');

const printer = new PdfPrinter({
  Roboto: {
    normal: Buffer.from(vfsFonts.pdfMake.vfs['Roboto-Regular.ttf'], 'base64'),
    bold: Buffer.from(vfsFonts.pdfMake.vfs['Roboto-Medium.ttf'], 'base64'),
    italics: Buffer.from(vfsFonts.pdfMake.vfs['Roboto-Italic.ttf'], 'base64'),
    bolditalics: Buffer.from(vfsFonts.pdfMake.vfs['Roboto-MediumItalic.ttf'], 'base64'),
  },
});

// -------------------------------------------------------------------------
// Formatting helpers
// -------------------------------------------------------------------------

function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  return `${num.toFixed(2)} TL`;
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

// -------------------------------------------------------------------------
// PdfService
// -------------------------------------------------------------------------

@Injectable()
export class PdfService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetches the invoice with all required relations and generates a PDF buffer.
   * Throws NotFoundException if the invoice does not exist.
   */
  async generateInvoicePdf(invoiceId: string): Promise<Buffer> {
    // 1. Load invoice with all relations needed for the document
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        customer: true,
        workOrder: {
          include: {
            vehicle: true,
          },
        },
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // 2. Attempt to load tenant name / contact info from TenantSettings
    const settingsRows = await this.prisma.tenantSettings.findMany({
      where: {
        tenantId: invoice.tenantId,
        key: { in: ['business_name', 'business_phone', 'business_address', 'business_tax_id'] },
      },
    });

    const settings: Record<string, string> = {};
    for (const row of settingsRows) {
      settings[row.key] = row.value;
    }

    const businessName = settings['business_name'] ?? 'Oto Servis';
    const businessPhone = settings['business_phone'] ?? '';
    const businessAddress = settings['business_address'] ?? '';
    const businessTaxId = settings['business_tax_id'] ?? '';

    // 3. Build line items for the table body
    const tableBody: unknown[][] = [
      // Header row
      [
        { text: '#', style: 'tableHeader' },
        { text: 'Açıklama', style: 'tableHeader' },
        { text: 'Miktar', style: 'tableHeader', alignment: 'right' },
        { text: 'Birim Fiyat', style: 'tableHeader', alignment: 'right' },
        { text: 'Toplam', style: 'tableHeader', alignment: 'right' },
      ],
    ];

    invoice.items.forEach((item, idx) => {
      tableBody.push([
        { text: String(idx + 1), alignment: 'center' },
        { text: item.description },
        { text: String(item.quantity), alignment: 'right' },
        { text: formatCurrency(Number(item.unitPrice)), alignment: 'right' },
        { text: formatCurrency(Number(item.total)), alignment: 'right' },
      ]);
    });

    // 4. Vehicle info
    const vehicle = invoice.workOrder?.vehicle;
    const vehicleLine = vehicle
      ? [vehicle.licensePlate, vehicle.brandName, vehicle.modelName].filter(Boolean).join(' — ')
      : '-';

    // 5. Work order ref
    const workOrderNo = invoice.workOrder?.orderNo ?? '-';

    // 6. Build the pdfmake document definition
    const docDefinition = {
      pageSize: 'A4' as const,
      pageMargins: [40, 60, 40, 60] as [number, number, number, number],

      styles: {
        title: { fontSize: 22, bold: true, color: '#1a1a1a' },
        sectionHeader: { fontSize: 11, bold: true, color: '#444444', margin: [0, 10, 0, 4] },
        tableHeader: {
          fontSize: 9,
          bold: true,
          color: '#ffffff',
          fillColor: '#2c2c2c',
          margin: [4, 4, 4, 4],
        },
        label: { fontSize: 9, color: '#888888' },
        value: { fontSize: 10, color: '#1a1a1a' },
        footer: { fontSize: 8, color: '#aaaaaa', italics: true, alignment: 'center' as const },
        statusBadge: { fontSize: 10, bold: true },
      },

      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
        color: '#1a1a1a',
      },

      content: [
        // ---- Header row: title left, invoice meta right ----
        {
          columns: [
            {
              stack: [
                { text: 'FATURA', style: 'title' },
                { text: businessName, fontSize: 12, bold: true, margin: [0, 4, 0, 0] },
                ...(businessAddress ? [{ text: businessAddress, style: 'label', margin: [0, 2, 0, 0] }] : []),
                ...(businessPhone ? [{ text: businessPhone, style: 'label' }] : []),
                ...(businessTaxId ? [{ text: `Vergi No: ${businessTaxId}`, style: 'label' }] : []),
              ],
            },
            {
              stack: [
                {
                  columns: [
                    { text: 'Fatura No:', style: 'label', width: 80 },
                    { text: invoice.invoiceNo, style: 'value', bold: true },
                  ],
                },
                {
                  columns: [
                    { text: 'Tarih:', style: 'label', width: 80 },
                    { text: formatDate(invoice.date), style: 'value' },
                  ],
                  margin: [0, 2, 0, 0],
                },
                {
                  columns: [
                    { text: 'Vade Tarihi:', style: 'label', width: 80 },
                    { text: formatDate(invoice.dueDate), style: 'value' },
                  ],
                  margin: [0, 2, 0, 0],
                },
                {
                  columns: [
                    { text: 'İş Emri:', style: 'label', width: 80 },
                    { text: workOrderNo, style: 'value' },
                  ],
                  margin: [0, 2, 0, 0],
                },
                {
                  columns: [
                    { text: 'Durum:', style: 'label', width: 80 },
                    { text: statusLabel(invoice.status), style: 'statusBadge' },
                  ],
                  margin: [0, 2, 0, 0],
                },
              ],
              alignment: 'right' as const,
            },
          ],
        },

        // ---- Divider ----
        { canvas: [{ type: 'line', x1: 0, y1: 8, x2: 515, y2: 8, lineWidth: 1, lineColor: '#dddddd' }], margin: [0, 8, 0, 0] },

        // ---- Customer & Vehicle section ----
        {
          columns: [
            {
              stack: [
                { text: 'MÜŞTERİ BİLGİLERİ', style: 'sectionHeader' },
                { text: invoice.customer?.name ?? '-', style: 'value', bold: true },
                ...(invoice.customer?.phone ? [{ text: invoice.customer.phone, style: 'label' }] : []),
                ...(invoice.customer?.email ? [{ text: invoice.customer.email, style: 'label' }] : []),
                ...(invoice.customer?.address ? [{ text: invoice.customer.address, style: 'label' }] : []),
                ...(invoice.customer?.taxId ? [{ text: `Vergi No: ${invoice.customer.taxId}`, style: 'label' }] : []),
              ],
              width: '50%',
            },
            {
              stack: [
                { text: 'ARAÇ BİLGİLERİ', style: 'sectionHeader' },
                { text: vehicleLine, style: 'value' },
              ],
              width: '50%',
            },
          ],
          margin: [0, 4, 0, 0],
        },

        // ---- Divider ----
        { canvas: [{ type: 'line', x1: 0, y1: 8, x2: 515, y2: 8, lineWidth: 0.5, lineColor: '#eeeeee' }], margin: [0, 8, 0, 0] },

        // ---- Items table ----
        { text: 'KALEMLER', style: 'sectionHeader' },
        {
          table: {
            headerRows: 1,
            widths: [24, '*', 50, 70, 70],
            body: tableBody,
          },
          layout: {
            fillColor: (rowIndex: number) => (rowIndex > 0 && rowIndex % 2 === 0 ? '#f9f9f9' : null),
            hLineWidth: () => 0.5,
            vLineWidth: () => 0,
            hLineColor: () => '#e0e0e0',
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 4,
            paddingBottom: () => 4,
          },
        },

        // ---- Totals block (right-aligned) ----
        {
          columns: [
            { text: '', width: '*' },
            {
              table: {
                widths: [100, 80],
                body: [
                  [
                    { text: 'Ara Toplam:', style: 'label', alignment: 'right' as const },
                    { text: formatCurrency(Number(invoice.subtotal)), alignment: 'right' as const },
                  ],
                  [
                    { text: `KDV (%${Number(invoice.taxRate).toFixed(0)}):`, style: 'label', alignment: 'right' as const },
                    { text: formatCurrency(Number(invoice.taxAmount)), alignment: 'right' as const },
                  ],
                  [
                    { text: 'Genel Toplam:', bold: true, alignment: 'right' as const },
                    { text: formatCurrency(Number(invoice.total)), bold: true, alignment: 'right' as const },
                  ],
                  [
                    { text: 'Ödenen:', style: 'label', alignment: 'right' as const },
                    { text: formatCurrency(Number(invoice.paidAmount)), alignment: 'right' as const },
                  ],
                  [
                    { text: 'Kalan:', bold: true, alignment: 'right' as const },
                    {
                      text: formatCurrency(
                        Math.max(0, Number(invoice.total) - Number(invoice.paidAmount)),
                      ),
                      bold: true,
                      alignment: 'right' as const,
                    },
                  ],
                ],
              },
              layout: {
                hLineWidth: (i: number, node: { table: { body: unknown[][] } }) =>
                  i === 0 || i === node.table.body.length ? 0.5 : 0,
                vLineWidth: () => 0,
                hLineColor: () => '#dddddd',
                paddingLeft: () => 6,
                paddingRight: () => 6,
                paddingTop: () => 3,
                paddingBottom: () => 3,
              },
              width: 'auto',
            },
          ],
          margin: [0, 12, 0, 0],
        },

        // ---- Footer ----
        {
          text: 'Bu fatura bilgisayar ortamında oluşturulmuştur.',
          style: 'footer',
          margin: [0, 40, 0, 0],
        },
      ],
    };

    // 7. Generate the PDF buffer
    return new Promise<Buffer>((resolve, reject) => {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];

      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);

      pdfDoc.end();
    });
  }
}
