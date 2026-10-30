# Legacy Analytics Data Pipeline (GA4 + BigQuery + PostgreSQL ETL)

An enterprise-grade NestJS ETL middleware that bridges modern **Google Analytics 4 (GA4)** event data exported to **Google BigQuery** with a **Legacy PostgreSQL Database**, preserving existing production dashboards without requiring schema alterations or query refactoring.

---

## 🏗️ Architecture Overview

```
Frontend (gtag.js) ──► Google Analytics 4 ──► Google BigQuery (events_*)
                                                    │
                                                    ▼
                                            NestJS ETL Middleware
                                            (Extract -> Map -> Transform)
                                                    │
                                                    ▼
                                            Legacy PostgreSQL DB
                                                    │
                                                    ▼
                                       Existing Business Dashboard
```

---

## ⚡ Quick Start & Developer Onboarding

### 1. Prerequisites
- **Node.js** (v18 or v20+)
- **PostgreSQL** instance running
- **GCP Service Account Key** with:
  - `BigQuery User` (`roles/bigquery.user`)
  - `BigQuery Data Viewer` (`roles/bigquery.dataViewer`)

### 2. Service Account Key (`gcp-key.json`)
You **must** place your Google Cloud Service Account JSON key file in the **project root directory** and name it `gcp-key.json`.

#### Example `gcp-key.json`:
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

> [!IMPORTANT]
> **Do NOT commit `gcp-key.json` or `.env` to Git.**
> Both `gcp-key.json` and `.env` are configured in `.gitignore` to prevent confidential credentials from leaking into version control.

---

### 3. Environment Setup (`.env`)
Copy `.env.example` to `.env` and adjust your database and GCP settings:

```bash
cp .env.example .env
```

```env
# Google Cloud / BigQuery
GCP_PROJECT_ID=ga4-bigquery-poc-513009
BIGQUERY_DATASET_ID=analytics_561103303
GOOGLE_APPLICATION_CREDENTIALS=./gcp-key.json

PORT=3000

# PostgreSQL Legacy Database Connection
PG_HOST=127.0.0.1
PG_PORT=15432
PG_DATABASE=postgres
PG_USER=postgres
PG_PASSWORD=your_password
PG_SCHEMA=analytics_kasturagi
```

---

### 4. Installation & Running

```bash
# 1. Install dependencies
npm install

# 2. Run development server (with hot reload)
npm run start:dev

# 3. Build & Run in Production
npm run build
npm run start:prod
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/bigquery/health` | Verifies BigQuery connection & permissions |
| `GET` | `/bigquery/records?year=2026&month=10` | Previews raw BigQuery events |
| `GET` | `/postgres/health` | Verifies PostgreSQL database connection |
| `GET` | `/postgres/records?limit=10` | Inspects rows in the legacy PostgreSQL table |
| `POST` | `/postgres/sync?year=2026&month=10` | Manually triggers the ETL sync pipeline |

---

## 📚 Detailed Documentation

Detailed guides covering the full implementation are available in the [`docs/`](./docs) directory:

- [1. Frontend & GA4 Setup Guide (`docs/frontend-setup.md`)](./docs/frontend-setup.md)
- [2. Google Cloud & BigQuery Setup Guide (`docs/gcp-bigquery-setup.md`)](./docs/gcp-bigquery-setup.md)
- [3. GA4 to BigQuery Linking Guide (`docs/ga4-bigquery-link.md`)](./docs/ga4-bigquery-link.md)
- [4. Backend ETL Middleware Implementation Guide (`docs/backend-setup.md`)](./docs/backend-setup.md)
