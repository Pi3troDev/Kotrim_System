import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { BillingService } from './billing.service';
import { PlanView } from './interfaces/billing.interfaces';

@ApiTags('billing')
@Controller('plans')
export class PlansController {
  constructor(private readonly billingService: BillingService) {}

  /** Public on purpose: the landing page lists plans to visitors who have no account yet. */
  @Public()
  @Get()
  @ApiOperation({ summary: 'List the active subscription plans' })
  list(): Promise<PlanView[]> {
    return this.billingService.listPlans();
  }
}
