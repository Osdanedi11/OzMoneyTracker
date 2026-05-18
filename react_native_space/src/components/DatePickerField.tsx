import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Platform, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';
import { formatDate } from '../utils/date';

interface Props {
  value: string; // ISO date string YYYY-MM-DD
  onChange: (date: string) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function DatePickerField({ value, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  // Parse current value
  const parts = value?.split?.('-') ?? [];
  const currentYear = parseInt(parts?.[0] ?? String(new Date().getFullYear()), 10);
  const currentMonth = parseInt(parts?.[1] ?? String(new Date().getMonth() + 1), 10) - 1;
  const currentDay = parseInt(parts?.[2] ?? String(new Date().getDate()), 10);

  const [pickerYear, setPickerYear] = useState(currentYear);
  const [pickerMonth, setPickerMonth] = useState(currentMonth);

  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(pickerYear, pickerMonth, 1).getDay();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handleDayPress = (day: number) => {
    const dateStr = `${pickerYear}-${String(pickerMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateStr);
    setShowPicker(false);
  };

  const prevMonth = () => {
    if (pickerMonth === 0) {
      setPickerMonth(11);
      setPickerYear(pickerYear - 1);
    } else {
      setPickerMonth(pickerMonth - 1);
    }
  };

  const nextMonth = () => {
    if (pickerMonth === 11) {
      setPickerMonth(0);
      setPickerYear(pickerYear + 1);
    } else {
      setPickerMonth(pickerMonth + 1);
    }
  };

  const isSelected = (day: number) => {
    return day === currentDay && pickerMonth === currentMonth && pickerYear === currentYear;
  };

  return (
    <View>
      <Pressable
        style={styles.field}
        onPress={() => setShowPicker(true)}
        accessibilityLabel="Select date"
      >
        <MaterialCommunityIcons name="calendar" size={20} color={colors.textSecondary} />
        <Text style={styles.dateText}>{value ? formatDate(value) : 'Select date'}</Text>
      </Pressable>

      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowPicker(false)}>
          <Pressable style={styles.pickerContainer} onPress={() => {}}>
            {/* Month navigation */}
            <View style={styles.monthNav}>
              <Pressable onPress={prevMonth} hitSlop={12} style={styles.navBtn}>
                <MaterialCommunityIcons name="chevron-left" size={24} color={colors.textPrimary} />
              </Pressable>
              <Text style={styles.monthLabel}>
                {MONTH_NAMES[pickerMonth] ?? ''} {pickerYear}
              </Text>
              <Pressable onPress={nextMonth} hitSlop={12} style={styles.navBtn}>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            {/* Day headers */}
            <View style={styles.weekRow}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <Text key={d} style={styles.weekDay}>{d}</Text>
              ))}
            </View>

            {/* Days grid */}
            <View style={styles.daysGrid}>
              {days.map((day, idx) => (
                <View key={idx} style={styles.dayCell}>
                  {day !== null ? (
                    <Pressable
                      style={[styles.dayBtn, isSelected(day) && styles.daySelected]}
                      onPress={() => handleDayPress(day)}
                    >
                      <Text style={[styles.dayText, isSelected(day) && styles.dayTextSelected]}>
                        {day}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>

            <Pressable style={styles.cancelBtn} onPress={() => setShowPicker(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  dateText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: 320,
    maxWidth: '90%',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  navBtn: {
    padding: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  daySelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cancelBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
