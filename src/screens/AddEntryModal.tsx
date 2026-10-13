import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { CategoryType, Entry } from '../types';
import { Colors, getCategoryColor } from '../theme/colors';
import { GlassButton } from '../components/GlassButton';
import { getTodayDateString } from '../utils/formatters';
import { triggerHaptic } from '../utils/haptics';

interface AddEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (entryData: {
    distance: number;
    category: CategoryType;
    date: string;
    notes?: string;
  }) => Promise<void>;
  editingEntry?: Entry | null;
  unit?: string;
}

const CATEGORIES: { type: CategoryType; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { type: 'Driving', icon: 'car-sport-outline', label: 'Driving' },
  { type: 'Running', icon: 'flame-outline', label: 'Running' },
  { type: 'Walking', icon: 'walk-outline', label: 'Walking' },
  { type: 'Cycling', icon: 'bicycle-outline', label: 'Cycling' },
  { type: 'Other', icon: 'navigate-outline', label: 'Other' },
];

export const AddEntryModal: React.FC<AddEntryModalProps> = ({
  visible,
  onClose,
  onSave,
  editingEntry,
  unit = 'km',
}) => {
  const [distance, setDistance] = useState<string>('');
  const [category, setCategory] = useState<CategoryType>('Driving');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Shake animation for validation error
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (editingEntry) {
      setDistance(String(editingEntry.distance));
      setCategory(editingEntry.category);
      setDate(editingEntry.date);
      setNotes(editingEntry.notes || '');
    } else {
      setDistance('');
      setCategory('Driving');
      setDate(getTodayDateString());
      setNotes('');
    }
    setErrorMessage(null);
  }, [editingEntry, visible]);

  const triggerShake = () => {
    triggerHaptic('error');
    shakeX.value = withSequence(
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const shakeAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeX.value }],
    };
  });

  const handleQuickAdd = (amount: number) => {
    triggerHaptic('light');
    const current = parseFloat(distance) || 0;
    const nextVal = Math.round((current + amount) * 10) / 10;
    setDistance(String(nextVal));
  };

  const handleSubmit = async () => {
    const distNum = parseFloat(distance);

    if (isNaN(distNum) || distNum <= 0) {
      setErrorMessage('Please enter a valid distance greater than 0.');
      triggerShake();
      return;
    }

    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setErrorMessage('Please specify date in YYYY-MM-DD format.');
      triggerShake();
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        distance: distNum,
        category,
        date,
        notes: notes.trim() || undefined,
      });
      triggerHaptic('success');
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage('Failed to save entry. Please try again.');
      triggerShake();
    }
  };

  const selectedCategoryColor = getCategoryColor(category);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View style={styles.sheetContainer}>
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />

          {/* iOS Handle Indicator */}
          <View style={styles.handleIndicator} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingEntry ? 'Edit Entry' : 'Log Distance'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {editingEntry ? 'Update journey details' : 'Record your activity'}
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {/* Distance Input Section with Shake */}
            <Animated.View style={[styles.inputSection, shakeAnimatedStyle]}>
              <Text style={styles.inputLabel}>DISTANCE</Text>
              <View style={styles.distanceInputRow}>
                <TextInput
                  style={styles.distanceInput}
                  keyboardType="decimal-pad"
                  placeholder="0.0"
                  placeholderTextColor={Colors.textTertiary}
                  value={distance}
                  onChangeText={(val) => {
                    setDistance(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoFocus={!editingEntry}
                />
                <Text style={styles.unitSuffix}>{unit}</Text>
              </View>

              {/* Quick Increment Buttons */}
              <View style={styles.quickAddRow}>
                {[1, 5, 10, 25].map((amt) => (
                  <Pressable
                    key={amt}
                    onPress={() => handleQuickAdd(amt)}
                    style={styles.quickAddBtn}
                  >
                    <Text style={styles.quickAddText}>+{amt}</Text>
                  </Pressable>
                ))}
              </View>

              {errorMessage && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color={Colors.danger} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}
            </Animated.View>

            {/* Category Selector */}
            <View style={styles.section}>
              <Text style={styles.inputLabel}>ACTIVITY CATEGORY</Text>
              <View style={styles.categoryPillsRow}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.type;
                  const catColors = getCategoryColor(cat.type);

                  return (
                    <Pressable
                      key={cat.type}
                      onPress={() => {
                        triggerHaptic('selection');
                        setCategory(cat.type);
                      }}
                      style={[
                        styles.categoryPill,
                        isSelected
                          ? {
                              backgroundColor: catColors.glass,
                              borderColor: catColors.primary,
                            }
                          : styles.categoryPillInactive,
                      ]}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={18}
                        color={isSelected ? catColors.primary : Colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.categoryLabel,
                          isSelected && { color: catColors.primary, fontWeight: '700' },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Date Section */}
            <View style={styles.section}>
              <Text style={styles.inputLabel}>DATE (YYYY-MM-DD)</Text>
              <View style={styles.datePickerRow}>
                <TextInput
                  style={styles.dateInput}
                  value={date}
                  onChangeText={setDate}
                  placeholder="2026-04-13"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="numbers-and-punctuation"
                />
                <View style={styles.datePresetRow}>
                  <Pressable
                    style={[
                      styles.presetBtn,
                      date === getTodayDateString() && styles.presetBtnActive,
                    ]}
                    onPress={() => {
                      triggerHaptic('light');
                      setDate(getTodayDateString());
                    }}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        date === getTodayDateString() && styles.presetTextActive,
                      ]}
                    >
                      Today
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Notes Section */}
            <View style={styles.section}>
              <Text style={styles.inputLabel}>NOTES & DETAILS (OPTIONAL)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Route, gear, weather, or journey purpose..."
                placeholderTextColor={Colors.textTertiary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Submit Button */}
            <GlassButton
              label={
                isSubmitting
                  ? 'Saving...'
                  : editingEntry
                  ? 'Update Log'
                  : 'Save Distance Log'
              }
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              icon={
                <Ionicons
                  name={editingEntry ? 'checkmark-circle' : 'add-circle'}
                  size={20}
                  color="#00F2FE"
                />
              }
              style={styles.submitBtn}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  backdropPressable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: 'rgba(15, 20, 32, 0.94)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  handleIndicator: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputSection: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  distanceInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 242, 254, 0.35)',
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  distanceInput: {
    fontSize: 38,
    fontWeight: '900',
    color: '#00F2FE',
    flex: 1,
  },
  unitSuffix: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  quickAddBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
  },
  quickAddText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryPillInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: Colors.glassBorder,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  datePresetRow: {
    flexDirection: 'row',
  },
  presetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  presetBtnActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderColor: '#00F2FE',
  },
  presetText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  presetTextActive: {
    color: '#00F2FE',
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: 10,
  },
});
