import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Employee, Prisma, RecurrenceFrequency } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { addMonthsClamped, parseLocalDate, startOfToday } from '../../common/utils/date.util';
import { maxEmployeesForSubscription } from '../billing/plan-features';
import { ExpensesService } from '../expenses/expenses.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';

type EmployeeResponse = Omit<Employee, 'salary'> & { salary: number | null };

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly expensesService: ExpensesService,
  ) {}

  async create(companyId: string, dto: CreateEmployeeDto): Promise<EmployeeResponse> {
    await this.assertEmployeeQuota(companyId);

    if (dto.document) {
      await this.assertDocumentIsUnique(companyId, dto.document);
    }

    const employee = await this.prisma.employee.create({
      data: {
        companyId,
        name: dto.name,
        document: dto.document,
        position: dto.position,
        specialty: dto.specialty,
        phone: dto.phone,
        email: dto.email,
        hiredAt: dto.hiredAt ? parseLocalDate(dto.hiredAt) : undefined,
        salary: dto.salary,
      },
    });

    if (dto.salary && dto.salary > 0) {
      await this.openPayrollExpense(companyId, employee.id, employee.name, dto.salary);
    }

    return this.serialize(employee);
  }

  async findAll(companyId: string, query: QueryEmployeesDto): Promise<PaginatedResult<EmployeeResponse>> {
    const { page, limit, search, isActive } = query;

    const where: Prisma.EmployeeWhereInput = {
      companyId,
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { document: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { position: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return paginate(data.map((employee) => this.serialize(employee)), total, page, limit);
  }

  async findOne(companyId: string, id: string): Promise<EmployeeResponse> {
    const employee = await this.prisma.employee.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return this.serialize(employee);
  }

  async update(companyId: string, id: string, dto: UpdateEmployeeDto): Promise<EmployeeResponse> {
    const existing = await this.prisma.employee.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!existing) {
      throw new NotFoundException('Employee not found');
    }

    if (dto.document) {
      await this.assertDocumentIsUnique(companyId, dto.document, id);
    }

    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        name: dto.name,
        document: dto.document,
        position: dto.position,
        specialty: dto.specialty,
        phone: dto.phone,
        email: dto.email,
        salary: dto.salary,
        isActive: dto.isActive,
        ...(dto.hiredAt && { hiredAt: parseLocalDate(dto.hiredAt) }),
      },
    });

    const salaryChanged = dto.salary !== undefined && Number(dto.salary) !== Number(existing.salary ?? 0);
    const deactivated = dto.isActive === false && existing.isActive !== false;

    if (deactivated || salaryChanged) {
      await this.stopActivePayroll(companyId, id);
    }
    if (salaryChanged && dto.salary && dto.salary > 0 && dto.isActive !== false) {
      await this.openPayrollExpense(companyId, id, updated.name, dto.salary);
    }

    return this.serialize(updated);
  }

  async remove(companyId: string, id: string): Promise<void> {
    const existing = await this.prisma.employee.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!existing) {
      throw new NotFoundException('Employee not found');
    }

    await this.prisma.employee.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    await this.stopActivePayroll(companyId, id);
  }

  private async openPayrollExpense(companyId: string, employeeId: string, employeeName: string, salary: number): Promise<void> {
    await this.expensesService.create(companyId, {
      description: `Salário — ${employeeName}`,
      amount: salary,
      dueDate: this.toIsoDate(this.nextPayrollDueDate()),
      recurrenceFrequency: RecurrenceFrequency.MONTHLY,
      employeeId,
    });
  }

  private async stopActivePayroll(companyId: string, employeeId: string): Promise<void> {
    const active = await this.prisma.expense.findFirst({
      where: { companyId, employeeId, recurringGroupId: { not: null }, recurrenceFrequency: { not: null }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (active) {
      await this.expensesService.stopRecurrence(companyId, active.id);
    }
  }

  private nextPayrollDueDate(): Date {
    const today = startOfToday();
    const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return addMonthsClamped(firstOfThisMonth, 1);
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * The roster cap is what the paid plans actually sell — access to the module
   * itself is base, because Agenda and Ordens de Serviço cannot work without a
   * mechanic to assign.
   *
   * Enforced only on create: an existing roster is never truncated by a
   * downgrade (decision 05 — data is never destroyed over billing). A company
   * that drops to Essencial with 8 mechanics keeps all 8 and simply cannot add
   * a 9th.
   */
  private async assertEmployeeQuota(companyId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });

    const limit = maxEmployeesForSubscription(subscription);
    if (limit === null) {
      return;
    }

    const current = await this.prisma.employee.count({ where: { companyId, deletedAt: null } });
    if (current < limit) {
      return;
    }

    throw new ForbiddenException({
      statusCode: 403,
      error: 'PLAN_LIMIT_REACHED',
      limit,
      message:
        `Seu plano permite até ${limit} funcionários e você já tem ${current}. ` +
        'Faça upgrade para cadastrar mais.',
    });
  }

  private async assertDocumentIsUnique(companyId: string, document: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.employee.findFirst({
      where: { companyId, document, deletedAt: null, ...(excludeId && { id: { not: excludeId } }) },
    });

    if (existing) {
      throw new ConflictException('An employee with this document already exists');
    }
  }

  private serialize(employee: Employee): EmployeeResponse {
    return { ...employee, salary: employee.salary === null ? null : Number(employee.salary) };
  }
}
