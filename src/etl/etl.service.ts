import { Injectable, Logger } from '@nestjs/common';
import { BigQueryService } from '../bigquery/bigquery.service';
import { DatabaseService } from '../database/database.service';
import { MonthDateUtil } from './utils/date.util';
import { mapBigQueryRowToLegacy, MappedLegacyRow } from './utils/mapping.config';

@Injectable()
export class EtlService {
  private readonly logger = new Logger(EtlService.name);

  constructor(
    private readonly bqService: BigQueryService,
    private readonly dbService: DatabaseService,
  ) {}

  /**
   * Main ETL pipeline: Extract from BigQuery → Transform → Load into PostgreSQL
   * Called manually via POST /etl/sync or automatically by EtlCron on last day of month
   */
  async executeMonthlySync(year: number, month: number) {
    const { startSuffix, endSuffix, totalDays } = MonthDateUtil.getMonthBoundaries(year, month);
    const projectId = this.bqService.getProjectId();
    const datasetId = this.bqService.getDatasetId();

    this.logger.log(
      `[ETL] Starting sync for ${year}-${month} | Table range: events_${startSuffix} → events_${endSuffix} (${totalDays} days)`,
    );

    // ─── Step 1: Extract from BigQuery ───────────────────────────────────────
    const bqQuery = `
      SELECT
        event_date,
        event_timestamp,
        event_name,
        user_pseudo_id,
        device.category                                                                         AS device_category,
        device.operating_system                                                                 AS device_os,
        device.web_info.browser                                                                 AS device_browser,
        geo.country                                                                             AS geo_country,
        geo.city                                                                                AS geo_city,
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location')       AS page_location,
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_title')          AS page_title,
        (SELECT COALESCE(value.int_value, CAST(value.string_value AS INT64))
          FROM UNNEST(event_params) WHERE key = 'ga_session_id')                               AS ga_session_id,
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'session_engaged')     AS session_engaged,
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'button_label')        AS button_label,
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'action_type')         AS action_type
      FROM \`${projectId}.${datasetId}.events_*\`
      WHERE _TABLE_SUFFIX BETWEEN @startSuffix AND @endSuffix
    `;

    let rows: any[] = [];
    try {
      rows = await this.bqService.runQuery(bqQuery, { startSuffix, endSuffix });
      this.logger.log(`[ETL] Extracted ${rows.length} records from BigQuery`);
    } catch (err) {
      this.logger.error(`[ETL] BigQuery extraction failed: ${err.message}`);
      throw err;
    }

    if (!rows.length) {
      return {
        status: 'empty',
        message: `No records found in BigQuery for range ${startSuffix} to ${endSuffix}`,
        extracted: 0,
        inserted: 0,
      };
    }

    // ─── Step 2: Transform — rename BigQuery columns → legacy column names ───
    const mappedRecords: MappedLegacyRow[] = rows.map((r) => mapBigQueryRowToLegacy(r));

    // ─── Step 3: Load into PostgreSQL (idempotent — no duplicates) ───────────
    const insertSql = `
      INSERT INTO analytics_kasturagi.legacy_analytics_events (
        activity_date, recorded_timestamp, action_name, client_uid,
        device_type, operating_system, browser_name,
        country_name, city_name, source_url, webpage_title,
        session_identifier, is_engaged, ui_element_label, trigger_type
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      ON CONFLICT (recorded_timestamp, client_uid, action_name) DO NOTHING;
    `;

    let insertedCount = 0;
    for (const item of mappedRecords) {
      await this.dbService.query(insertSql, [
        item.activity_date,
        item.recorded_timestamp,
        item.action_name,
        item.client_uid,
        item.device_type,
        item.operating_system,
        item.browser_name,
        item.country_name,
        item.city_name,
        item.source_url,
        item.webpage_title,
        item.session_identifier,
        item.is_engaged,
        item.ui_element_label,
        item.trigger_type,
      ]);
      insertedCount++;
    }

    this.logger.log(`[ETL] Sync complete → ${insertedCount} records processed into legacy_analytics_events`);

    return {
      status: 'success',
      month: `${year}-${month}`,
      range: `${startSuffix} to ${endSuffix}`,
      totalDaysInMonth: totalDays,
      recordsExtracted: rows.length,
      recordsProcessed: insertedCount,
      sampleMappedRecords: mappedRecords.slice(0, 5),
    };
  }

  /**
   * Query rows from the legacy PostgreSQL table
   */
  async getLegacyRecords(limit: number = 20) {
    const res = await this.dbService.query(
      `SELECT * FROM analytics_kasturagi.legacy_analytics_events ORDER BY recorded_timestamp DESC LIMIT $1`,
      [limit],
    );
    return res.rows;
  }
}
