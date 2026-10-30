import { Controller, Get, Post, Query } from '@nestjs/common';
import { EtlService } from './etl.service';
import { DatabaseService } from '../database/database.service';

@Controller(['postgres', 'etl'])
export class EtlController {
  constructor(
    private readonly etlService: EtlService,
    private readonly dbService: DatabaseService,
  ) {}

  /**
   * Health Check: Legacy PostgreSQL Connection
   * GET http://localhost:3000/etl/health
   */
  @Get('health')
  async checkHealth() {
    try {
      await this.dbService.checkConnection();
      return {
        database: 'PostgreSQL Legacy Database',
        connected: true,
      };
    } catch (err) {
      console.error(`[ETL Health] ${err.code ?? 'ERR'}: ${err.message}`);
      return {
        database: 'PostgreSQL Legacy Database',
        connected: false,
        error: err.message,
      };
    }
  }

  /**
   * Inspect records stored in the legacy PostgreSQL table
   * GET http://localhost:3000/etl/records?limit=10
   */
  @Get('records')
  async inspectRecords(@Query('limit') limitParam?: string) {
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    try {
      const rows = await this.etlService.getLegacyRecords(limit);
      return {
        source: 'Legacy PostgreSQL (analytics_kasturagi.legacy_analytics_events)',
        rowCount: rows.length,
        records: rows,
      };
    } catch (err) {
      return {
        source: 'Legacy PostgreSQL',
        error: err.message,
      };
    }
  }

  /**
   * Trigger manual ETL sync from BigQuery → PostgreSQL
   * POST http://localhost:3000/etl/sync?year=2026&month=10
   */
  @Post('sync')
  async triggerSync(
    @Query('year') yearParam?: string,
    @Query('month') monthParam?: string,
  ) {
    const now = new Date();
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;

    try {
      return await this.etlService.executeMonthlySync(year, month);
    } catch (err) {
      return {
        status: 'error',
        stage: 'ETL Sync Pipeline',
        message: err.message,
      };
    }
  }
}
