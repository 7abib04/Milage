import * as SQLite from 'expo-sqlite';
import {
  CREATE_ENTRIES_TABLE,
  CREATE_INDEX_CATEGORY,
  CREATE_INDEX_DATE,
  CREATE_SETTINGS_TABLE,
} from './schema';
import { AppSettings, CategoryStat, ChartDataPoint, Entry, KPIStats, NewEntry, Timeframe } from '../types';
import { Colors } from '../theme/colors';

const DB_NAME = 'km_tracker.db';
let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDB = (): SQLite.SQLiteDatabase => {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync(DB_NAME);
  }
  return dbInstance;
};

export const initDatabase = async (): Promise<void> => {
  try {
    const db = getDB();
    await db.execAsync(CREATE_ENTRIES_TABLE);
    await db.execAsync(CREATE_SETTINGS_TABLE);
    await db.execAsync(CREATE_INDEX_DATE);
    await db.execAsync(CREATE_INDEX_CATEGORY);

    // Initialize default settings if not exists
    const existingGoal = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      'monthlyGoalKm'
    );
    if (!existingGoal) {
      await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'monthlyGoalKm', '100');
      await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'unit', 'km');
      await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'hapticsEnabled', 'true');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const fetchAllEntries = async (): Promise<Entry[]> => {
  try {
    const db = getDB();
    const rows = await db.getAllAsync<Entry>(
      'SELECT id, distance, category, date, notes, created_at FROM entries ORDER BY date DESC, id DESC'
    );
    return rows;
  } catch (error) {
    console.error('Error fetching entries:', error);
    return [];
  }
};

export const insertEntry = async (entry: NewEntry): Promise<Entry> => {
  try {
    const db = getDB();
    const result = await db.runAsync(
      'INSERT INTO entries (distance, category, date, notes) VALUES (?, ?, ?, ?)',
      entry.distance,
      entry.category,
      entry.date,
      entry.notes || ''
    );

    const insertedId = result.lastInsertRowId;
    const inserted = await db.getFirstAsync<Entry>(
      'SELECT id, distance, category, date, notes, created_at FROM entries WHERE id = ?',
      insertedId
    );

    if (!inserted) {
      return {
        id: insertedId,
        ...entry,
        created_at: new Date().toISOString(),
      };
    }
    return inserted;
  } catch (error) {
    console.error('Error inserting entry:', error);
    throw error;
  }
};

export const updateEntry = async (entry: Entry): Promise<void> => {
  try {
    const db = getDB();
    await db.runAsync(
      'UPDATE entries SET distance = ?, category = ?, date = ?, notes = ? WHERE id = ?',
      entry.distance,
      entry.category,
      entry.date,
      entry.notes || '',
      entry.id
    );
  } catch (error) {
    console.error('Error updating entry:', error);
    throw error;
  }
};

export const deleteEntry = async (id: number): Promise<void> => {
  try {
    const db = getDB();
    await db.runAsync('DELETE FROM entries WHERE id = ?', id);
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
};

export const deleteAllEntries = async (): Promise<void> => {
  try {
    const db = getDB();
    await db.runAsync('DELETE FROM entries');
  } catch (error) {
    console.error('Error clearing entries:', error);
    throw error;
  }
};

export const fetchSettings = async (): Promise<AppSettings> => {
  try {
    const db = getDB();
    const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }

    return {
      monthlyGoalKm: map.monthlyGoalKm ? parseFloat(map.monthlyGoalKm) : 100,
      unit: (map.unit as 'km' | 'mi') || 'km',
      hapticsEnabled: map.hapticsEnabled !== 'false',
    };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {
      monthlyGoalKm: 100,
      unit: 'km',
      hapticsEnabled: true,
    };
  }
};

export const saveSettings = async (settings: Partial<AppSettings>): Promise<void> => {
  try {
    const db = getDB();
    if (settings.monthlyGoalKm !== undefined) {
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        'monthlyGoalKm',
        String(settings.monthlyGoalKm)
      );
    }
    if (settings.unit !== undefined) {
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        'unit',
        settings.unit
      );
    }
    if (settings.hapticsEnabled !== undefined) {
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        'hapticsEnabled',
        String(settings.hapticsEnabled)
      );
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
};

export const computeKPIStats = (entries: Entry[]): KPIStats => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonthPrefix = `${currentYear}-${currentMonth}`;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  let totalKm = 0;
  let monthKm = 0;
  let weekKm = 0;
  let longestTrip = 0;

  // Streak calculation: unique dates with entries
  const dateSet = new Set<string>();

  for (const entry of entries) {
    const dist = Number(entry.distance) || 0;
    totalKm += dist;

    if (dist > longestTrip) {
      longestTrip = dist;
    }

    if (entry.date.startsWith(currentMonthPrefix)) {
      monthKm += dist;
    }

    const [y, m, d] = entry.date.split('-').map(Number);
    const entryDate = new Date(y, m - 1, d);
    if (entryDate >= sevenDaysAgo) {
      weekKm += dist;
    }

    dateSet.add(entry.date);
  }

  // Calculate consecutive day streak
  let streakDays = 0;
  const checkDate = new Date(now);
  checkDate.setHours(0, 0, 0, 0);

  // Check if today has an entry, if not check if yesterday has an entry to keep streak alive
  const formatIsoDate = (d: Date) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  };

  const todayStr = formatIsoDate(checkDate);
  const yesterdayDate = new Date(checkDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = formatIsoDate(yesterdayDate);

  let activeCheck = new Date(checkDate);
  if (!dateSet.has(todayStr) && dateSet.has(yesterdayStr)) {
    activeCheck = yesterdayDate;
  }

  while (dateSet.has(formatIsoDate(activeCheck))) {
    streakDays++;
    activeCheck.setDate(activeCheck.getDate() - 1);
  }

  const totalTrips = entries.length;
  const averageTrip = totalTrips > 0 ? totalKm / totalTrips : 0;

  return {
    totalKm: Math.round(totalKm * 10) / 10,
    monthKm: Math.round(monthKm * 10) / 10,
    weekKm: Math.round(weekKm * 10) / 10,
    streakDays,
    totalTrips,
    longestTrip: Math.round(longestTrip * 10) / 10,
    averageTrip: Math.round(averageTrip * 10) / 10,
  };
};

export const computeCategoryStats = (entries: Entry[]): CategoryStat[] => {
  const totals: Record<string, { totalKm: number; count: number }> = {};
  let totalKmAll = 0;

  for (const entry of entries) {
    const dist = Number(entry.distance) || 0;
    totalKmAll += dist;
    if (!totals[entry.category]) {
      totals[entry.category] = { totalKm: 0, count: 0 };
    }
    totals[entry.category].totalKm += dist;
    totals[entry.category].count += 1;
  }

  const categories = ['Driving', 'Running', 'Walking', 'Cycling', 'Other'] as const;

  return categories.map((cat) => {
    const item = totals[cat] || { totalKm: 0, count: 0 };
    const percentage = totalKmAll > 0 ? (item.totalKm / totalKmAll) * 100 : 0;
    return {
      category: cat,
      totalKm: Math.round(item.totalKm * 10) / 10,
      percentage: Math.round(percentage),
      count: item.count,
      color: Colors.category[cat]?.primary || Colors.accentPrimary,
    };
  });
};

export const computeChartData = (entries: Entry[], timeframe: Timeframe): ChartDataPoint[] => {
  const now = new Date();

  if (timeframe === 'week') {
    // Last 7 days
    const result: ChartDataPoint[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const dy = String(d.getDate()).padStart(2, '0');
      const iso = `${yr}-${mo}-${dy}`;

      const totalForDay = entries
        .filter((e) => e.date === iso)
        .reduce((sum, e) => sum + (Number(e.distance) || 0), 0);

      result.push({
        label: dayNames[d.getDay()],
        date: iso,
        value: Math.round(totalForDay * 10) / 10,
      });
    }
    return result;
  }

  if (timeframe === 'month') {
    // 4 weeks of current month
    const result: ChartDataPoint[] = [];
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    for (let w = 1; w <= 4; w++) {
      const startDay = (w - 1) * 7 + 1;
      const endDay = w === 4 ? 31 : w * 7;

      const totalForWeek = entries
        .filter((e) => {
          const [yr, mo, dy] = e.date.split('-').map(Number);
          return yr === currentYear && mo === currentMonth + 1 && dy >= startDay && dy <= endDay;
        })
        .reduce((sum, e) => sum + (Number(e.distance) || 0), 0);

      result.push({
        label: `W${w}`,
        value: Math.round(totalForWeek * 10) / 10,
      });
    }
    return result;
  }

  // Yearly (last 6 months or 12 months)
  const result: ChartDataPoint[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yr = d.getFullYear();
    const mo = d.getMonth() + 1;
    const moPrefix = `${yr}-${String(mo).padStart(2, '0')}`;

    const totalForMonth = entries
      .filter((e) => e.date.startsWith(moPrefix))
      .reduce((sum, e) => sum + (Number(e.distance) || 0), 0);

    result.push({
      label: monthNames[d.getMonth()],
      value: Math.round(totalForMonth * 10) / 10,
    });
  }
  return result;
};
