# Architecture & Enterprise Problem Statement

---

## 1. Problem Statement

Modern enterprise web applications frequently evolve their tracking mechanisms. When transitioning to **Google Analytics 4 (GA4)**, companies face a significant data engineering hurdle:

1. **GA4 Modern Schema**: GA4 automatically exports event-level rows into **Google BigQuery** using standardized modern column names (`event_name`, `user_pseudo_id`, `event_date`, `device.category`, etc.).
2. **Legacy Production Infrastructure**: The company's production dashboard (e.g. Apache Superset, Metabase, PowerBI, or custom dashboards) directly reads from an existing **Legacy PostgreSQL Database** (`analytics_kasturagi.legacy_analytics_events`).
3. **The Constraint**: The company **must NOT touch, refactor, or break** the legacy PostgreSQL database schema or the existing dashboard queries. Rewriting production dashboard queries carries high operational risk and business downtime.
4. **The Solution**: Build an **Intermediate Middleware ETL Adapter** using **NestJS**:
   - Queries raw analytics events directly from **Google BigQuery**.
   - Applies an explicit **Column Mapping Layer** (`event_name` &rarr; `action_name`, `user_pseudo_id` &rarr; `client_uid`, `event_date` &rarr; `activity_date`, etc.).
   - Dynamically calculates the month's date boundaries (28, 29, 30, or 31 days) using native JavaScript.
   - Batch-inserts mapped rows into the legacy PostgreSQL table on a monthly scheduled cron job (`ON CONFLICT DO NOTHING`), keeping the dashboard completely operational without changing a single line of legacy reporting code.

---

## 2. Proposed Architecture Flow

```
┌────────────────────────────────────────────────────────┐
│               Website (Frontend HTML/JS)               │
│               Collects website user events             │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼  (gtag.js / HTTPS)
┌────────────────────────────────────────────────────────┐
│               Google Analytics 4 (GA4)                 │
│               Ingests events & processes sessions      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼  (Automated Daily Batch Export)
┌────────────────────────────────────────────────────────┐
│                   Google BigQuery                      │
│       Stores exported GA4 data in tables such as       │
│                  events_YYYYMMDD                       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼  (BigQuery SQL via Service Account)
┌────────────────────────────────────────────────────────┐
│              NestJS ETL Sync Pipeline                  │
│  Scheduled extraction -> column mapping ->             │
│  transformation -> PostgreSQL insert/upsert            │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼  (Batch INSERT / Upsert)
┌────────────────────────────────────────────────────────┐
│             Legacy PostgreSQL Database                 │
│     Existing tables and old column names remain        │
│                    unchanged                           │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼  (Unmodified SQL Queries)
┌────────────────────────────────────────────────────────┐
│             Existing Analytics Dashboard               │
│            Continues reading the legacy schema         │
└────────────────────────────────────────────────────────┘
```

---

## 3. Documentation Structure

This `docs/` directory contains complete, step-by-step documentation for every stage of the pipeline:

- [1. Frontend & GA4 Setup Guide (`frontend-setup.md`)](./frontend-setup.md): How the website tracking script was created and configured with the GA4 property.
- [2. Google Cloud & BigQuery Setup Guide (`gcp-bigquery-setup.md`)](./gcp-bigquery-setup.md): Creating the GCP project, enabling BigQuery API, setting up the Service Account with the two required IAM roles, and generating the JSON key.
- [3. GA4 to BigQuery Linking Guide (`ga4-bigquery-link.md`)](./ga4-bigquery-link.md): How GA4 was linked to BigQuery and how daily export frequencies work.
- [4. Backend ETL Middleware Setup Guide (`backend-setup.md`)](./backend-setup.md): Configuration of `.env`, `gcp-key.json`, the 15-column mapping layer, the month-end date calculator, and the PostgreSQL loader.

