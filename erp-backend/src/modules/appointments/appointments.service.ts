import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';

const appointmentInclude = Prisma.validator<Prisma.AppointmentDefaultArgs>()({
  include: {
    employee: { select: { id: true, name: true } },
    client: { select: { id: true, name: true } },
    vehicle: { select: { id: true, plate: true, brand: true, model: true } },
    workOrder: { select: { id: true, number: true } },
  },
});
type AppointmentWithRelations = Prisma.AppointmentGetPayload<typeof appointmentInclude>;

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateAppointmentDto): Promise<AppointmentWithRelations> {
    this.assertScheduleIsValid(dto.scheduledStart, dto.scheduledEnd);
    await this.assertEmployeeBelongsToCompany(companyId, dto.employeeId);
    if (dto.clientId) {
      await this.assertClientBelongsToCompany(companyId, dto.clientId);
    }
    if (dto.vehicleId) {
      await this.assertVehicleBelongsToCompany(companyId, dto.vehicleId);
    }
    if (dto.workOrderId) {
      await this.assertWorkOrderBelongsToCompany(companyId, dto.workOrderId);
    }

    return this.prisma.appointment.create({
      data: {
        companyId,
        employeeId: dto.employeeId,
        clientId: dto.clientId,
        vehicleId: dto.vehicleId,
        workOrderId: dto.workOrderId,
        title: dto.title,
        description: dto.description,
        scheduledStart: new Date(dto.scheduledStart),
        scheduledEnd: new Date(dto.scheduledEnd),
        notes: dto.notes,
      },
      ...appointmentInclude,
    });
  }

  async findAll(companyId: string, query: QueryAppointmentsDto): Promise<PaginatedResult<AppointmentWithRelations>> {
    const { page, limit, search, from, to, employeeId, status } = query;

    const where: Prisma.AppointmentWhereInput = {
      companyId,
      deletedAt: null,
      ...(employeeId && { employeeId }),
      ...(status && { status }),
      ...((from || to) && {
        scheduledStart: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
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

    return paginate(data, total, page, limit);
  }

  async findOne(companyId: string, id: string): Promise<AppointmentWithRelations> {
    const appointment = await this.prisma.appointment.findFirst({ where: { id, companyId, deletedAt: null }, ...appointmentInclude });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  async update(companyId: string, id: string, dto: UpdateAppointmentDto): Promise<AppointmentWithRelations> {
    const existing = await this.prisma.appointment.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!existing) {
      throw new NotFoundException('Appointment not found');
    }

    const scheduledStart = dto.scheduledStart ?? existing.scheduledStart.toISOString();
    const scheduledEnd = dto.scheduledEnd ?? existing.scheduledEnd.toISOString();
    this.assertScheduleIsValid(scheduledStart, scheduledEnd);

    if (dto.employeeId) {
      await this.assertEmployeeBelongsToCompany(companyId, dto.employeeId);
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

    return this.prisma.appointment.update({
      where: { id },
      data: {
        employeeId: dto.employeeId,
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
  }

  async remove(companyId: string, id: string): Promise<void> {
    const existing = await this.prisma.appointment.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!existing) {
      throw new NotFoundException('Appointment not found');
    }
    await this.prisma.appointment.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private assertScheduleIsValid(scheduledStart: string, scheduledEnd: string): void {
    if (new Date(scheduledEnd) <= new Date(scheduledStart)) {
      throw new BadRequestException('O horário de término deve ser depois do horário de início.');
    }
  }

  private async assertEmployeeBelongsToCompany(companyId: string, employeeId: string): Promise<void> {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, companyId, deletedAt: null } });
    if (!employee) {
      throw new NotFoundException('Employee not found');
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
}
