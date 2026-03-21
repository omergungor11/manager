import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { PaymentService } from './payment.service';
import { PdfService } from './pdf.service';
import { InvoiceController } from './invoice.controller';

@Module({
  controllers: [InvoiceController],
  providers: [InvoiceService, PaymentService, PdfService],
  exports: [InvoiceService, PaymentService, PdfService],
})
export class InvoiceModule {}
