import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Alert,
  Switch,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTracker } from '../context/TrackerContext';
import { Colors } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { exportEntriesToCSV, exportEntriesToJSON } from '../utils/export';
import { triggerHaptic } from '../utils/haptics';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    entries,
    settings,
    updateSettings,
    clearAll,
    seedData,
  } = useTracker();

  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExportJSON = async () => {
    if (entries.length === 0) {
      Alert.alert('No Data', 'You currently have no entries to export.');
      return;
    }
    try {
      setIsExporting(true);
      triggerHaptic('medium');
      await exportEntriesToJSON(entries);
      setIsExporting(false);
    } catch {
      setIsExporting(false);
      Alert.alert('Export Failed', 'An error occurred while creating the JSON file.');
    }
  };

  const handleExportCSV = async () => {
    if (entries.length === 0) {
      Alert.alert('No Data', 'You currently have no entries to export.');
      return;
    }
    try {
      setIsExporting(true);
      triggerHaptic('medium');
      await exportEntriesToCSV(entries);
      setIsExporting(false);
    } catch {
      setIsExporting(false);
      Alert.alert('Export Failed', 'An error occurred while creating the CSV file.');
    }
  };

  const handleConfirmClear = () => {
    triggerHaptic('warning');
    Alert.alert(
      'Wipe All Data?',
      'Are you sure you want to permanently delete all recorded entries? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await clearAll();
            Alert.alert('Database Cleared', 'All entries have been permanently removed.');
          },
        },
      ]
    );
  };

  const adjustGoal = async (delta: number) => {
    triggerHaptic('light');
    const newGoal = Math.max(10, settings.monthlyGoalKm + delta);
    await updateSettings({ monthlyGoalKm: newGoal });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: 110 },
        ]}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.screenEyebrow}>PREFERENCES & DATA</Text>
            <Text style={styles.screenTitle}>Settings</Text>
          </View>
        </View>

        {/* Goal Setting Section */}
        <GlassCard style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(0, 242, 254, 0.15)' }]}>
              <Ionicons name="flag-outline" size={20} color="#00F2FE" />
            </View>
            <View style={styles.cardHeaderTextWrap}>
              <Text style={styles.cardTitle}>Monthly Distance Goal</Text>
              <Text style={styles.cardSubtitle}>Drives the dashboard progress ring</Text>
            </View>
          </View>

          <View style={styles.goalControlRow}>
            <Pressable
              onPress={() => adjustGoal(-10)}
              style={styles.stepperBtn}
            >
              <Ionicons name="remove" size={20} color={Colors.textPrimary} />
            </Pressable>

            <View style={styles.goalValueDisplay}>
              <Text style={styles.goalValueText}>
                {settings.monthlyGoalKm}
                <Text style={styles.goalUnitText}> {settings.unit}</Text>
              </Text>
            </View>

            <Pressable
              onPress={() => adjustGoal(10)}
              style={styles.stepperBtn}
            >
              <Ionicons name="add" size={20} color={Colors.textPrimary} />
            </Pressable>
          </View>
        </GlassCard>

        {/* Units & Preferences */}
        <GlassCard style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Ionicons name="options-outline" size={20} color="#A855F7" />
            </View>
            <View style={styles.cardHeaderTextWrap}>
              <Text style={styles.cardTitle}>General Preferences</Text>
              <Text style={styles.cardSubtitle}>App display and tactile feedback</Text>
            </View>
          </View>

          {/* Unit Toggle */}
          <View style={styles.preferenceRow}>
            <View>
              <Text style={styles.prefTitle}>Distance Unit</Text>
              <Text style={styles.prefSubtitle}>Kilometers (km) or Miles (mi)</Text>
            </View>

            <View style={styles.unitSelector}>
              {(['km', 'mi'] as const).map((u) => {
                const isActive = settings.unit === u;
                return (
                  <Pressable
                    key={u}
                    onPress={() => updateSettings({ unit: u })}
                    style={[
                      styles.unitBtn,
                      isActive && styles.unitBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.unitBtnText,
                        isActive && styles.unitBtnTextActive,
                      ]}
                    >
                      {u.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Haptics Switch */}
          <View style={styles.preferenceRow}>
            <View>
              <Text style={styles.prefTitle}>Haptic Feedback</Text>
              <Text style={styles.prefSubtitle}>Tactile response on button taps & actions</Text>
            </View>

            <Switch
              value={settings.hapticsEnabled}
              onValueChange={(val) => updateSettings({ hapticsEnabled: val })}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#00F2FE' }}
              thumbColor={settings.hapticsEnabled ? '#0A0D14' : '#fff'}
            />
          </View>
        </GlassCard>

        {/* Data Export & Management */}
        <GlassCard style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="cloud-upload-outline" size={20} color="#10B981" />
            </View>
            <View style={styles.cardHeaderTextWrap}>
              <Text style={styles.cardTitle}>Data Export & Backup</Text>
              <Text style={styles.cardSubtitle}>Export your records anytime</Text>
            </View>
          </View>

          <View style={styles.buttonStack}>
            <GlassButton
              label={isExporting ? 'Exporting...' : 'Export as JSON'}
              onPress={handleExportJSON}
              variant="secondary"
              icon={<Ionicons name="code-download-outline" size={18} color="#fff" />}
              disabled={isExporting}
            />

            <GlassButton
              label={isExporting ? 'Exporting...' : 'Export as CSV (Spreadsheet)'}
              onPress={handleExportCSV}
              variant="secondary"
              icon={<Ionicons name="document-text-outline" size={18} color="#fff" />}
              disabled={isExporting}
            />

            <GlassButton
              label="Populate Demo Activity Data"
              onPress={seedData}
              variant="primary"
              icon={<Ionicons name="sparkles-outline" size={18} color="#00F2FE" />}
            />
          </View>
        </GlassCard>

        {/* Danger Zone: Wipe Data */}
        <GlassCard style={styles.dangerCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: Colors.dangerGlass }]}>
              <Ionicons name="alert-circle-outline" size={20} color={Colors.danger} />
            </View>
            <View style={styles.cardHeaderTextWrap}>
              <Text style={[styles.cardTitle, { color: Colors.danger }]}>Danger Zone</Text>
              <Text style={styles.cardSubtitle}>Irreversible database reset</Text>
            </View>
          </View>

          <Text style={styles.dangerWarning}>
            Deleting all entries will clear your local SQLite database permanently. Export a backup
            first if needed.
          </Text>

          <GlassButton
            label="Wipe All Activity Data"
            onPress={handleConfirmClear}
            variant="danger"
            icon={<Ionicons name="trash-outline" size={18} color={Colors.danger} />}
          />
        </GlassCard>

        {/* Privacy & App Info */}
        <View style={styles.footerWrap}>
          <View style={styles.privacyBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#10B981" />
            <Text style={styles.privacyText}>100% Offline-First SQLite Storage</Text>
          </View>
          <Text style={styles.versionText}>KM Tracker for iOS • Version 1.0.0 (Build 1)</Text>
        </View>
      </ScrollView>
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
    marginBottom: 18,
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
  sectionCard: {
    marginBottom: 16,
    borderRadius: 24,
  },
  dangerCard: {
    marginBottom: 24,
    borderRadius: 24,
    borderColor: Colors.dangerBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  goalControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: 8,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalValueDisplay: {
    alignItems: 'center',
  },
  goalValueText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#00F2FE',
  },
  goalUnitText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  prefTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  prefSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 3,
  },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
  },
  unitBtnActive: {
    backgroundColor: '#00F2FE',
  },
  unitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  unitBtnTextActive: {
    color: '#07090E',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 12,
  },
  buttonStack: {
    gap: 10,
  },
  dangerWarning: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  footerWrap: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 8,
  },
  privacyText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  versionText: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '500',
  },
});
