import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FinancialStatus, Prisma, WorkOrderItemType, WorkOrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { CreateWorkOrderItemDto } from './dto/create-work-order-item.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { UpdateWorkOrderItemDto } from './dto/update-work-order-item.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { QueryWorkOrdersDto } from './dto/query-work-orders.dto';

const TERMINAL_STATUSES: WorkOrderStatus[] = [WorkOrderStatus.DELIVERED, WorkOrderStatus.CANCELLED];

const workOrderInclude = Prisma.validator<Prisma.WorkOrderDefaultArgs>()({
  include: {
    client: { select: { id: true, name: true } },
    vehicle: { select: { id: true, plate: true, brand: true, model: true } },
    employee: { select: { id: true, name: true } },
    items: { orderBy: { createdAt: 'asc' } },
    history: { orderBy: { changedAt: 'asc' } },
  },
});
type WorkOrderWithRelations = Prisma.WorkOrderGetPayload<typeof workOrderInclude>;

const workOrderListInclude = Prisma.validator<Prisma.WorkOrderDefaultArgs>()({
  include: {
    client: { select: { id: true, name: true } },
    vehicle: { select: { id: true, plate: true, brand: true, model: true } },
    employee: { select: { id: true, name: true } },
  },
});
type WorkOrderListItem = Prisma.WorkOrderGetPayload<typeof workOrderListInclude>;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class WorkOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, userId: string, dto: CreateWorkOrderDto) {
    await this.assertClientBelongsToCompany(companyId, dto.clientId);
    await this.assertVehicleBelongsToClient(companyId, dto.vehicleId, dto.clientId);
    if (dto.employeeId) {
      await this.assertEmployeeBelongsToCompany(companyId, dto.employeeId);
    }

    const items = dto.items ?? [];
    const { laborAmount, partsAmount } = this.sumItemsByType(items);
    const discountAmount = dto.discountAmount ?? 0;
    const totalAmount = round2(laborAmount + partsAmount - discountAmount);

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const created = await this.prisma.$transaction(async (tx) => {
          const number = await this.nextWorkOrderNumber(tx, companyId);
          return tx.workOrder.create({
            data: {
              companyId,
              clientId: dto.clientId,
              vehicleId: dto.vehicleId,
              employeeId: dto.employeeId,
              number,
              reportedProblem: dto.reportedProblem,
              diagnosis: dto.diagnosis,
              observations: dto.observations,
              discountAmount,
              laborAmount,
              partsAmount,
              totalAmount,
              warrantyDays: dto.warrantyDays ?? 0,
              items: { create: items.map((item) => this.toItemData(item)) },
              history: { create: { status: WorkOrderStatus.OPEN, changedById: userId } },
            },
            ...workOrderInclude,
          });
        });
        return this.serialize(created);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && attempt < 2) {
          continue;
        }
        throw error;
      }
    }

    throw new ConflictException('Não foi possível gerar o número da ordem de serviço, tente novamente.');
  }

  async findAll(companyId: string, query: QueryWorkOrdersDto): Promise<PaginatedResult<ReturnType<typeof this.serializeListItem>>> {
    const { page, limit, search, status, clientId, vehicleId, employeeId } = query;
    const searchAsNumber = search && /^\d+$/.test(search.trim()) ? Number(search.trim()) : undefined;

    const where: Prisma.WorkOrderWhereInput = {
      companyId,
      deletedAt: null,
      ...(status && { status }),
      ...(clientId && { clientId }),
      ...(vehicleId && { vehicleId }),
      ...(employeeId && { employeeId }),
      ...(search && {
        OR: [
          { reportedProblem: { contains: search, mode: 'insensitive' } },
          { client: { name: { contains: search, mode: 'insensitive' } } },
          { vehicle: { plate: { contains: search, mode: 'insensitive' } } },
          ...(searchAsNumber !== undefined ? [{ number: searchAsNumber }] : []),
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.workOrder.findMany({
        where,
        orderBy: { openedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        ...workOrderListInclude,
      }),
      this.prisma.workOrder.count({ where }),
    ]);

    return paginate(data.map((wo) => this.serializeListItem(wo)), total, page, limit);
  }

  async findOne(companyId: string, id: string) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id, companyId, deletedAt: null },
      ...workOrderInclude,
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    return this.serialize(workOrder);
  }

  async update(companyId: string, id: string, dto: UpdateWorkOrderDto) {
    const existing = await this.assertWorkOrderIsEditable(companyId, id);
    if (dto.employeeId) {
      await this.assertEmployeeBelongsToCompany(companyId, dto.employeeId);
    }

    const data: Prisma.WorkOrderUpdateInput = { ...dto };
    if (dto.discountAmount !== undefined) {
      data.totalAmount = round2(Number(existing.laborAmount) + Number(existing.partsAmount) - dto.discountAmount);
    }

    const updated = await this.prisma.workOrder.update({ where: { id }, data, ...workOrderInclude });
    return this.serialize(updated);
  }

  async updateStatus(companyId: string, id: string, userId: string, dto: UpdateWorkOrderStatusDto) {
    const existing = await this.prisma.workOrder.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!existing) {
      throw new NotFoundException('Work order not found');
    }

    if (TERMINAL_STATUSES.includes(existing.status)) {
      throw new ConflictException('Esta ordem de serviço já foi finalizada e não pode mudar de status.');
    }

    if (dto.status === WorkOrderStatus.CANCELLED) {
      await this.assertLinkedIncomeIsNotPaid(companyId, id);
    }

    const now = new Date();
    const data: Prisma.WorkOrderUpdateInput = { status: dto.status };
    let completedAtValue = existing.completedAt;

    if (dto.status === WorkOrderStatus.IN_PROGRESS && !existing.startedAt) {
      data.startedAt = now;
    }
    if (dto.status === WorkOrderStatus.COMPLETED) {
      data.completedAt = now;
      completedAtValue = now;
    }
    if (dto.status === WorkOrderStatus.DELIVERED) {
      data.deliveredAt = now;
      if (!existing.completedAt) {
        data.completedAt = now;
        completedAtValue = now;
      }
      if (existing.warrantyDays > 0) {
        const warrantyUntil = new Date(now);
        warrantyUntil.setDate(warrantyUntil.getDate() + existing.warrantyDays);
        data.warrantyUntil = warrantyUntil;
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.update({
        where: { id },
        data: { ...data, history: { create: { status: dto.status, notes: dto.notes, changedById: userId } } },
        ...workOrderInclude,
      });

      if (dto.status === WorkOrderStatus.COMPLETED || dto.status === WorkOrderStatus.DELIVERED) {
        await this.ensureIncomeForWorkOrder(tx, companyId, workOrder, completedAtValue ?? now);
      }

      if (dto.status === WorkOrderStatus.CANCELLED) {
        // Only ever affects unpaid linked incomes — assertLinkedIncomeIsNotPaid already blocked the paid case above.
        await tx.income.updateMany({
          where: { workOrderId: id, companyId, deletedAt: null, paidAmount: 0 },
          data: { status: FinancialStatus.CANCELLED },
        });
      }

      return workOrder;
    });

    return this.serialize(updated);
  }

  async addItem(companyId: string, workOrderId: string, dto: CreateWorkOrderItemDto) {
    await this.assertWorkOrderIsEditable(companyId, workOrderId);
    await this.prisma.workOrderItem.create({ data: { workOrderId, ...this.toItemData(dto) } });
    await this.recomputeAmounts(workOrderId);
    return this.findOne(companyId, workOrderId);
  }

  async updateItem(companyId: string, workOrderId: string, itemId: string, dto: UpdateWorkOrderItemDto) {
    await this.assertWorkOrderIsEditable(companyId, workOrderId);

    const item = await this.prisma.workOrderItem.findFirst({ where: { id: itemId, workOrderId } });
    if (!item) {
      throw new NotFoundException('Work order item not found');
    }

    const quantity = dto.quantity ?? Number(item.quantity);
    const unitPrice = dto.unitPrice ?? Number(item.unitPrice);

    await this.prisma.workOrderItem.update({
      where: { id: itemId },
      data: {
        type: dto.type ?? item.type,
        description: dto.description ?? item.description,
        quantity,
        unitPrice,
        totalPrice: round2(quantity * unitPrice),
      },
    });

    await this.recomputeAmounts(workOrderId);
    return this.findOne(companyId, workOrderId);
  }

  async removeItem(companyId: string, workOrderId: string, itemId: string) {
    await this.assertWorkOrderIsEditable(companyId, workOrderId);

    const item = await this.prisma.workOrderItem.findFirst({ where: { id: itemId, workOrderId } });
    if (!item) {
      throw new NotFoundException('Work order item not found');
    }

    await this.prisma.workOrderItem.delete({ where: { id: itemId } });
    await this.recomputeAmounts(workOrderId);
    return this.findOne(companyId, workOrderId);
  }

  async remove(companyId: string, id: string): Promise<void> {
    await this.assertWorkOrderExists(companyId, id);
    await this.prisma.workOrder.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private async nextWorkOrderNumber(tx: Prisma.TransactionClient, companyId: string): Promise<number> {
    const aggregate = await tx.workOrder.aggregate({ where: { companyId }, _max: { number: true } });
    return (aggregate._max.number ?? 0) + 1;
  }

  private async recomputeAmounts(workOrderId: string): Promise<void> {
    const [items, workOrder] = await Promise.all([
      this.prisma.workOrderItem.findMany({ where: { workOrderId } }),
      this.prisma.workOrder.findUniqueOrThrow({ where: { id: workOrderId } }),
    ]);

    const laborAmount = round2(
      items.filter((item) => item.type === WorkOrderItemType.SERVICE).reduce((sum, item) => sum + Number(item.totalPrice), 0),
    );
    const partsAmount = round2(
      items.filter((item) => item.type === WorkOrderItemType.PART).reduce((sum, item) => sum + Number(item.totalPrice), 0),
    );
    const totalAmount = round2(laborAmount + partsAmount - Number(workOrder.discountAmount));

    // Keep a linked-but-unpaid Income in sync with the WO total; once payment has started, its total is locked.
    const linkedIncome = await this.prisma.income.findFirst({
      where: { workOrderId, companyId: workOrder.companyId, deletedAt: null },
    });
    const shouldSyncIncome =
      linkedIncome && Number(linkedIncome.paidAmount) === 0 && Number(linkedIncome.amount) !== totalAmount;

    await this.prisma.$transaction([
      this.prisma.workOrder.update({ where: { id: workOrderId }, data: { laborAmount, partsAmount, totalAmount } }),
      ...(shouldSyncIncome ? [this.prisma.income.update({ where: { id: linkedIncome!.id }, data: { amount: totalAmount } })] : []),
    ]);
  }

  /** Idempotent — if an active Income is already linked to this work order, does nothing (prevents duplicates). */
  private async ensureIncomeForWorkOrder(
    tx: Prisma.TransactionClient,
    companyId: string,
    workOrder: { id: string; number: number; clientId: string; totalAmount: Prisma.Decimal },
    dueDate: Date,
  ): Promise<void> {
    const existingIncome = await tx.income.findFirst({ where: { workOrderId: workOrder.id, companyId, deletedAt: null } });
    if (existingIncome) {
      return;
    }

    await tx.income.create({
      data: {
        companyId,
        workOrderId: workOrder.id,
        clientId: workOrder.clientId,
        description: `Ordem de serviço #${workOrder.number}`,
        amount: workOrder.totalAmount,
        dueDate,
        status: FinancialStatus.PENDING,
      },
    });
  }

  private async assertLinkedIncomeIsNotPaid(companyId: string, workOrderId: string): Promise<void> {
    const linkedIncome = await this.prisma.income.findFirst({ where: { workOrderId, companyId, deletedAt: null } });
    if (linkedIncome && Number(linkedIncome.paidAmount) > 0) {
      throw new ConflictException(
        'Não é possível cancelar esta ordem de serviço: a receita vinculada já possui pagamentos registrados.',
      );
    }
  }

  private sumItemsByType(items: CreateWorkOrderItemDto[]): { laborAmount: number; partsAmount: number } {
    let laborAmount = 0;
    let partsAmount = 0;

    for (const item of items) {
      const total = round2(item.quantity * item.unitPrice);
      if (item.type === WorkOrderItemType.SERVICE) {
        laborAmount = round2(laborAmount + total);
      } else {
        partsAmount = round2(partsAmount + total);
      }
    }

    return { laborAmount, partsAmount };
  }

  private toItemData(item: CreateWorkOrderItemDto) {
    return {
      type: item.type,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: round2(item.quantity * item.unitPrice),
    };
  }

  private async assertWorkOrderExists(companyId: string, id: string): Promise<void> {
    const exists = await this.prisma.workOrder.findFirst({ where: { id, companyId, deletedAt: null }, select: { id: true } });
    if (!exists) {
      throw new NotFoundException('Work order not found');
    }
  }

  /** Delivered/cancelled work orders are closed records — block further edits to problem, items, discount, etc. */
  private async assertWorkOrderIsEditable(companyId: string, id: string) {
    const workOrder = await this.prisma.workOrder.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }
    if (TERMINAL_STATUSES.includes(workOrder.status)) {
      throw new ConflictException('Esta ordem de serviço já foi finalizada e não pode ser alterada.');
    }
    return workOrder;
  }

  private async assertClientBelongsToCompany(companyId: string, clientId: string): Promise<void> {
    const client = await this.prisma.client.findFirst({ where: { id: clientId, companyId, deletedAt: null } });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
  }

  private async assertVehicleBelongsToClient(companyId: string, vehicleId: string, clientId: string): Promise<void> {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id: vehicleId, companyId, deletedAt: null } });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    if (vehicle.clientId !== clientId) {
      throw new BadRequestException('O veículo informado não pertence ao cliente informado.');
    }
  }

  private async assertEmployeeBelongsToCompany(companyId: string, employeeId: string): Promise<void> {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, companyId, deletedAt: null } });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
  }

  private serialize(workOrder: WorkOrderWithRelations) {
    return {
      ...workOrder,
      laborAmount: Number(workOrder.laborAmount),
      partsAmount: Number(workOrder.partsAmount),
      discountAmount: Number(workOrder.discountAmount),
      totalAmount: Number(workOrder.totalAmount),
      items: workOrder.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
    };
  }

  private serializeListItem(workOrder: WorkOrderListItem) {
    return {
      ...workOrder,
      laborAmount: Number(workOrder.laborAmount),
      partsAmount: Number(workOrder.partsAmount),
      discountAmount: Number(workOrder.discountAmount),
      totalAmount: Number(workOrder.totalAmount),
    };
  }
}
