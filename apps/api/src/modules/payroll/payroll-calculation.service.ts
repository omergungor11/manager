import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ── KKTC default payroll parameter names ─────────────────────────────────────
export const PARAM_NAMES = {
  SGK_EMPLOYEE_RATE: 'sgk_employee_rate',
  SGK_EMPLOYER_RATE: 'sgk_employer_rate',
  PROVIDENT_EMPLOYEE_RATE: 'provident_employee_rate',
  PROVIDENT_EMPLOYER_RATE: 'provident_employer_rate',
  // Progressive income-tax brackets — stored as threshold (TL) and rate (0–1)
  // bracket_1_threshold: top of bracket 1 (below = 10%)
  // bracket_2_threshold: top of bracket 2 (above bracket 1 and below this = 15%)
  // bracket_3_threshold: top of bracket 3 (above bracket 2 and below this = 20%)
  // taxable income above bracket_3_threshold is taxed at 25%
  TAX_BRACKET_1_THRESHOLD: 'tax_bracket_1_threshold',
  TAX_BRACKET_1_RATE: 'tax_bracket_1_rate',
  TAX_BRACKET_2_THRESHOLD: 'tax_bracket_2_threshold',
  TAX_BRACKET_2_RATE: 'tax_bracket_2_rate',
  TAX_BRACKET_3_THRESHOLD: 'tax_bracket_3_threshold',
  TAX_BRACKET_3_RATE: 'tax_bracket_3_rate',
  TAX_BRACKET_4_RATE: 'tax_bracket_4_rate',
} as const;

export interface PayrollParams {
  sgkEmployeeRate: number;
  sgkEmployerRate: number;
  providentEmployeeRate: number;
  providentEmployerRate: number;
  taxBrackets: Array<{ threshold: number | null; rate: number }>;
}

export interface PayrollCalculationResult {
  grossSalary: number;
  sgkEmployee: number;
  sgkEmployer: number;
  providentEmployee: number;
  providentEmployer: number;
  taxableIncome: number;
  incomeTax: number;
  netSalary: number;
  totalEmployerCost: number;
}

@Injectable()
export class PayrollCalculationService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Pure calculation (no DB access) ────────────────────────────────────────

  calculate(grossSalary: number, params: PayrollParams): PayrollCalculationResult {
    const sgkEmployee = this.round(grossSalary * params.sgkEmployeeRate);
    const sgkEmployer = this.round(grossSalary * params.sgkEmployerRate);
    const providentEmployee = this.round(grossSalary * params.providentEmployeeRate);
    const providentEmployer = this.round(grossSalary * params.providentEmployerRate);

    // Taxable income = gross minus employee-side deductions
    const taxableIncome = this.round(grossSalary - sgkEmployee - providentEmployee);

    const incomeTax = this.calculateProgressiveTax(taxableIncome, params.taxBrackets);

    const netSalary = this.round(taxableIncome - incomeTax);
    const totalEmployerCost = this.round(grossSalary + sgkEmployer + providentEmployer);

    return {
      grossSalary,
      sgkEmployee,
      sgkEmployer,
      providentEmployee,
      providentEmployer,
      taxableIncome,
      incomeTax,
      netSalary,
      totalEmployerCost,
    };
  }

  // ── Default KKTC parameters ─────────────────────────────────────────────────

  getDefaultParams(): PayrollParams {
    return {
      sgkEmployeeRate: 0.06,
      sgkEmployerRate: 0.11,
      providentEmployeeRate: 0.04,
      providentEmployerRate: 0.04,
      // 2025 KKTC approximate progressive income-tax brackets (monthly)
      taxBrackets: [
        { threshold: 5000, rate: 0.10 },
        { threshold: 15000, rate: 0.15 },
        { threshold: 35000, rate: 0.20 },
        { threshold: null, rate: 0.25 },  // null = no upper bound
      ],
    };
  }

  // ── Fetch tenant-specific params or fall back to defaults ──────────────────

  async getParams(tenantId: string): Promise<PayrollParams> {
    const now = new Date();

    // Fetch params scoped to this tenant that are currently effective
    const rows = await this.prisma.payrollParams.findMany({
      where: {
        tenantId,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (rows.length === 0) {
      return this.getDefaultParams();
    }

    // Deduplicate — keep latest effectiveFrom per param name
    const latest = new Map<string, string>();
    for (const row of rows) {
      if (!latest.has(row.name)) {
        latest.set(row.name, row.value);
      }
    }

    const get = (key: string, fallback: number): number => {
      const raw = latest.get(key);
      if (raw === undefined) return fallback;
      const parsed = parseFloat(raw);
      return isNaN(parsed) ? fallback : parsed;
    };

    const defaults = this.getDefaultParams();
    const [b1, b2, b3, b4] = defaults.taxBrackets as [
      { threshold: number; rate: number },
      { threshold: number; rate: number },
      { threshold: number; rate: number },
      { threshold: null; rate: number },
    ];

    return {
      sgkEmployeeRate: get(PARAM_NAMES.SGK_EMPLOYEE_RATE, defaults.sgkEmployeeRate),
      sgkEmployerRate: get(PARAM_NAMES.SGK_EMPLOYER_RATE, defaults.sgkEmployerRate),
      providentEmployeeRate: get(PARAM_NAMES.PROVIDENT_EMPLOYEE_RATE, defaults.providentEmployeeRate),
      providentEmployerRate: get(PARAM_NAMES.PROVIDENT_EMPLOYER_RATE, defaults.providentEmployerRate),
      taxBrackets: [
        {
          threshold: get(PARAM_NAMES.TAX_BRACKET_1_THRESHOLD, b1.threshold),
          rate: get(PARAM_NAMES.TAX_BRACKET_1_RATE, b1.rate),
        },
        {
          threshold: get(PARAM_NAMES.TAX_BRACKET_2_THRESHOLD, b2.threshold),
          rate: get(PARAM_NAMES.TAX_BRACKET_2_RATE, b2.rate),
        },
        {
          threshold: get(PARAM_NAMES.TAX_BRACKET_3_THRESHOLD, b3.threshold),
          rate: get(PARAM_NAMES.TAX_BRACKET_3_RATE, b3.rate),
        },
        {
          threshold: null,
          rate: get(PARAM_NAMES.TAX_BRACKET_4_RATE, b4.rate),
        },
      ],
    };
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private calculateProgressiveTax(
    income: number,
    brackets: Array<{ threshold: number | null; rate: number }>,
  ): number {
    let remaining = income;
    let tax = 0;
    let previousThreshold = 0;

    for (const bracket of brackets) {
      if (remaining <= 0) break;

      if (bracket.threshold === null) {
        // Top bracket — no ceiling
        tax += remaining * bracket.rate;
        remaining = 0;
      } else {
        const bracketWidth = bracket.threshold - previousThreshold;
        const taxable = Math.min(remaining, bracketWidth);
        tax += taxable * bracket.rate;
        remaining -= taxable;
        previousThreshold = bracket.threshold;
      }
    }

    return this.round(tax);
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
