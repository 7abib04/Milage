export type CategoryType = 'Driving' | 'Running' | 'Walking' | 'Cycling' | 'Other';

export interface TripSegment {
  id: number;
  distanceKm: number;
  durationSeconds: number;
  completedAt: string;
}

export interface Entry {
  id: number;
  distance: number;
  category: CategoryType;
  date: string; // ISO YYYY-MM-DD
  notes?: string;
  start_time?: string; // e.g. "09:30:15"
  end_time?: string;   // e.g. "10:15:42"
  duration_seconds?: number;
  segments_count?: number;
  created_at?: string;
}

export type NewEntry = Omit<Entry, 'id' | 'created_at'>;

export interface ActiveTripState {
  isTracking: boolean;
  isPaused: boolean;
  category: CategoryType;
  startTime: number | null;
  elapsedSeconds: number;
  distanceKm: number;
  currentSpeedKmh: number;
  segments: TripSegment[];
  currentSegmentDistanceKm: number;
  notes?: string;
}

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

export interface AppSettings {
  unit: 'km' | 'mi';
  hapticsEnabled: boolean;
}
