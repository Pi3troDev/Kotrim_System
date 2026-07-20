import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateCheckoutDto {
  @ApiProperty({ description: 'The plan the company wants to subscribe to' })
  @IsUUID()
  planId: string;
}
