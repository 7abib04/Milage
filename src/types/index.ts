export type CategoryType = 'Driving' | 'Running' | 'Walking' | 'Cycling' | 'Other';

export interface Entry {
  id: number;
  distance: number;
  category: CategoryType;
  date: string; // ISO YYYY-MM-DD
  notes?: string;
  created_at?: string;
}

export type NewEntry = Omit<Entry, 'id' | 'created_at'>;

export interface KPIStats {
  totalKm: number;
  monthKm: number;
  weekKm: number;
  streakDays: number;
  totalTrips: number;
  longestTrip: number;
  averageTrip: number;
}

export type Timeframe = 'week' | 'month' | 'year';

export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
  secondaryValue?: number;
}

export interface CategoryStat {
  category: CategoryType;
  totalKm: number;
  percentage: number;
  count: number;
  color: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetKm: number;
  icon: string;
  isUnlocked: boolean;
  progress: number; // 0 to 1
}

export interface AppSettings {
  monthlyGoalKm: number;
  unit: 'km' | 'mi';
  hapticsEnabled: boolean;
}
