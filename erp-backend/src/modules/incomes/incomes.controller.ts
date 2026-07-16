import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { IncomesService } from './incomes.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { UpdateIncomeStatusDto } from './dto/update-income-status.dto';
import { QueryIncomesDto } from './dto/query-incomes.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('incomes')
@Controller('incomes')
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Post()
  @ApiOperation({ summary: 'Create an income (optionally split into installments) — always returns an array' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateIncomeDto) {
    return this.incomesService.create(user.companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List incomes (paginated, searchable, filterable)' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryIncomesDto) {
    return this.incomesService.findAll(user.companyId, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Aggregate totals for the incomes KPI strip' })
  summary(@CurrentUser() user: AuthenticatedUser) {
    return this.incomesService.summary(user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an income by id' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.incomesService.findOne(user.companyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an income' })
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateIncomeDto) {
    return this.incomesService.update(user.companyId, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Mark an income as pending or cancelled' })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateIncomeStatusDto,
  ) {
    return this.incomesService.updateStatus(user.companyId, id, dto);
  }

  @Patch(':id/stop-recurrence')
  @ApiOperation({ summary: 'Stop future occurrences of a recurring income series' })
  stopRecurrence(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.incomesService.stopRecurrence(user.companyId, id);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Register a (partial or full) payment against an income' })
  addPayment(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CreatePaymentDto) {
    return this.incomesService.addPayment(user.companyId, id, dto);
  }

  @Get(':id/payments')
  @ApiOperation({ summary: 'List payments registered against an income' })
  listPayments(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.incomesService.listPayments(user.companyId, id);
  }

  @Delete(':id/payments/:paymentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a payment (adjusts the income balance/status back)' })
  removePayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
  ): Promise<void> {
    return this.incomesService.removePayment(user.companyId, id, paymentId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an income' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.incomesService.remove(user.companyId, id);
  }
}
