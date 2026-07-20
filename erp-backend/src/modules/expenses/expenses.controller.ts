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
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { UpdateExpenseStatusDto } from './dto/update-expense-status.dto';
import { QueryExpensesDto } from './dto/query-expenses.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RequiresFeature } from '../../common/decorators/requires-feature.decorator';
import { PlanFeature } from '../billing/plan-features';

@ApiTags('expenses')
@RequiresFeature(PlanFeature.FINANCE)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Create an expense (optionally split into installments) — always returns an array' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(user.companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List expenses (paginated, searchable, filterable)' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryExpensesDto) {
    return this.expensesService.findAll(user.companyId, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Aggregate totals for the expenses KPI strip' })
  summary(@CurrentUser() user: AuthenticatedUser) {
    return this.expensesService.summary(user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an expense by id' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.expensesService.findOne(user.companyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense' })
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expensesService.update(user.companyId, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Mark an expense as pending or cancelled' })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseStatusDto,
  ) {
    return this.expensesService.updateStatus(user.companyId, id, dto);
  }

  @Patch(':id/stop-recurrence')
  @ApiOperation({ summary: 'Stop future occurrences of a recurring expense series' })
  stopRecurrence(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.expensesService.stopRecurrence(user.companyId, id);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Register a (partial or full) payment against an expense' })
  addPayment(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CreatePaymentDto) {
    return this.expensesService.addPayment(user.companyId, id, dto);
  }

  @Get(':id/payments')
  @ApiOperation({ summary: 'List payments registered against an expense' })
  listPayments(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.expensesService.listPayments(user.companyId, id);
  }

  @Delete(':id/payments/:paymentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a payment (adjusts the expense balance/status back)' })
  removePayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
  ): Promise<void> {
    return this.expensesService.removePayment(user.companyId, id, paymentId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an expense' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.expensesService.remove(user.companyId, id);
  }
}
