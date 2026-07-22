import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { Cargo, roleNameForCargo } from '../team/cargo';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';

const appointmentInclude = Prisma.validator<Prisma.AppointmentDefaultArgs>()({
  include: {
    employees: { include: { employee: { select: { id: true, name: true } } } },
    client: { select: { id: true, name: true } },
    vehicle: { select: { id: true, plate: true, brand: true, model: true } },
    workOrder: { select: { id: true, number: true } },
  },
});
type AppointmentWithRelations = Prisma.AppointmentGetPayload<typeof appointmentInclude>;

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateAppointmentDto): Promise<ReturnType<typeof this.serialize>> {
    this.assertScheduleIsValid(dto.scheduledStart, dto.scheduledEnd);
    await this.assertEmployeesBelongToCompany(companyId, dto.employeeIds);
    if (dto.clientId) {
      await this.assertClientBelongsToCompany(companyId, dto.clientId);
    }
    if (dto.vehicleId) {
      await this.assertVehicleBelongsToCompany(companyId, dto.vehicleId);
    }
    if (dto.workOrderId) {
      await this.assertWorkOrderBelongsToCompany(companyId, dto.workOrderId);
    }

    const created = await this.prisma.appointment.create({
      data: {
        companyId,
        clientId: dto.clientId,
        vehicleId: dto.vehicleId,
        workOrderId: dto.workOrderId,
        title: dto.title,
        description: dto.description,
        scheduledStart: new Date(dto.scheduledStart),
        scheduledEnd: new Date(dto.scheduledEnd),
        notes: dto.notes,
        employees: { create: dto.employeeIds.map((employeeId) => ({ employeeId })) },
      },
      ...appointmentInclude,
    });

    return this.serialize(created);
  }

  /**
   * A Mecânico only ever sees appointments they're assigned to — every other
   * cargo (and Admin) sees the whole company's agenda. Resolved server-side
   * from the caller's own session and always wins over a client-supplied
   * `employeeId` filter, so a Mecânico can't narrow to "someone else's"
   * schedule just by passing a different id in the query string.
   */
  async findAll(
    companyId: string,
    query: QueryAppointmentsDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedResult<ReturnType<typeof this.serialize>>> {
    const { page, limit, search, from, to, employeeId, status } = query;
    const viewerScope = await this.resolveViewerScope(companyId, user);
    if (viewerScope === null) {
      return paginate([], 0, page, limit);
    }
    const scopedEmployeeId = viewerScope ?? employeeId;

    const where: Prisma.AppointmentWhereInput = {
      companyId,
      deletedAt: null,
      ...(scopedEmployeeId && { employees: { some: { employeeId: scopedEmployeeId } } }),
      ...(status && { status }),
      ...((from || to) && {
        scheduledStart: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      }),
      ...(search && {
        OR: [{ title: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        orderBy: { scheduledStart: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        ...appointmentInclude,
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return paginate(data.map((appointment) => this.serialize(appointment)), total, page, limit);
  }

  async findOne(companyId: string, id: string, user: AuthenticatedUser): Promise<ReturnType<typeof this.serialize>> {
    const viewerScope = await this.resolveViewerScope(companyId, user);
    if (viewerScope === null) {
      throw new NotFoundException('Appointment not found');
    }
    const viewerEmployeeId = viewerScope;
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
        ...(viewerEmployeeId && { employees: { some: { employeeId: viewerEmployeeId } } }),
      },
      ...appointmentInclude,
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return this.serialize(appointment);
  }

  async update(companyId: string, id: string, dto: UpdateAppointmentDto): Promise<ReturnType<typeof this.serialize>> {
    const existing = await this.prisma.appointment.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!existing) {
      throw new NotFoundException('Appointment not found');
    }

    const scheduledStart = dto.scheduledStart ?? existing.scheduledStart.toISOString();
    const scheduledEnd = dto.scheduledEnd ?? existing.scheduledEnd.toISOString();
    this.assertScheduleIsValid(scheduledStart, scheduledEnd);

    if (dto.employeeIds) {
      await this.assertEmployeesBelongToCompany(companyId, dto.employeeIds);
    }
    if (dto.clientId) {
      await this.assertClientBelongsToCompany(companyId, dto.clientId);
    }
    if (dto.vehicleId) {
      await this.assertVehicleBelongsToCompany(companyId, dto.vehicleId);
    }
    if (dto.workOrderId) {
      await this.assertWorkOrderBelongsToCompany(companyId, dto.workOrderId);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.employeeIds) {
        await tx.appointmentEmployee.deleteMany({ where: { appointmentId: id } });
        await tx.appointmentEmployee.createMany({
          data: dto.employeeIds.map((employeeId) => ({ appointmentId: id, employeeId })),
        });
      }

      return tx.appointment.update({
        where: { id },
        data: {
          clientId: dto.clientId,
          vehicleId: dto.vehicleId,
          workOrderId: dto.workOrderId,
          title: dto.title,
          description: dto.description,
          status: dto.status,
          notes: dto.notes,
          ...(dto.scheduledStart && { scheduledStart: new Date(dto.scheduledStart) }),
          ...(dto.scheduledEnd && { scheduledEnd: new Date(dto.scheduledEnd) }),
        },
        ...appointmentInclude,
      });
    });

    return this.serialize(updated);
  }

  async remove(companyId: string, id: string): Promise<void> {
    const existing = await this.prisma.appointment.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!existing) {
      throw new NotFoundException('Appointment not found');
    }
    await this.prisma.appointment.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  /**
   * `undefined` — not a Mecânico, no scoping applies.
   * `null` — is a Mecânico, but has no linked Employee row: must see nothing,
   * never fall through to an unscoped query just because the lookup came up empty.
   */
  private async resolveViewerScope(companyId: string, user: AuthenticatedUser): Promise<string | null | undefined> {
    if (user.roleName !== roleNameForCargo(Cargo.MECANICO)) {
      return undefined;
    }

    const employee = await this.prisma.employee.findFirst({
      where: { userId: user.id, companyId, deletedAt: null },
      select: { id: true },
    });
    return employee?.id ?? null;
  }

  private assertScheduleIsValid(scheduledStart: string, scheduledEnd: string): void {
    if (new Date(scheduledEnd) <= new Date(scheduledStart)) {
      throw new BadRequestException('O horário de término deve ser depois do horário de início.');
    }
  }

  private async assertEmployeesBelongToCompany(companyId: string, employeeIds: string[]): Promise<void> {
    const count = await this.prisma.employee.count({ where: { id: { in: employeeIds }, companyId, deletedAt: null } });
    if (count !== new Set(employeeIds).size) {
      throw new NotFoundException('One or more employees not found');
    }
  }

  private async assertClientBelongsToCompany(companyId: string, clientId: string): Promise<void> {
    const client = await this.prisma.client.findFirst({ where: { id: clientId, companyId, deletedAt: null } });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
  }

  private async assertVehicleBelongsToCompany(companyId: string, vehicleId: string): Promise<void> {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id: vehicleId, companyId, deletedAt: null } });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
  }

  private async assertWorkOrderBelongsToCompany(companyId: string, workOrderId: string): Promise<void> {
    const workOrder = await this.prisma.workOrder.findFirst({ where: { id: workOrderId, companyId, deletedAt: null } });
    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }
  }

  private serialize(appointment: AppointmentWithRelations) {
    const { employees, ...rest } = appointment;
    return {
      ...rest,
      employees: employees.map((link) => link.employee),
    };
  }
}
