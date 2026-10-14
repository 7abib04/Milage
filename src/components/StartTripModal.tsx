import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { CategoryType } from '../types';
import { Colors, getCategoryColor } from '../theme/colors';
import { GlassButton } from './GlassButton';
import { triggerHaptic } from '../utils/haptics';

interface StartTripModalProps {
  visible: boolean;
  onClose: () => void;
  onStart: (category: CategoryType, notes?: string) => void;
}

const CATEGORIES: { type: CategoryType; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { type: 'Driving', icon: 'car-sport-outline', label: 'Driving' },
  { type: 'Running', icon: 'flame-outline', label: 'Running' },
  { type: 'Walking', icon: 'walk-outline', label: 'Walking' },
  { type: 'Cycling', icon: 'bicycle-outline', label: 'Cycling' },
  { type: 'Other', icon: 'navigate-outline', label: 'Other' },
];

export const StartTripModal: React.FC<StartTripModalProps> = ({
  visible,
  onClose,
  onStart,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Driving');
  const [notes, setNotes] = useState<string>('');

  const handleStart = () => {
    triggerHaptic('medium');
    onStart(selectedCategory, notes.trim() || undefined);
    setNotes('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View style={styles.sheetContainer}>
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />

          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Start Active Trip</Text>
              <Text style={styles.subtitle}>Select activity type and begin live GPS tracking</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {/* Category Picker */}
          <Text style={styles.label}>ACTIVITY TYPE</Text>
          <View style={styles.categoriesRow}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.type;
              const colors = getCategoryColor(cat.type);

              return (
                <Pressable
                  key={cat.type}
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedCategory(cat.type);
                  }}
                  style={[
                    styles.catCard,
                    isSelected
                      ? {
                          backgroundColor: colors.glass,
                          borderColor: colors.primary,
                        }
                      : styles.catCardInactive,
                  ]}
                >
                  <Ionicons
                    name={cat.icon}
                    size={22}
                    color={isSelected ? colors.primary : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.catLabel,
                      isSelected && { color: colors.primary, fontWeight: '700' },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Notes (Optional) */}
          <Text style={styles.label}>NOTES / ROUTE (OPTIONAL)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="e.g. Downtown route, morning tempo run, coastal highway..."
            placeholderTextColor={Colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
          />

          {/* Start Button */}
          <GlassButton
            label="Initialize GPS & Start Trip"
            onPress={handleStart}
            variant="primary"
            size="lg"
            icon={<Ionicons name="play-circle" size={22} color="#00F2FE" />}
            style={styles.startBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  backdropPressable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: 'rgba(15, 20, 32, 0.95)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    overflow: 'hidden',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 10,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  catCardInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: Colors.glassBorder,
  },
  catLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
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
    marginBottom: 20,
  },
  startBtn: {
    marginTop: 4,
  },
});
