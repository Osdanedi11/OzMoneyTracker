import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { ExpenseWithCategory } from '../types';
import { colors, spacing, radius } from '../theme';
import { formatCurrency, formatDate } from '../utils/date';

interface Props {
  expense: ExpenseWithCategory;
  onPress?: () => void;
  compact?: boolean;
}

export function ExpenseRow({ expense, onPress, compact }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        compact && styles.compact,
        pressed && onPress && styles.pressed,
      ]}
      accessibilityLabel={`${expense?.name ?? 'Expense'}, ${formatCurrency(expense?.amount)}`}
    >
      <View style={[styles.dot, { backgroundColor: expense?.categoryColor ?? colors.textMuted }]} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{expense?.name ?? ''}</Text>
        {!compact && (
          <Text style={styles.category} numberOfLines={1}>{expense?.categoryName ?? ''}</Text>
        )}
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>{formatCurrency(expense?.amount)}</Text>
        <Text style={styles.date}>{formatDate(expense?.date ?? '')}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.cardSurface,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  compact: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  category: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  date: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
