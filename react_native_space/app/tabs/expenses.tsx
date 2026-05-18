import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, Alert,
  Animated as RNAnimated, FlatList, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useDatabase } from '../../src/context/DatabaseContext';
import { MonthSelector } from '../../src/components/MonthSelector';
import { EmptyState } from '../../src/components/EmptyState';
import { FAB } from '../../src/components/FAB';
import { colors, spacing, radius } from '../../src/theme';
import { getMonthRange, formatCurrency, formatDate, formatMonthYear } from '../../src/utils/date';
import type { ExpenseWithCategory } from '../../src/types';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useDatabase();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const openSwipeableRef = useRef<Swipeable | null>(null);

  const loadData = useCallback(async () => {
    if (!db?.isReady) return;
    try {
      const range = getMonthRange(year, month);
      const data = await db.getExpensesForMonth(range.start, range.end);
      setExpenses(data ?? []);
    } catch (e) {
      console.error('Expenses load error:', e);
    }
  }, [db, year, month]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleDelete = (expense: ExpenseWithCategory) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense?.name ?? ''}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.deleteExpense(expense?.id);
              await loadData();
            } catch (e) {
              console.error('Delete error:', e);
            }
          },
        },
      ]
    );
  };

  const renderRightActions = (
    _progress: RNAnimated.AnimatedInterpolation<number>,
    _dragX: RNAnimated.AnimatedInterpolation<number>,
    expense: ExpenseWithCategory
  ) => {
    return (
      <Pressable
        style={styles.deleteAction}
        onPress={() => handleDelete(expense)}
        accessibilityLabel="Delete expense"
      >
        <Text style={styles.deleteText}>Delete</Text>
      </Pressable>
    );
  };

  const renderItem = ({ item }: { item: ExpenseWithCategory }) => (
    <Swipeable
      ref={(ref) => {
        // Close previously opened swipeable
      }}
      renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
      onSwipeableOpen={() => {
        openSwipeableRef.current?.close();
      }}
      overshootRight={false}
    >
      <Pressable
        style={({ pressed }) => [styles.expenseItem, pressed && styles.pressed]}
        onPress={() => router.push(`/edit-expense/${item?.id}`)}
        accessibilityLabel={`${item?.name}, ${formatCurrency(item?.amount)}`}
      >
        <View style={[styles.dot, { backgroundColor: item?.categoryColor ?? colors.textMuted }]} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item?.name ?? ''}</Text>
          <Text style={styles.itemCategory} numberOfLines={1}>{item?.categoryName ?? ''}</Text>
        </View>
        <View style={styles.itemRight}>
          <Text style={styles.itemAmount}>{formatCurrency(item?.amount)}</Text>
          <Text style={styles.itemDate}>{formatDate(item?.date ?? '')}</Text>
        </View>
      </Pressable>
    </Swipeable>
  );

  return (
    <GestureHandlerRootView style={[styles.screen, { paddingTop: insets.top }]}>
      <Text style={styles.header}>Expenses</Text>
      <MonthSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />

      {(expenses?.length ?? 0) === 0 ? (
        <EmptyState
          icon="receipt"
          title={`No expenses for ${formatMonthYear(year, month)}`}
          message="Tap + to add your first expense"
          actionLabel="Add Expense"
          onAction={() => router.push('/add-expense')}
        />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => String(item?.id ?? Math.random())}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB onPress={() => router.push('/add-expense')} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  expenseItem: {
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
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: spacing.md },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  itemCategory: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  itemAmount: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  itemDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  deleteAction: {
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  deleteText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
