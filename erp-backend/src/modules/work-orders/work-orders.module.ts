import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';

@Module({
  imports: [InventoryModule],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
})
export class WorkOrdersModule {}
