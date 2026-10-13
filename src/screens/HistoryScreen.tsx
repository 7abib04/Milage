import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTracker } from '../context/TrackerContext';
import { CategoryType, Entry } from '../types';
import { Colors, getCategoryColor } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { SwipeableEntryCard } from '../components/SwipeableEntryCard';
import { AddEntryModal } from './AddEntryModal';
import { getRelativeDateGroup } from '../utils/formatters';
import { triggerHaptic } from '../utils/haptics';

const CATEGORY_FILTERS: (CategoryType | 'All')[] = [
  'All',
  'Driving',
  'Running',
  'Walking',
  'Cycling',
  'Other',
];

export const HistoryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { entries, settings, editEntry, removeEntry, addEntry } = useTracker();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'All'>('All');
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Category filter
      if (selectedCategory !== 'All' && entry.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCategory = entry.category.toLowerCase().includes(q);
        const matchesNotes = entry.notes?.toLowerCase().includes(q) || false;
        const matchesDate = entry.date.toLowerCase().includes(q);
        const matchesDistance = String(entry.distance).includes(q);
        return matchesCategory || matchesNotes || matchesDate || matchesDistance;
      }

      return true;
    });
  }, [entries, selectedCategory, searchQuery]);

  // Group filtered entries by relative date
  const groupedEntries = useMemo(() => {
    const groups: { [title: string]: Entry[] } = {};

    for (const entry of filteredEntries) {
      const groupName = getRelativeDateGroup(entry.date);
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(entry);
    }

    return groups;
  }, [filteredEntries]);

  const totalFilteredKm = useMemo(() => {
    const sum = filteredEntries.reduce((acc, curr) => acc + (Number(curr.distance) || 0), 0);
    return Math.round(sum * 10) / 10;
  }, [filteredEntries]);

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: 100 },
        ]}
      >
        {/* Screen Title */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.screenEyebrow}>ACTIVITY LOG</Text>
            <Text style={styles.screenTitle}>History</Text>
          </View>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeValue}>
              {totalFilteredKm} {settings.unit}
            </Text>
            <Text style={styles.totalBadgeCount}>
              {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
          <Ionicons name="search-outline" size={18} color={Colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by note, category, distance, or date..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                setSearchQuery('');
              }}
            >
              <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
            </Pressable>
          )}
        </View>

        {/* Category Filter Pills Horizontal Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsContainer}
        >
          {CATEGORY_FILTERS.map((cat) => {
            const isSelected = selectedCategory === cat;
            const colors = cat !== 'All' ? getCategoryColor(cat) : null;

            return (
              <Pressable
                key={cat}
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedCategory(cat);
                }}
                style={[
                  styles.filterPill,
                  isSelected
                    ? {
                        backgroundColor: colors ? colors.glass : 'rgba(0, 242, 254, 0.15)',
                        borderColor: colors ? colors.primary : '#00F2FE',
                      }
                    : styles.filterPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && {
                      color: colors ? colors.primary : '#00F2FE',
                      fontWeight: '800',
                    },
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Entries List Grouped by Date */}
        {Object.keys(groupedEntries).length === 0 ? (
          <GlassCard style={styles.emptyContainer}>
            <Ionicons name="filter-outline" size={38} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No matching logs found</Text>
            <Text style={styles.emptyDescription}>
              Try adjusting your search query or category filter.
            </Text>
          </GlassCard>
        ) : (
          Object.entries(groupedEntries).map(([groupTitle, groupItems]) => (
            <View key={groupTitle} style={styles.groupSection}>
              {/* Group Header */}
              <View style={styles.groupHeaderRow}>
                <Text style={styles.groupHeaderText}>{groupTitle}</Text>
                <Text style={styles.groupSubtext}>
                  {groupItems.reduce((acc, i) => acc + (Number(i.distance) || 0), 0).toFixed(1)}{' '}
                  {settings.unit}
                </Text>
              </View>

              {/* Group Items */}
              {groupItems.map((entry) => (
                <SwipeableEntryCard
                  key={entry.id}
                  entry={entry}
                  unit={settings.unit}
                  onPress={handleEdit}
                  onDelete={removeEntry}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Edit Entry Modal */}
      <AddEntryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={async (data) => {
          if (editingEntry) {
            await editEntry({ ...editingEntry, ...data });
          } else {
            await addEntry(data);
          }
        }}
        editingEntry={editingEntry}
        unit={settings.unit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00F2FE',
    letterSpacing: 0.8,
  },
  screenTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  totalBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  totalBadgeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00F2FE',
  },
  totalBadgeCount: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    overflow: 'hidden',
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  filterPillsContainer: {
    gap: 8,
    paddingBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterPillInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: Colors.glassBorder,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  groupSection: {
    marginBottom: 16,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  groupHeaderText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  groupSubtext: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 36,
    borderRadius: 20,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyDescription: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
