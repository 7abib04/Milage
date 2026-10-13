import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  computeCategoryStats,
  computeKPIStats,
  deleteAllEntries,
  deleteEntry,
  fetchAllEntries,
  fetchSettings,
  initDatabase,
  insertEntry,
  saveSettings,
  updateEntry,
} from '../db/database';
import { seedSampleEntries } from '../db/seed';
import { AppSettings, CategoryStat, Entry, KPIStats, Milestone, NewEntry } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface TrackerContextType {
  entries: Entry[];
  stats: KPIStats;
  categoryStats: CategoryStat[];
  settings: AppSettings;
  milestones: Milestone[];
  isLoading: boolean;
  celebrationMilestone: Milestone | null;
  addEntry: (entry: NewEntry) => Promise<Entry>;
  editEntry: (entry: Entry) => Promise<void>;
  removeEntry: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  refreshData: () => Promise<void>;
  seedData: () => Promise<void>;
  dismissCelebration: () => void;
  triggerCelebration: (milestone: Milestone) => void;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

const MILESTONE_DEFINITIONS: Omit<Milestone, 'isUnlocked' | 'progress'>[] = [
  {
    id: 'm1',
    title: 'First Step',
    description: 'Logged your first 10 Kilometers of active movement!',
    targetKm: 10,
    icon: 'compass',
  },
  {
    id: 'm2',
    title: 'Silver Cruiser',
    description: 'Surpassed 50 Kilometers in total recorded distance.',
    targetKm: 50,
    icon: 'zap',
  },
  {
    id: 'm3',
    title: 'Centurion Club',
    description: 'Hit the 100 Kilometers milestone. Truly unstoppable!',
    targetKm: 100,
    icon: 'award',
  },
  {
    id: 'm4',
    title: 'Endurance Pro',
    description: 'Pushed past 250 Kilometers of journeys and workouts.',
    targetKm: 250,
    icon: 'shield',
  },
  {
    id: 'm5',
    title: 'Globe Trotter',
    description: '500 Kilometers logged! Pure masterclass in consistency.',
    targetKm: 500,
    icon: 'globe',
  },
  {
    id: 'm6',
    title: 'Titan of Transit',
    description: 'Reached 1,000 Kilometers! Legendary status achieved.',
    targetKm: 1000,
    icon: 'crown',
  },
];

export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [settings, setSettingsState] = useState<AppSettings>({
    monthlyGoalKm: 100,
    unit: 'km',
    hapticsEnabled: true,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [celebrationMilestone, setCelebrationMilestone] = useState<Milestone | null>(null);

  const reload = useCallback(async () => {
    try {
      const [allEntries, loadedSettings] = await Promise.all([
        fetchAllEntries(),
        fetchSettings(),
      ]);
      setEntries(allEntries);
      setSettingsState(loadedSettings);
    } catch (error) {
      console.error('Error reloading tracker data:', error);
    }
  }, []);

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
    return () => {
      isMounted = false;
    };
  }, [reload]);

  const stats = useMemo(() => computeKPIStats(entries), [entries]);
  const categoryStats = useMemo(() => computeCategoryStats(entries), [entries]);

  const milestones: Milestone[] = useMemo(() => {
    return MILESTONE_DEFINITIONS.map((def) => {
      const isUnlocked = stats.totalKm >= def.targetKm;
      const progress = Math.min(1, Math.max(0, stats.totalKm / def.targetKm));
      return {
        ...def,
        isUnlocked,
        progress,
      };
    });
  }, [stats.totalKm]);

  const checkMilestoneCelebration = useCallback(
    (prevKm: number, newKm: number) => {
      for (const def of MILESTONE_DEFINITIONS) {
        if (prevKm < def.targetKm && newKm >= def.targetKm) {
          const unlockedMilestone: Milestone = {
            ...def,
            isUnlocked: true,
            progress: 1,
          };
          setCelebrationMilestone(unlockedMilestone);
          if (settings.hapticsEnabled) {
            triggerHaptic('success');
          }
          break;
        }
      }
    },
    [settings.hapticsEnabled]
  );

  const addEntry = useCallback(
    async (entryData: NewEntry): Promise<Entry> => {
      const prevTotal = stats.totalKm;
      const created = await insertEntry(entryData);
      const nextEntries = [created, ...entries].sort(
        (a, b) => b.date.localeCompare(a.date) || b.id - a.id
      );
      setEntries(nextEntries);
      const newTotal = prevTotal + (Number(created.distance) || 0);

      checkMilestoneCelebration(prevTotal, newTotal);
      if (settings.hapticsEnabled) {
        triggerHaptic('medium');
      }
      return created;
    },
    [entries, stats.totalKm, checkMilestoneCelebration, settings.hapticsEnabled]
  );

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

  const dismissCelebration = useCallback(() => {
    setCelebrationMilestone(null);
  }, []);

  const triggerCelebration = useCallback((milestone: Milestone) => {
    setCelebrationMilestone(milestone);
  }, []);

  const value = useMemo(
    () => ({
      entries,
      stats,
      categoryStats,
      settings,
      milestones,
      isLoading,
      celebrationMilestone,
      addEntry,
      editEntry,
      removeEntry,
      clearAll,
      updateSettings,
      refreshData: reload,
      seedData,
      dismissCelebration,
      triggerCelebration,
    }),
    [
      entries,
      stats,
      categoryStats,
      settings,
      milestones,
      isLoading,
      celebrationMilestone,
      addEntry,
      editEntry,
      removeEntry,
      clearAll,
      updateSettings,
      reload,
      seedData,
      dismissCelebration,
      triggerCelebration,
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
