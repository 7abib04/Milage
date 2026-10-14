import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import {
  clearActiveSession,
  computeCategoryStats,
  computeKPIStats,
  deleteAllEntries,
  deleteEntry,
  fetchAllEntries,
  fetchSettings,
  getActiveSessionSync,
  initDatabase,
  insertEntry,
  saveActiveSession,
  saveSettings,
  updateActiveSessionLocation,
  updateEntry,
} from '../db/database';
import { seedSampleEntries } from '../db/seed';
import {
  ActiveTripState,
  AppSettings,
  CategoryStat,
  CategoryType,
  Entry,
  KPIStats,
  NewEntry,
  TripSegment,
} from '../types';
import { getTimeString } from '../utils/geo';
import { getTodayDateString } from '../utils/formatters';
import { triggerHaptic } from '../utils/haptics';
import {
  BACKGROUND_LOCATION_TASK,
  addBackgroundLocationListener,
} from '../tasks/backgroundLocation';

interface TrackerContextType {
  entries: Entry[];
  stats: KPIStats;
  categoryStats: CategoryStat[];
  settings: AppSettings;
  isLoading: boolean;
  activeTrip: ActiveTripState;
  startTrip: (category: CategoryType, notes?: string) => Promise<boolean>;
  pauseTrip: () => void;
  resumeTrip: () => void;
  recordSegment: () => void;
  stopTrip: () => Promise<Entry | null>;
  discardActiveTrip: () => void;
  simulateTripMotion: (kmIncrement?: number) => void;
  addEntry: (entry: NewEntry) => Promise<Entry>;
  editEntry: (entry: Entry) => Promise<void>;
  removeEntry: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  refreshData: () => Promise<void>;
  seedData: () => Promise<void>;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [settings, setSettingsState] = useState<AppSettings>({
    unit: 'km',
    hapticsEnabled: true,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Multi-Segment Trip State
  const [activeTrip, setActiveTrip] = useState<ActiveTripState>({
    isTracking: false,
    isPaused: false,
    category: 'Driving',
    startTime: null,
    elapsedSeconds: 0,
    distanceKm: 0,
    currentSpeedKmh: 0,
    segments: [],
    currentSegmentDistanceKm: 0,
    notes: '',
  });

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Synchronize state with persistent SQLite active session
  const syncFromDBSession = useCallback(() => {
    try {
      const session = getActiveSessionSync();
      if (session && session.is_tracking === 1) {
        let segs: TripSegment[] = [];
        try {
          segs = JSON.parse(session.segments_json || '[]');
        } catch {}

        const nowSec = Math.max(
          session.elapsed_seconds,
          Math.floor((Date.now() - session.start_time_ms) / 1000)
        );

        setActiveTrip({
          isTracking: true,
          isPaused: session.is_paused === 1,
          category: session.category as CategoryType,
          startTime: session.start_time_ms,
          elapsedSeconds: nowSec,
          distanceKm: session.distance_km,
          currentSpeedKmh: session.current_speed_kmh,
          segments: segs,
          currentSegmentDistanceKm: session.distance_km - (segs.reduce((a, b) => a + b.distanceKm, 0)),
          notes: session.notes || '',
        });
      }
    } catch (e) {
      console.warn('Error syncing session from DB:', e);
    }
  }, []);

  const reload = useCallback(async () => {
    try {
      const [allEntries, loadedSettings] = await Promise.all([
        fetchAllEntries(),
        fetchSettings(),
      ]);
      setEntries(allEntries);
      setSettingsState(loadedSettings);
      syncFromDBSession();
    } catch (error) {
      console.error('Error reloading tracker data:', error);
    }
  }, [syncFromDBSession]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await initDatabase();
        if (isMounted) {
          await reload();
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Tracker initialization failed:', err);
        if (isMounted) setIsLoading(false);
      }
    })();

    // Listen to background location updates while in foreground
    const removeLocationListener = addBackgroundLocationListener((event) => {
      setActiveTrip((prev) => {
        if (!prev.isTracking || prev.isPaused) return prev;
        const newDist = Math.round((prev.distanceKm + event.deltaKm) * 1000) / 1000;
        const newSegDist = Math.round((prev.currentSegmentDistanceKm + event.deltaKm) * 1000) / 1000;
        return {
          ...prev,
          distanceKm: newDist,
          currentSegmentDistanceKm: newSegDist,
          currentSpeedKmh: event.speedKmh,
        };
      });
    });

    // App state listener: when coming back to foreground from locked screen
    const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        syncFromDBSession();
      }
    });

    return () => {
      isMounted = false;
      removeLocationListener();
      appStateSub.remove();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [reload, syncFromDBSession]);

  const stats = useMemo(() => computeKPIStats(entries), [entries]);
  const categoryStats = useMemo(() => computeCategoryStats(entries), [entries]);

  const addEntry = useCallback(
    async (entryData: NewEntry): Promise<Entry> => {
      const created = await insertEntry(entryData);
      const nextEntries = [created, ...entries].sort(
        (a, b) => b.date.localeCompare(a.date) || b.id - a.id
      );
      setEntries(nextEntries);
      if (settings.hapticsEnabled) {
        triggerHaptic('medium');
      }
      return created;
    },
    [entries, settings.hapticsEnabled]
  );

  // START CONTINUOUS BACKGROUND & FOREGROUND TRIP
  const startTrip = useCallback(
    async (category: CategoryType, notes?: string): Promise<boolean> => {
      try {
        // Request foreground permissions
        const fgStatus = await Location.requestForegroundPermissionsAsync();
        if (fgStatus.status !== 'granted') {
          console.warn('Foreground location permission not granted.');
        }

        // Request background permissions (required for screen off / minimized tracking)
        try {
          const bgStatus = await Location.requestBackgroundPermissionsAsync();
          if (bgStatus.status !== 'granted') {
            console.warn('Background location permission not granted; background tracking may be limited by OS.');
          }
        } catch (bgErr) {
          console.warn('Background permission request warning:', bgErr);
        }

        if (settings.hapticsEnabled) {
          triggerHaptic('medium');
        }

        const now = Date.now();
        const startStr = getTimeString(new Date(now));

        // Save active session to SQLite so background task can access it immediately
        await saveActiveSession({
          is_tracking: 1,
          is_paused: 0,
          category,
          start_time_ms: now,
          start_time_str: startStr,
          elapsed_seconds: 0,
          distance_km: 0,
          last_lat: null,
          last_lon: null,
          current_speed_kmh: 0,
          segments_json: '[]',
          notes: notes || '',
        });

        setActiveTrip({
          isTracking: true,
          isPaused: false,
          category,
          startTime: now,
          elapsedSeconds: 0,
          distanceKm: 0,
          currentSpeedKmh: 0,
          segments: [],
          currentSegmentDistanceKm: 0,
          notes: notes || '',
        });

        // Foreground UI seconds ticker
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        timerIntervalRef.current = setInterval(() => {
          setActiveTrip((prev) => {
            if (!prev.isTracking || prev.isPaused) return prev;
            return {
              ...prev,
              elapsedSeconds: prev.elapsedSeconds + 1,
            };
          });
        }, 1000);

        // Start background location updates with TaskManager
        try {
          const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
          if (hasStarted) {
            await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
          }

          await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,
            distanceInterval: 2, // meters
            showsBackgroundLocationIndicator: true, // blue status bar on iOS
            pausesUpdatesAutomatically: false,
            foregroundService: {
              notificationTitle: 'KM Tracker Active Trip',
              notificationBody: `Recording ${category.toLowerCase()} journey distance...`,
              notificationColor: '#00F2FE',
            },
          });
        } catch (startLocErr) {
          console.warn('Could not launch background location task:', startLocErr);
        }

        return true;
      } catch (error) {
        console.error('Failed to start trip:', error);
        return false;
      }
    },
    [settings.hapticsEnabled]
  );

  // PAUSE TRIP (Keeps session alive in background without accumulating distance)
  const pauseTrip = useCallback(() => {
    setActiveTrip((prev) => ({
      ...prev,
      isPaused: true,
      currentSpeedKmh: 0,
    }));

    const session = getActiveSessionSync();
    if (session) {
      saveActiveSession({
        ...session,
        is_paused: 1,
        current_speed_kmh: 0,
      });
    }

    if (settings.hapticsEnabled) {
      triggerHaptic('light');
    }
  }, [settings.hapticsEnabled]);

  // RESUME TRIP
  const resumeTrip = useCallback(() => {
    setActiveTrip((prev) => ({
      ...prev,
      isPaused: false,
    }));

    const session = getActiveSessionSync();
    if (session) {
      saveActiveSession({
        ...session,
        is_paused: 0,
        last_lat: null,
        last_lon: null,
      });
    }

    if (settings.hapticsEnabled) {
      triggerHaptic('medium');
    }
  }, [settings.hapticsEnabled]);

  // RECORD SEGMENT (User ends a leg, cumulative session keeps going!)
  const recordSegment = useCallback(() => {
    setActiveTrip((prev) => {
      const segmentIndex = prev.segments.length + 1;
      const newSegment: TripSegment = {
        id: segmentIndex,
        distanceKm: Math.round(prev.currentSegmentDistanceKm * 100) / 100,
        durationSeconds: prev.elapsedSeconds,
        completedAt: getTimeString(),
      };
      const updatedSegments = [...prev.segments, newSegment];

      const session = getActiveSessionSync();
      if (session) {
        saveActiveSession({
          ...session,
          segments_json: JSON.stringify(updatedSegments),
        });
      }

      return {
        ...prev,
        segments: updatedSegments,
        currentSegmentDistanceKm: 0,
      };
    });

    if (settings.hapticsEnabled) {
      triggerHaptic('success');
    }
  }, [settings.hapticsEnabled]);

  // SIMULATE MOTION (For emulator testing)
  const simulateTripMotion = useCallback(
    (kmIncrement = 0.15) => {
      setActiveTrip((prev) => {
        if (!prev.isTracking) return prev;
        const nextDist = Math.round((prev.distanceKm + kmIncrement) * 100) / 100;
        const nextSegDist = Math.round((prev.currentSegmentDistanceKm + kmIncrement) * 100) / 100;
        const speed = Math.round((28 + Math.random() * 8) * 10) / 10;

        const session = getActiveSessionSync();
        if (session) {
          updateActiveSessionLocation(
            session.last_lat || 37.7749,
            session.last_lon || -122.4194,
            speed,
            kmIncrement,
            prev.elapsedSeconds
          );
        }

        return {
          ...prev,
          distanceKm: nextDist,
          currentSegmentDistanceKm: nextSegDist,
          currentSpeedKmh: speed,
        };
      });

      if (settings.hapticsEnabled) {
        triggerHaptic('light');
      }
    },
    [settings.hapticsEnabled]
  );

  // STOP & FINALIZE FULL TRIP (Explicitly finalizes session and writes to SQLite)
  const stopTrip = useCallback(async (): Promise<Entry | null> => {
    if (!activeTrip.isTracking) return null;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Stop background location updates
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }
    } catch (e) {
      console.warn('Error stopping background location task:', e);
    }

    // Read latest session snapshot from DB to guarantee background sync
    const dbSession = getActiveSessionSync();
    const finalDistance = Math.round(
      Math.max(activeTrip.distanceKm, dbSession?.distance_km || 0) * 10
    ) / 10;
    const finalDuration = Math.max(activeTrip.elapsedSeconds, dbSession?.elapsed_seconds || 0);
    const finalSegmentsCount = Math.max(
      1,
      activeTrip.segments.length + (activeTrip.currentSegmentDistanceKm > 0.05 ? 1 : 0)
    );

    const entryToSave: NewEntry = {
      distance: finalDistance > 0 ? finalDistance : 0.1,
      category: activeTrip.category,
      date: getTodayDateString(),
      start_time: dbSession?.start_time_str || getTimeString(),
      end_time: getTimeString(),
      duration_seconds: finalDuration,
      segments_count: finalSegmentsCount,
      notes: activeTrip.notes || `Completed ${activeTrip.category.toLowerCase()} session (${finalSegmentsCount} leg${finalSegmentsCount > 1 ? 's' : ''})`,
    };

    // Clear active session from SQLite
    await clearActiveSession();

    setActiveTrip({
      isTracking: false,
      isPaused: false,
      category: 'Driving',
      startTime: null,
      elapsedSeconds: 0,
      distanceKm: 0,
      currentSpeedKmh: 0,
      segments: [],
      currentSegmentDistanceKm: 0,
      notes: '',
    });

    const saved = await addEntry(entryToSave);
    if (settings.hapticsEnabled) {
      triggerHaptic('success');
    }
    return saved;
  }, [activeTrip, addEntry, settings.hapticsEnabled]);

  const discardActiveTrip = useCallback(async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }
    } catch {}

    await clearActiveSession();

    setActiveTrip({
      isTracking: false,
      isPaused: false,
      category: 'Driving',
      startTime: null,
      elapsedSeconds: 0,
      distanceKm: 0,
      currentSpeedKmh: 0,
      segments: [],
      currentSegmentDistanceKm: 0,
      notes: '',
    });

    if (settings.hapticsEnabled) {
      triggerHaptic('error');
    }
  }, [settings.hapticsEnabled]);

  const editEntry = useCallback(
    async (updated: Entry): Promise<void> => {
      await updateEntry(updated);
      setEntries((prev) =>
        prev
          .map((item) => (item.id === updated.id ? updated : item))
          .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
      );
      if (settings.hapticsEnabled) {
        triggerHaptic('light');
      }
    },
    [settings.hapticsEnabled]
  );

  const removeEntry = useCallback(
    async (id: number): Promise<void> => {
      await deleteEntry(id);
      setEntries((prev) => prev.filter((item) => item.id !== id));
      if (settings.hapticsEnabled) {
        triggerHaptic('heavy');
      }
    },
    [settings.hapticsEnabled]
  );

  const clearAll = useCallback(async (): Promise<void> => {
    await deleteAllEntries();
    setEntries([]);
    if (settings.hapticsEnabled) {
      triggerHaptic('error');
    }
  }, [settings.hapticsEnabled]);

  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>): Promise<void> => {
      await saveSettings(newSettings);
      setSettingsState((prev) => ({ ...prev, ...newSettings }));
      if (settings.hapticsEnabled) {
        triggerHaptic('selection');
      }
    },
    [settings.hapticsEnabled]
  );

  const seedData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    await seedSampleEntries();
    await reload();
    setIsLoading(false);
    if (settings.hapticsEnabled) {
      triggerHaptic('success');
    }
  }, [reload, settings.hapticsEnabled]);

  const value = useMemo(
    () => ({
      entries,
      stats,
      categoryStats,
      settings,
      isLoading,
      activeTrip,
      startTrip,
      pauseTrip,
      resumeTrip,
      recordSegment,
      stopTrip,
      discardActiveTrip,
      simulateTripMotion,
      addEntry,
      editEntry,
      removeEntry,
      clearAll,
      updateSettings,
      refreshData: reload,
      seedData,
    }),
    [
      entries,
      stats,
      categoryStats,
      settings,
      isLoading,
      activeTrip,
      startTrip,
      pauseTrip,
      resumeTrip,
      recordSegment,
      stopTrip,
      discardActiveTrip,
      simulateTripMotion,
      addEntry,
      editEntry,
      removeEntry,
      clearAll,
      updateSettings,
      reload,
      seedData,
    ]
  );

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
};

export const useTracker = (): TrackerContextType => {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error('useTracker must be used within a TrackerProvider');
  }
  return context;
};
