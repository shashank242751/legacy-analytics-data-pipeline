# Phase 4: Backend ETL Middleware Setup & Implementation

This document details the internal architecture of the NestJS ETL middleware, explaining `.env`, `gcp-key.json`, the 15-column mapping contract, the native JavaScript month-end date calculator, and the PostgreSQL loader.

---

## 1. Environment Variables Explained (`.env`)

Located at `.env` in the project root. Copy `.env.example` → `.env` and fill in your values.

```env
# Google Cloud / BigQuery
GCP_PROJECT_ID=ga4-bigquery-poc-513009
BIGQUERY_DATASET_ID=analytics_561103303
GOOGLE_APPLICATION_CREDENTIALS=./gcp-key.json

PORT=3000

# PostgreSQL
PG_HOST=119.82.96.69
PG_PORT=5432
PG_DATABASE=postgres
PG_USER=postgres
PG_PASSWORD=your_actual_password_here
PG_SCHEMA=analytics_kasturagi
```

| Variable | Where to get it | Purpose |
|---|---|---|
| `GCP_PROJECT_ID` | GCP Console → project dashboard | Passed to BigQuery constructor |
| `BIGQUERY_DATASET_ID` | GA4 Property ID (`analytics_XXXXXXXXX`) | Targets the exact dataset |
| `GOOGLE_APPLICATION_CREDENTIALS` | Local path to `gcp-key.json` | Passed as `keyFilename` to authenticate `@google-cloud/bigquery` |
| `PG_HOST` / `PG_PORT` | Remote Postgres server | Opens PostgreSQL connection pool via `pg` |
| `PG_SCHEMA` | Remote Postgres schema | Targets schema `analytics_kasturagi` |

> See [`docs/gcp-bigquery-setup.md`](./gcp-bigquery-setup.md) for the full step-by-step guide to generate the Service Account key.

### SSH Port Forwarding Tunnel for Remote PostgreSQL
When the target PostgreSQL database is located on a private remote server (e.g. `119.82.96.69`), establish an SSH tunnel in a separate terminal:
```bash
ssh -N -L 15432:127.0.0.1:5432 <ssh-user>@<remote-server-ip>

# Example:
ssh -N -L 15432:127.0.0.1:5432 nichiuser@119.82.96.69
```
This forwards local port `15432` to the remote PostgreSQL port `5432`. Configure `.env` with `PG_HOST=127.0.0.1` and `PG_PORT=15432`.

---

## 2. Structure & Example of `gcp-key.json` (Service Account Key)

To connect to BigQuery, you must obtain a Google Cloud Service Account key file and place it in the project root as `gcp-key.json`.

### Example `gcp-key.json`:
```json
{
  "type": "service_account",
  "project_id": "your-gcp-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_RSA_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-gcp-project-id.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-gcp-project-id.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

Google Cloud generates this file when you download the key for `nestjs-bigquery-reader`:
- **`project_id`**: Identifies which GCP project is billed/queried.
- **`client_email`**: The service account bot email that holds `BigQuery User` and `BigQuery Data Viewer` roles.
- **`private_key`**: A 2048-bit RSA private cryptographic certificate. The official `@google-cloud/bigquery` SDK reads this key and automatically signs OAuth2 Bearer tokens behind the scenes.

> [!CAUTION]
> **Never commit `gcp-key.json` or `.env` to Git.**
> Both `gcp-key.json` and `.env` are listed in `.gitignore` so your private key credentials are never committed to GitHub or any Git repository.

---

## 3. BigQuery Connection Service (`bigquery.service.ts`)

Located at `src/bigquery/bigquery.service.ts`:

```typescript
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
    this.projectId = this.configService.get<string>('GCP_PROJECT_ID');
    this.datasetId = this.configService.get<string>('BIGQUERY_DATASET_ID');

    const keyFilePath = path.resolve(
      process.cwd(),
      this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS') || './gcp-key.json',
    );

    this.bigquery = new BigQuery({
      projectId: this.projectId,
      keyFilename: keyFilePath,
    });
  }

  getProjectId(): string { return this.projectId; }
  getDatasetId(): string { return this.datasetId; }

  async runQuery<T = any>(query: string, params?: Record<string, any>): Promise<T[]> {
    this.logger.log(`Executing BigQuery SQL: ${query}`);
    const [rows] = await this.bigquery.query({ query, params });
    return rows as T[];
  }
}
```

---

## 4. The 15-Column Explicit Mapping Dictionary (`mapping.config.ts`)

Located at `src/etl/mapping.config.ts`:

```typescript
export const COLUMN_MAPPING = {
  event_date: 'activity_date',
  event_timestamp: 'recorded_timestamp',
  event_name: 'action_name',
  user_pseudo_id: 'client_uid',
  device_category: 'device_type',
  device_os: 'operating_system',
  device_browser: 'browser_name',
  geo_country: 'country_name',
  geo_city: 'city_name',
  page_location: 'source_url',
  page_title: 'webpage_title',
  ga_session_id: 'session_identifier',
  session_engaged: 'is_engaged',
  button_label: 'ui_element_label',
  action_type: 'trigger_type',
} as const;

export function mapBigQueryRowToLegacy(row: any): MappedLegacyRow {
  return {
    [COLUMN_MAPPING.event_date]: row.event_date || '',
    [COLUMN_MAPPING.event_timestamp]: Number(row.event_timestamp) || 0,
    [COLUMN_MAPPING.event_name]: row.event_name || '',
    [COLUMN_MAPPING.user_pseudo_id]: row.user_pseudo_id || '',
    [COLUMN_MAPPING.device_category]: row.device_category || 'unknown',
    [COLUMN_MAPPING.device_os]: row.device_os || 'unknown',
    [COLUMN_MAPPING.device_browser]: row.device_browser || 'unknown',
    [COLUMN_MAPPING.geo_country]: row.geo_country || 'unknown',
    [COLUMN_MAPPING.geo_city]: row.geo_city || 'unknown',
    [COLUMN_MAPPING.page_location]: row.page_location || '',
    [COLUMN_MAPPING.page_title]: row.page_title || '',
    [COLUMN_MAPPING.ga_session_id]: row.ga_session_id ? Number(row.ga_session_id) : null,
    [COLUMN_MAPPING.session_engaged]: row.session_engaged || '0',
    [COLUMN_MAPPING.button_label]: row.button_label || '',
    [COLUMN_MAPPING.action_type]: row.action_type || '',
  } as MappedLegacyRow;
}
```

---

## 5. Native JavaScript Month-End Calculator (`date.util.ts`)

Located at `src/etl/date.util.ts`. Uses zero external dependencies:

```typescript
export class MonthDateUtil {
  static getMonthBoundaries(year: number, month: number) {
    // In JS Date, day 0 of month N gives the exact last day of month N!
    const lastDayObj = new Date(year, month, 0);
    const totalDays = lastDayObj.getDate(); // 28, 29, 30, or 31

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return {
      startSuffix: `${year}${pad(month)}01`,
      endSuffix: `${year}${pad(month)}${pad(totalDays)}`,
      totalDays,
    };
  }

  static isTodayLastDayOfMonth(targetDate: Date = new Date()): boolean {
    const tomorrow = new Date(targetDate);
    tomorrow.setDate(targetDate.getDate() + 1);
    return tomorrow.getMonth() !== targetDate.getMonth();
  }
}
```

---

## 6. PostgreSQL Loader & Idempotency (`etl.service.ts`)

Located at `src/etl/etl.service.ts`:

- **Extraction**: Queries all days of the month using `WHERE _TABLE_SUFFIX BETWEEN @startSuffix AND @endSuffix`.
- **Transformation**: Maps BigQuery fields using `mapBigQueryRowToLegacy(row)`.
- **Loading with Idempotency**:
  ```sql
  INSERT INTO analytics_kasturagi.legacy_analytics_events (
    activity_date, recorded_timestamp, action_name, client_uid,
    device_type, operating_system, browser_name, country_name,
    city_name, source_url, webpage_title, session_identifier,
    is_engaged, ui_element_label, trigger_type
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  ON CONFLICT (recorded_timestamp, client_uid, action_name) DO NOTHING;
  ```
  *(The `ON CONFLICT DO NOTHING` clause guarantees that if a sync is re-run, no rows are duplicated and dashboard metrics remain accurate).*

---

## 7. Developer Verification Controller (`dev-tools/`)

Located at `src/dev-tools/dev-tools.controller.ts`:
- **`POST http://localhost:3000/dev-tools/test-sync?year=2026&month=10`**: Manually executes the full ETL pipeline for October 2026 on demand.
- **`GET http://localhost:3000/dev-tools/inspect-legacy-db?limit=10`**: Directly queries and returns the latest records from the remote PostgreSQL table.

