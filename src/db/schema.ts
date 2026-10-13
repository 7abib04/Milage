export const CREATE_ENTRIES_TABLE = `
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  distance REAL NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

export const CREATE_SETTINGS_TABLE = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export const CREATE_INDEX_DATE = `
CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date DESC);
`;

export const CREATE_INDEX_CATEGORY = `
CREATE INDEX IF NOT EXISTS idx_entries_category ON entries(category);
`;
