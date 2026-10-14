import { NewEntry } from '../types';
import { insertEntry } from './database';

export const seedSampleEntries = async (): Promise<void> => {
  const now = new Date();

  const getDateOffset = (daysAgo: number): string => {
    const d = new Date(now);
    d.setDate(now.getDate() - daysAgo);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  };

  const sampleData: NewEntry[] = [
    {
      distance: 14.8,
      category: 'Driving',
      date: getDateOffset(0),
      start_time: '08:15:00',
      end_time: '08:42:30',
      duration_seconds: 1650,
      notes: 'Morning highway commute into downtown tech hub',
    },
    {
      distance: 5.2,
      category: 'Running',
      date: getDateOffset(0),
      start_time: '18:10:00',
      end_time: '18:38:15',
      duration_seconds: 1695,
      notes: 'Sunset tempo run along the riverside path',
    },
    {
      distance: 2.4,
      category: 'Walking',
      date: getDateOffset(1),
      start_time: '19:20:00',
      end_time: '19:55:00',
      duration_seconds: 2100,
      notes: 'Evening stroll around the park and coffee shop',
    },
    {
      distance: 22.5,
      category: 'Cycling',
      date: getDateOffset(1),
      start_time: '09:00:00',
      end_time: '09:52:00',
      duration_seconds: 3120,
      notes: 'Weekend coastal trail cycling with cycling club',
    },
    {
      distance: 38.0,
      category: 'Driving',
      date: getDateOffset(2),
      start_time: '13:00:00',
      end_time: '13:48:00',
      duration_seconds: 2880,
      notes: 'Client meeting in North suburb and return',
    },
    {
      distance: 6.8,
      category: 'Running',
      date: getDateOffset(3),
      start_time: '07:15:00',
      end_time: '07:54:00',
      duration_seconds: 2340,
      notes: 'Intervals & 5k sprint workout',
    },
    {
      distance: 18.2,
      category: 'Driving',
      date: getDateOffset(4),
      start_time: '16:30:00',
      end_time: '17:05:00',
      duration_seconds: 2100,
      notes: 'Grocery restocking and city loop',
    },
    {
      distance: 3.1,
      category: 'Walking',
      date: getDateOffset(5),
      start_time: '08:00:00',
      end_time: '08:45:00',
      duration_seconds: 2700,
      notes: 'Morning dog walk & neighborhood loop',
    },
    {
      distance: 15.6,
      category: 'Cycling',
      date: getDateOffset(6),
      start_time: '10:15:00',
      end_time: '11:02:00',
      duration_seconds: 2820,
      notes: 'Hill climb session near botanical gardens',
    },
    {
      distance: 8.5,
      category: 'Running',
      date: getDateOffset(8),
      start_time: '06:45:00',
      end_time: '07:35:00',
      duration_seconds: 3000,
      notes: 'Long recovery run on soft trail surface',
    },
    {
      distance: 45.2,
      category: 'Driving',
      date: getDateOffset(10),
      start_time: '14:00:00',
      end_time: '14:55:00',
      duration_seconds: 3300,
      notes: 'Interstate highway road trip to lake cabin',
    },
    {
      distance: 12.0,
      category: 'Cycling',
      date: getDateOffset(12),
      start_time: '17:30:00',
      end_time: '18:12:00',
      duration_seconds: 2520,
      notes: 'Sunset gravel bike adventure',
    },
  ];

  for (const entry of sampleData) {
    await insertEntry(entry);
  }
};
