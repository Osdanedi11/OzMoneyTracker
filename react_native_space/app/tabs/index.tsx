import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDatabase } from '../../src/context/DatabaseContext';
import { MonthSelector } from '../../src/components/MonthSelector';
import { ExpenseRow } from '../../src/components/ExpenseRow';
import { FAB } from '../../src/components/FAB';
import { colors, spacing, radius } from '../../src/theme';
import { getMonthRange, formatCurrency } from '../../src/utils/date';
import type { ExpenseWithCategory, CategorySummary } from '../../src/types';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useDatabase();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [totalData, setTotalData] = useState({ total: 0, count: 0 });
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<ExpenseWithCategory[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!db?.isReady) return;
    try {
      const range = getMonthRange(year, month);
      const [total, summary, recent] = await Promise.all([
        db.getMonthTotal(range.start, range.end),
        db.getCategorySummary(range.start, range.end),
        db.getRecentExpenses(range.start, range.end, 5),
      ]);
      setTotalData(total ?? { total: 0, count: 0 });
      setCategorySummary(summary ?? []);
      setRecentExpenses(recent ?? []);
    } catch (e) {
      console.error('Dashboard load error:', e);
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

  const handleMonthChange = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
  };

  const maxCategoryTotal = Math.max(...(categorySummary?.map(c => c?.total ?? 0) ?? [0]), 1);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.appName}>OzMoneyTracker</Text>

        {/* Month Selector */}
        <MonthSelector year={year} month={month} onChange={handleMonthChange} />

        {/* Total Card */}
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.totalCard}
        >
          <Text style={styles.totalLabel}>Total Spent</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalData?.total)}</Text>
          <Text style={styles.totalSub}>{totalData?.count ?? 0} expenses this month</Text>
        </LinearGradient>

        {/* Category Breakdown */}
        {(categorySummary?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>By Category</Text>
            {categorySummary?.map((cat) => (
              <View key={cat?.id} style={styles.categoryRow}>
                <View style={styles.categoryLeft}>
                  <View style={[styles.catDot, { backgroundColor: cat?.color ?? colors.textMuted }]} />
                  <Text style={styles.catName} numberOfLines={1}>{cat?.name ?? ''}</Text>
                </View>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        backgroundColor: cat?.color ?? colors.textMuted,
                        width: `${Math.max(((cat?.total ?? 0) / maxCategoryTotal) * 100, 3)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.catAmount}>{formatCurrency(cat?.total)}</Text>
              </View>
            )) ?? null}
          </View>
        )}

        {/* Recent Expenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <Pressable onPress={() => router.push('/tabs/expenses')} hitSlop={12}>
              <Text style={styles.seeAll}>See All →</Text>
            </Pressable>
          </View>
          {(recentExpenses?.length ?? 0) === 0 ? (
            <Text style={styles.emptyText}>No expenses this month</Text>
          ) : (
            recentExpenses?.map((exp) => (
              <ExpenseRow
                key={exp?.id}
                expense={exp}
                compact
                onPress={() => router.push(`/edit-expense/${exp?.id}`)}
              />
            )) ?? null
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB onPress={() => router.push('/add-expense')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  totalCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: spacing.sm,
  },
  totalSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  seeAll: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  catName: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.bgSecondary,
    borderRadius: 4,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  bar: {
    height: 8,
    borderRadius: 4,
  },
  catAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    width: 80,
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
