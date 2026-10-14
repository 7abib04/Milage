export const CREATE_ENTRIES_TABLE = `
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  distance REAL NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  start_time TEXT,
  end_time TEXT,
  duration_seconds INTEGER DEFAULT 0,
  segments_count INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

export const CREATE_ACTIVE_SESSION_TABLE = `
CREATE TABLE IF NOT EXISTS active_trip_session (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  is_tracking INTEGER NOT NULL DEFAULT 0,
  is_paused INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  start_time_ms INTEGER NOT NULL,
  start_time_str TEXT NOT NULL,
  elapsed_seconds INTEGER NOT NULL DEFAULT 0,
  distance_km REAL NOT NULL DEFAULT 0,
  last_lat REAL,
  last_lon REAL,
  current_speed_kmh REAL DEFAULT 0,
  segments_json TEXT DEFAULT '[]',
  notes TEXT
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
