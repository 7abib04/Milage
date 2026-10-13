import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Entry } from '../types';

export const exportEntriesToJSON = async (entries: Entry[]): Promise<boolean> => {
  try {
    const jsonString = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        totalEntries: entries.length,
        version: '1.0',
        entries,
      },
      null,
      2
    );

    const fileName = `km_tracker_export_${Date.now()}.json`;
    const exportFile = new File(Paths.cache, fileName);
    if (!exportFile.exists) {
      exportFile.create();
    }
    exportFile.write(jsonString);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(exportFile.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Export KM Tracker Data (JSON)',
        UTI: 'public.json',
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to export JSON:', error);
    throw error;
  }
};

export const exportEntriesToCSV = async (entries: Entry[]): Promise<boolean> => {
  try {
    const header = ['ID', 'Distance (KM)', 'Category', 'Date', 'Notes', 'Created At'];
    const rows = entries.map((entry) => [
      entry.id,
      entry.distance,
      `"${entry.category}"`,
      `"${entry.date}"`,
      `"${(entry.notes || '').replace(/"/g, '""')}"`,
      `"${entry.created_at || ''}"`,
    ]);

    const csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const fileName = `km_tracker_export_${Date.now()}.csv`;
    const exportFile = new File(Paths.cache, fileName);
    if (!exportFile.exists) {
      exportFile.create();
    }
    exportFile.write(csvContent);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(exportFile.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export KM Tracker Data (CSV)',
        UTI: 'public.comma-separated-values-text',
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to export CSV:', error);
    throw error;
  }
};
