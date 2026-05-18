import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';
import { formatMonthYear, getPrevMonth, getNextMonth } from '../utils/date';

interface Props {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

export function MonthSelector({ year, month, onChange }: Props) {
  const handlePrev = () => {
    const p = getPrevMonth(year, month);
    onChange(p.year, p.month);
  };

  const handleNext = () => {
    const n = getNextMonth(year, month);
    onChange(n.year, n.month);
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePrev}
        style={styles.arrow}
        accessibilityLabel="Previous month"
        hitSlop={12}
      >
        <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
      </Pressable>
      <Text style={styles.label}>{formatMonthYear(year, month)}</Text>
      <Pressable
        onPress={handleNext}
        style={styles.arrow}
        accessibilityLabel="Next month"
        hitSlop={12}
      >
        <MaterialCommunityIcons name="chevron-right" size={28} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  arrow: {
    padding: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 160,
    textAlign: 'center',
  },
});
