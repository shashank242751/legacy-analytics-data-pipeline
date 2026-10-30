import { Controller, Get, Query } from '@nestjs/common';
import { BigQueryService } from '../bigquery/bigquery.service';
import { MonthDateUtil } from '../etl/utils/date.util';

@Controller('bigquery')
export class BigQueryController {
  constructor(private readonly bqService: BigQueryService) { }

  /**
   * Health Check: BigQuery Connection
   * GET http://localhost:3000/bigquery/health
   */
  @Get('health')
  async checkHealth() {
    try {
      const rows = await this.bqService.runQuery('SELECT 1 AS connection_test');
      return {
        database: 'Google BigQuery',
        connected: true,
        message: 'Successfully authenticated and connected to BigQuery!',
        result: rows,
      };
    } catch (err) {
      return {
        database: 'Google BigQuery',
        connected: false,
        error: err.message,
      };
    }
  }

  /**
   * Raw Records Preview from BigQuery
   * GET http://localhost:3000/bigquery/records?year=2026&month=10&limit=10
   */
  @Get('records')
  async inspectRecords(
    @Query('year') yearParam?: string,
    @Query('month') monthParam?: string,
    @Query('limit') limitParam?: string,
  ) {
    const year = yearParam ? parseInt(yearParam, 10) : 2026;
    const month = monthParam ? parseInt(monthParam, 10) : 10;
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    const { startSuffix, endSuffix } = MonthDateUtil.getMonthBoundaries(year, month);
    const projectId = this.bqService.getProjectId();
    const datasetId = this.bqService.getDatasetId();

    const sql = `
      SELECT
        event_date,
        event_timestamp,
        event_name,
        user_pseudo_id,
        device.category AS device_category,
        device.operating_system AS device_os,
        device.web_info.browser AS device_browser,
        geo.country AS geo_country,
        geo.city AS geo_city
      FROM \`${projectId}.${datasetId}.events_*\`
      WHERE _TABLE_SUFFIX BETWEEN @startSuffix AND @endSuffix
      LIMIT @limit
    `;

    try {
      const rows = await this.bqService.runQuery(sql, { startSuffix, endSuffix, limit });
      return {
        source: 'Google BigQuery',
        tableRange: `events_${startSuffix} to events_${endSuffix}`,
        recordCount: rows.length,
        data: rows,
      };
    } catch (err) {
      return {
        source: 'Google BigQuery',
        error: err.message,
      };
    }
  }
}

