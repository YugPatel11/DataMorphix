import { Dataset, ColumnDetail, GovernanceIssue, Relationship, UsageStat, RenameSuggestion } from './types';

export const DATASETS: Dataset[] = [
  { id: '1', name: 'users_raw', rows: 1250000, cols: 24, lastUpdated: '2024-05-18 02:45' },
  { id: '2', name: 'orders_processed', rows: 840000, cols: 18, lastUpdated: '2024-05-17 18:30' },
  { id: '3', name: 'products_final', rows: 12500, cols: 32, lastUpdated: '2024-05-18 01:15' },
  { id: '4', name: 'marketing_leads', rows: 45000, cols: 12, lastUpdated: '2024-05-16 09:12' },
];

export const COLUMNS: ColumnDetail[] = [
  { name: 'user_id', type: 'string', nullRate: 0, uniqueRate: 100, sampleValues: ['usr_9921', 'usr_0028'], description: 'Unique identifier for each registered user' },
  { name: 'email_address', type: 'string', nullRate: 0.2, uniqueRate: 99.8, sampleValues: ['j.doe@work.com', 'alice@test.io'], description: 'Primary communication address' },
  { name: 'signup_date', type: 'date', nullRate: 0, uniqueRate: 45, sampleValues: ['2023-01-01', '2023-12-31'], description: 'Timestamp when account was Created' },
  { name: 'age', type: 'integer', nullRate: 12.5, uniqueRate: 5, sampleValues: ['24', '42'], description: 'Self-reported age in years' },
  { name: 'is_premium', type: 'boolean', nullRate: 5.2, uniqueRate: 0.1, sampleValues: ['true', 'false'], description: 'Subscription status flag' },
  { name: 'last_login_lat', type: 'float', nullRate: 35.1, uniqueRate: 85, sampleValues: ['34.0522', '-118.2437'], description: 'Latitude of last authenticated session' },
];

export const GOVERNANCE_ISSUES: GovernanceIssue[] = [
  { severity: 'Critical', column: 'user_id', issue: 'Duplicate keys found in raw feed', affectedRows: 242 },
  { severity: 'Warning', column: 'age', issue: 'Out of range values detected (>120)', affectedRows: 15 },
  { severity: 'Info', column: 'email_address', issue: 'Non-standard TLDs (.xyz, .dev) frequent', affectedRows: 890 },
  { severity: 'Warning', column: 'is_premium', issue: 'High null variance compared to v1.2', affectedRows: 12050 },
];

export const RELATIONSHIPS: Relationship[] = [
  { sourceDataset: 'users_raw', sourceColumn: 'user_id', targetDataset: 'orders_processed', targetColumn: 'customer_id', type: 'FK' },
  { sourceDataset: 'orders_processed', sourceColumn: 'product_sku', targetDataset: 'products_final', targetColumn: 'sku', type: 'FK' },
  { sourceDataset: 'marketing_leads', sourceColumn: 'email', targetDataset: 'users_raw', targetColumn: 'email_address', type: 'Shared Values' },
  { sourceDataset: 'users_raw', sourceColumn: 'signup_date', targetDataset: 'marketing_leads', targetColumn: 'converted_at', type: 'Similar Name' },
];

export const USAGE_STATS: UsageStat[] = [
  { column: 'user_id', emptyRate: 0, duplicateRate: 0.02, topValue: 'N/A', lastAccessed: '1h ago' },
  { column: 'email_address', emptyRate: 0.2, duplicateRate: 0.1, topValue: 'g.com -> 34%', lastAccessed: '4h ago' },
  { column: 'age', emptyRate: 12.5, duplicateRate: 98, topValue: '28 -> 4%', lastAccessed: '12m ago' },
  { column: 'is_premium', emptyRate: 5.2, duplicateRate: 99.9, topValue: 'false -> 82%', lastAccessed: '2h ago' },
];

export const RENAME_SUGGESTIONS: RenameSuggestion[] = [
  { currentName: 'last_login_lat', suggestedName: 'auth_latitude', reason: 'Align with corporate location schema', confidence: 94 },
  { currentName: 'is_premium', suggestedName: 'subscription_status', reason: 'Better descriptive type', confidence: 82 },
  { currentName: 'signup_date', suggestedName: 'created_at_utc', reason: 'Include timezone context', confidence: 88 },
];
