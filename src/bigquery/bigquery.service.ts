import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BigQuery } from '@google-cloud/bigquery';
import * as path from 'path';

@Injectable()
export class BigQueryService {
  private readonly logger = new Logger(BigQueryService.name);
  private bigquery: BigQuery;
  private projectId: string;
  private datasetId: string;

  constructor(private configService: ConfigService) {
    this.projectId = this.configService.get<string>('GCP_PROJECT_ID') || 'ga4-bigquery-poc-513009';
    this.datasetId = this.configService.get<string>('BIGQUERY_DATASET_ID') || 'analytics_561103303';

    const keyFilePath = path.resolve(
      process.cwd(),
      this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS') || './gcp-key.json',
    );

    this.logger.log(`Initializing BigQuery client for Project: [${this.projectId}] with key file: [${keyFilePath}]`);

    this.bigquery = new BigQuery({
      projectId: this.projectId,
      keyFilename: keyFilePath,
    });
  }

  getDatasetId(): string {
    return this.datasetId;
  }

  getProjectId(): string {
    return this.projectId;
  }

  async runQuery<T = any>(query: string, params?: Record<string, any>): Promise<T[]> {
    this.logger.log(`Executing BigQuery SQL: ${query}`);
    try {
      const [rows] = await this.bigquery.query({
        query,
        params,
      });
      return rows as T[];
    } catch (error) {
      this.logger.error(`BigQuery execution error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
