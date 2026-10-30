import { Module } from '@nestjs/common';
import { EtlController } from './etl.controller';
import { EtlService } from './etl.service';
import { EtlCron } from './etl.cron';
import { BigQueryModule } from '../bigquery/bigquery.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [BigQueryModule, DatabaseModule],
  controllers: [EtlController],
  providers: [EtlService, EtlCron],
})
export class EtlModule {}
