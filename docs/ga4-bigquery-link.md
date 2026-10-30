# Phase 3: Linking Google Analytics 4 to Google BigQuery

This document explains how GA4 was linked to BigQuery, how dataset naming works, and the nature of export latency.

---

## 1. Establishing the BigQuery Link in GA4

1. Return to your [Google Analytics](https://analytics.google.com/) tab.
2. In the bottom-left corner, click **Admin (⚙️)**.
3. Scroll down the Property column to **Product links** &gt; click **BigQuery links**.
4. In the top-right corner, click the blue **Link** button:
   - Click **Choose a Google Cloud project**.
   - Select your project: `ga4-bigquery-poc` (`ga4-bigquery-poc-513009`).
   - Click **Confirm** (top right).
5. **Data Location**: Choose `US` (or your preferred multi-region/region).
6. **Export Types & Frequencies**:
   - Check **Daily** (Batch export of the complete day's events; fully free-tier eligible).
   - *Streaming Note*: Streaming export provides real-time intra-day updates, but requires an active billing account attached to the GCP project. For our POC, **Daily export** is used.
7. Click **Next** &gt; Review configuration &gt; click **Submit**.
8. GA4 will show **"Link created"**.

---

## 2. BigQuery Dataset & Table Naming Conventions

Google Analytics 4 follows an automatic, unchangeable naming rule:

### 1. Dataset Naming:
The dataset is **always** named using the format:
```
analytics_<PROPERTY_ID>
```
In our project, the GA4 Property ID is `561103303`, so the BigQuery dataset is:
```
analytics_561103303
```

### 2. Daily Table Naming:
Google's automated export creates one partitioned table per day:
```
events_YYYYMMDD
```
- Example: `events_20261028` (events collected on October 28, 2026).
- Example: `events_20261029` (events collected on October 29, 2026).

### 3. The SQL Wildcard:
To query across all days in an entire month without writing 31 separate queries, BigQuery SQL supports the wildcard table syntax:
```sql
FROM `ga4-bigquery-poc-513009.analytics_561103303.events_*`
WHERE _TABLE_SUFFIX BETWEEN '20261001' AND '20261031'
```

---

## 3. Understanding Export Latency (Why BigQuery is Empty on Day 1)

When using **Daily Export**:
- GA4 does **not** push events second-by-second into BigQuery.
- It aggregates data locally throughout the calendar day until the day finishes in your property's reporting timezone (`(GMT+05:30) India Time`).
- Only **after midnight** does Google's automated batch export job trigger, create the dataset `analytics_561103303`, and deposit `events_YYYYMMDD`.
- According to Google's official documentation, the first daily export batch typically lands in BigQuery within **24 hours** after the link is established (in our case, between morning and early afternoon).

