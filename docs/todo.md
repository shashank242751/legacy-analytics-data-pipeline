# POC: Google Analytics 4 + BigQuery + NestJS Backend

## Objective
Build a working Proof of Concept (POC) to demonstrate how Google Analytics 4 (GA4) collects website events, exports analytics data to BigQuery, and allows a NestJS backend to query that data using SQL and expose it through REST APIs.

## Technology Stack
- Frontend: HTML, CSS, and JavaScript
- Analytics: Google Analytics 4 (GA4 Standard)
- Data warehouse: Google BigQuery
- Backend: NestJS with TypeScript
- Google Cloud SDK: Official `@google-cloud/bigquery` Node.js library

## Architecture
1. A simple website generates events such as `page_view` and `button_click`.
2. GA4 collects these events and displays them in its reports.
3. GA4 exports event-level data to a linked BigQuery dataset.
4. BigQuery stores the exported events in tables.
5. The NestJS backend executes SQL queries against BigQuery.
6. The backend returns query results as JSON through REST APIs.
7. The results can optionally be displayed on a simple dashboard.

## Implementation Plan

### Phase 1: Create a test website
- Create a simple local website in an `analytics-poc` directory.
- Add a heading, navigation links, and test buttons.
- Integrate GA4 using the Google tag and a Measurement ID.
- Track page views and a custom `button_click` event.
- Explain how to configure the GA4 property and Web data stream.
- Verify that events appear in GA4 Realtime reports or DebugView.

### Phase 2: Configure Google Cloud and BigQuery
- Explain how to create or select a Google Cloud project.
- Explain how to enable the BigQuery API.
- Link the GA4 property to BigQuery using GA4 Admin settings.
- Enable the appropriate export options.
- Explain the required IAM permissions and billing setup.
- Show how to locate the exported dataset and inspect tables such as `events_YYYYMMDD`.
- Explain daily export versus streaming export and their latency limitations.
- Provide sample SQL queries to count events by name and date.

### Phase 3: Integrate BigQuery with NestJS
- Create a NestJS backend using the NestJS CLI.
- Install and configure `@google-cloud/bigquery`.
- Create an Analytics module, service, and controller.
- Configure Google Cloud credentials securely using Application Default Credentials or an appropriate service account.
- Never expose service-account credentials in frontend code or commit credentials to Git.
- Implement the following endpoints:
  - `GET /analytics/events` — return event counts grouped by event name.
  - `GET /analytics/summary` — return a summary for a specified date range.
  - `GET /analytics/top-events` — return the most frequent events.
- Validate date parameters and use parameterized SQL where appropriate.
- Restrict the BigQuery identity to the minimum permissions needed.

### Phase 4: Demonstrate the POC
- Open the test website and generate several events.
- Verify that events appear in GA4.
- Wait for the events to become available in BigQuery.
- Run SQL queries in the BigQuery console.
- Call the NestJS endpoints using Postman or a browser.
- Compare the SQL results with the API responses.
- Explain why the latest events may not appear immediately due to export latency.

## Cost and Security Requirements
- Prefer GA4 Standard; Google Analytics 360 is not required for this POC.
- Check BigQuery free-tier eligibility and current pricing before enabling services.
- Configure billing budgets, alerts, and query cost controls.
- Avoid unnecessary streaming exports and expensive queries.
- Do not collect passwords, payment information, or other sensitive personal information.
- Use only synthetic test activity and authorized test data.

## Instructions for the AI Agent
1. First inspect the existing workspace and avoid overwriting existing projects.
2. Explain each step in beginner-friendly language.
3. Work in phases, completing and verifying each phase before proceeding.
4. Clearly distinguish actions I must perform in Google Cloud or Google Analytics from code you can implement locally.
5. Never invent my Google Analytics Measurement ID, project ID, dataset ID, or credentials. Use clearly marked placeholders until I provide actual values.
6. Generate complete, runnable code with the correct project structure, installation commands, configuration examples, and a `.env.example` file.
7. Do not place secrets in frontend code or commit them to source control.
8. Start with Phase 1 only. Ask me to complete the required Google Analytics setup and verify event collection before moving to Phase 2.

The final goal is a working demonstration of the full pipeline:

Website → GA4 → BigQuery → NestJS REST API → JSON response.
