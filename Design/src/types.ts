export interface Dataset {
  id: string;
  name: string;
  rows: number;
  cols: number;
  lastUpdated: string;
}

export interface ColumnDetail {
  name: string;
  type: 'string' | 'integer' | 'float' | 'boolean' | 'date';
  nullRate: number;
  uniqueRate: number;
  sampleValues: string[];
  description: string;
}

export interface GovernanceIssue {
  severity: 'Critical' | 'Warning' | 'Info';
  column: string;
  issue: string;
  affectedRows: number;
}

export interface Relationship {
  sourceDataset: string;
  sourceColumn: string;
  targetDataset: string;
  targetColumn: string;
  type: 'FK' | 'Similar Name' | 'Shared Values';
}

export interface UsageStat {
  column: string;
  emptyRate: number;
  duplicateRate: number;
  topValue: string;
  lastAccessed: string;
}

export interface RenameSuggestion {
  currentName: string;
  suggestedName: string;
  reason: string;
  confidence: number;
}
