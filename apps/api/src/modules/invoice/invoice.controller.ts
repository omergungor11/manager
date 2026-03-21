import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/tenant.guard';
import { CurrentTenant, type TenantContext } from '../tenant/tenant.decorator';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermissions } from '../rbac/rbac.decorator';
import { InvoiceService } from './invoice.service';
import { PaymentService } from './payment.service';
import { PdfService } from './pdf.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('invoices')
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly paymentService: PaymentService,
    private readonly pdfService: PdfService,
  ) {}

  // ------------------------------------------------------------------
  // Invoices
  // ------------------------------------------------------------------

  @Post()
  @RequirePermissions('invoice:create')
  @ApiOperation({ summary: 'Create an invoice from a completed work order' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateInvoiceDto,
  ) {
    const invoice = await this.invoiceService.createFromWorkOrder(tenant.id, dto);
    return { data: invoice };
  }

  @Get()
  @RequirePermissions('invoice:read')
  @ApiOperation({ summary: 'List invoices with pagination and filters' })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED'] })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: Date })
  @ApiQuery({ name: 'dateTo', required: false, type: Date })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: QueryInvoiceDto,
  ) {
    const { items, total, page, limit, totalPages } =
      await this.invoiceService.findAll(tenant.id, query);

    return {
      data: items,
      meta: { total, page, limit, totalPages },
    };
  }

  @Get(':id')
  @RequirePermissions('invoice:read')
  @ApiOperation({ summary: 'Get a single invoice by ID with all relations' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  async findById(@Param('id') id: string) {
    const invoice = await this.invoiceService.findById(id);
    return { data: invoice };
  }

  @Patch(':id/cancel')
  @RequirePermissions('invoice:delete')
  @ApiOperation({ summary: 'Cancel an invoice and revert work order status to COMPLETED' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  async cancel(@Param('id') id: string) {
    const invoice = await this.invoiceService.cancelInvoice(id);
    return { data: invoice };
  }

  @Get(':id/pdf')
  @RequirePermissions('invoice:read')
  @ApiOperation({ summary: 'Download invoice as a PDF file' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  async downloadPdf(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.pdfService.generateInvoicePdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  // ------------------------------------------------------------------
  // Payments
  // ------------------------------------------------------------------

  @Post(':id/payments')
  @RequirePermissions('payment:create')
  @ApiOperation({ summary: 'Create a payment for an invoice' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  async createPayment(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: CreatePaymentDto,
  ) {
    // Ensure the invoiceId in the DTO matches the route param
    dto.invoiceId = id;
    const payment = await this.paymentService.createPayment(tenant.id, dto);
    return { data: payment };
  }

  @Get(':id/payments')
  @RequirePermissions('payment:read')
  @ApiOperation({ summary: 'List all payments for an invoice' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  async getPayments(@Param('id') id: string) {
    const payments = await this.paymentService.getPayments(id);
    return { data: payments };
  }
}
