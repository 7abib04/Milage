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
      notes: 'Morning highway commute into downtown tech hub',
    },
    {
      distance: 5.2,
      category: 'Running',
      date: getDateOffset(0),
      notes: 'Sunset tempo run along the riverside path',
    },
    {
      distance: 2.4,
      category: 'Walking',
      date: getDateOffset(1),
      notes: 'Evening stroll around the park and coffee shop',
    },
    {
      distance: 22.5,
      category: 'Cycling',
      date: getDateOffset(1),
      notes: 'Weekend coastal trail cycling with cycling club',
    },
    {
      distance: 38.0,
      category: 'Driving',
      date: getDateOffset(2),
      notes: 'Client meeting in North suburb and return',
    },
    {
      distance: 6.8,
      category: 'Running',
      date: getDateOffset(3),
      notes: 'Interval intervals & 5k sprint workout',
    },
    {
      distance: 18.2,
      category: 'Driving',
      date: getDateOffset(4),
      notes: 'Grocery restocking and city loop',
    },
    {
      distance: 3.1,
      category: 'Walking',
      date: getDateOffset(5),
      notes: 'Morning dog walk & neighborhood loop',
    },
    {
      distance: 15.6,
      category: 'Cycling',
      date: getDateOffset(6),
      notes: 'Hill climb session near botanical gardens',
    },
    {
      distance: 8.5,
      category: 'Running',
      date: getDateOffset(8),
      notes: 'Long recovery run on soft trail surface',
    },
    {
      distance: 45.2,
      category: 'Driving',
      date: getDateOffset(10),
      notes: 'Interstate highway road trip to lake cabin',
    },
    {
      distance: 12.0,
      category: 'Cycling',
      date: getDateOffset(12),
      notes: 'Sunset gravel bike adventure',
    },
  ];

  for (const entry of sampleData) {
    await insertEntry(entry);
  }
};
