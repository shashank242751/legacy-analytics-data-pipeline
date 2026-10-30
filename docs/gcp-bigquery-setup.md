# GCP & BigQuery Setup Guide

This document explains how to configure Google Cloud Platform (GCP), generate a Service Account key, and correctly set up the project's `.env` file. Follow this guide when onboarding or cloning the project.

---

## 1. Creating the Google Cloud Project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown → **New Project**.
   - **Project Name**: `ga4-bigquery-poc`
   - **Project ID**: auto-generated (e.g. `ga4-bigquery-poc-513009`)
3. Click **Create**.

---

## 2. Enabling the BigQuery API

1. In the GCP search bar, search for **BigQuery API**.
2. Click **Enable** if not already enabled.

---

## 3. Creating the Service Account

1. Go to **IAM & Admin** → **Service Accounts**.
2. Click **+ Create Service Account**:
   - **Name**: `nestjs-bigquery-reader`
   - **ID**: `nestjs-bigquery-reader@<your-project-id>.iam.gserviceaccount.com`
3. Click **Create and Continue**.

---

## 4. Assigning IAM Roles

Under **Grant this service account access to project**, add both roles:

| Role | Why Required |
|------|-------------|
| `BigQuery User` (`roles/bigquery.user`) | Permission to create and run query jobs |
| `BigQuery Data Viewer` (`roles/bigquery.dataViewer`) | Permission to read table data |

> [!CAUTION]
> If you only assign `BigQuery User` without `BigQuery Data Viewer`, queries will fail with:
> `Access Denied: Table events_*: User does not have permission to query table`

Click **Save**.

---

## 5. Generating the JSON Key File (`gcp-key.json`)

1. In **Service Accounts**, click on `nestjs-bigquery-reader`.
2. Go to the **Keys** tab → **Add Key** → **Create new key** → **JSON**.
3. Google downloads a key file (e.g. `ga4-bigquery-poc-513009-xxxx.json`).
4. Rename or copy this file into the project root directory as:
   ```
   gcp-key.json
   ```

### Example of `gcp-key.json`:
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

> [!CAUTION]
> **Never commit `gcp-key.json` or `.env` to Git.**
> Both `gcp-key.json` and `.env` are explicitly ignored in `.gitignore`. Git will block and ignore them automatically so confidential private keys are never exposed.

---

## 6. Setting Up Your Environment (New Developer Onboarding)

When cloning this project on a new machine:

**Step 1** — Copy the example env file:
```bash
cp .env.example .env
```

**Step 2** — Place your downloaded service account key:
Put your `gcp-key.json` file in the project root (same level as `.env` and `package.json`).

**Step 3** — Verify `.env` configuration:
```env
# Google Cloud & BigQuery Configuration
GCP_PROJECT_ID=ga4-bigquery-poc-513009
BIGQUERY_DATASET_ID=analytics_561103303
GOOGLE_APPLICATION_CREDENTIALS=./gcp-key.json

PORT=3000

# PostgreSQL Legacy Database Connection
PG_HOST=119.82.96.69
PG_PORT=5432
PG_DATABASE=postgres
PG_USER=postgres
PG_PASSWORD=your_actual_password_here
PG_SCHEMA=analytics_kasturagi
```

---

## 7. How Credentials Are Used in Code

The app reads `GOOGLE_APPLICATION_CREDENTIALS` via `ConfigService` in [`src/bigquery/bigquery.service.ts`](../src/bigquery/bigquery.service.ts):

```typescript
const keyFilePath = path.resolve(
  process.cwd(),
  this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS') || './gcp-key.json',
);

this.bigquery = new BigQuery({
  projectId: this.projectId,
  keyFilename: keyFilePath,
});
```

Because `keyFilename` points to `./gcp-key.json` on disk, the official `@google-cloud/bigquery` SDK automatically handles authentication, token generation, and renewal without exposing the private key in your codebase or version control.

---

## 8. Verifying the Setup

Start the server and hit the health check:
```bash
npm run start:dev
curl http://localhost:3000/bigquery/health
```

Expected response:
```json
{ "status": "ok", "bigquery": "connected" }
```

