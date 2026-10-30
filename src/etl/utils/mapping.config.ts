/**
 * Field mapping definition from Google Analytics 4 (BigQuery) to Legacy Postgres.
 * 
 * 15 Column Mapping Contract:
 * 1.  event_date                  -> dt           (Date)
 * 2.  event_timestamp             -> ts           (Timestamp in microseconds)
 * 3.  event_name                  -> eve          (Event name)
 * 4.  user_pseudo_id              -> usr_id       (User Anonymous Cookie ID)
 * 5.  category (device)           -> dev_cat      (Device category)
 * 6.  operating_system (device)   -> dev_os       (Operating System)
 * 7.  web_browser (device)        -> browser_nm   (Browser name)
 * 8.  country (geo)               -> geo_cntry    (Country)
 * 9.  city (geo)                  -> geo_cty      (City)
 * 10. page_location (param)       -> page_url     (Page URL)
 * 11. page_title (param)          -> page_ttl     (Page Title)
 * 12. ga_session_id (param)       -> sess_id      (Session ID)
 * 13. session_engaged (param)     -> sess_eng     (Session engaged flag)
 * 14. button_label (param)        -> btn_lbl      (Custom button clicked)
 * 15. action_type (param)         -> act_typ      (Custom action type)
 */

/**
 * Explicit Column Mapping Dictionary from BigQuery to Legacy PostgreSQL.
 * Format: [BigQuery Source Column Name] : [Legacy Postgres Target Column Name]
 */
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

export interface MappedLegacyRow {
  activity_date: string;
  recorded_timestamp: number;
  action_name: string;
  client_uid: string;
  device_type: string;
  operating_system: string;
  browser_name: string;
  country_name: string;
  city_name: string;
  source_url: string;
  webpage_title: string;
  session_identifier: number | null;
  is_engaged: string;
  ui_element_label: string;
  trigger_type: string;
}

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
