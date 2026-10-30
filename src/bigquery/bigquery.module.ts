import { Module } from '@nestjs/common';
import { BigQueryService } from './bigquery.service';
import { BigQueryController } from './bigquery.controller';

@Module({
  controllers: [BigQueryController],
  providers: [BigQueryService],
  exports: [BigQueryService],
})
export class BigQueryModule {}

