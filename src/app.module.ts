import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BigQueryModule } from './bigquery/bigquery.module';
import { EtlModule } from './etl/etl.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(), // Automated monthly cron
    BigQueryModule,           // BigQuery health & records
    EtlModule,                // ETL health, records & sync (BigQuery → PostgreSQL)
  ],
})
export class AppModule {}
