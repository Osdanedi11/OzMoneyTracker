import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useDatabase } from '../../src/context/DatabaseContext';
import { MonthSelector } from '../../src/components/MonthSelector';
import { colors, spacing, radius } from '../../src/theme';
import { getMonthRange, formatCurrency, formatMonthYear } from '../../src/utils/date';
import type { CategorySummary, MonthlyTotal, ExpenseWithCategory } from '../../src/types';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const db = useDatabase();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [totalData, setTotalData] = useState({ total: 0, count: 0 });
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([]);
  const [topExpenses, setTopExpenses] = useState<ExpenseWithCategory[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!db?.isReady) return;
    try {
      const range = getMonthRange(year, month);

      // 6 months ago
      const sixMonthsAgo = new Date(year, month - 5, 1);
      const sinceDate = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;

      const [total, summary, monthly, top] = await Promise.all([
        db.getMonthTotal(range.start, range.end),
        db.getCategorySummary(range.start, range.end),
        db.getMonthlyTotals(sinceDate),
        db.getTopExpenses(range.start, range.end, 5),
      ]);
      setTotalData(total ?? { total: 0, count: 0 });
      setCategorySummary(summary ?? []);
      setMonthlyTotals(monthly ?? []);
      setTopExpenses(top ?? []);
    } catch (e) {
      console.error('Reports load error:', e);
    }
  }, [db, year, month]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleMonthChange = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
  };

  const grandTotal = categorySummary?.reduce((sum, c) => sum + (c?.total ?? 0), 0) ?? 0;
  const maxMonthlyTotal = Math.max(...(monthlyTotals?.map(m => m?.total ?? 0) ?? [0]), 1);

  const handleMonthTap = (monthStr: string) => {
    if (!monthStr) return;
    const parts = monthStr.split('-');
    const y = parseInt(parts?.[0] ?? String(year), 10);
    const m = parseInt(parts?.[1] ?? '1', 10) - 1;
    setYear(y);
    setMonth(m);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadData(); setRefreshing(false); }} tintColor={colors.accent} />}
      >
        <Text style={styles.header}>Reports</Text>
        <MonthSelector year={year} month={month} onChange={handleMonthChange} />

        {/* Monthly Total Card */}
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.totalCard}
        >
          <Text style={styles.totalLabel}>Monthly Total</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalData?.total)}</Text>
          <Text style={styles.totalSub}>{totalData?.count ?? 0} transactions</Text>
        </LinearGradient>

        {/* Category Breakdown */}
        {(categorySummary?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            {categorySummary?.map((cat) => {
              const pct = grandTotal > 0 ? ((cat?.total ?? 0) / grandTotal) * 100 : 0;
              return (
                <View key={cat?.id} style={styles.catRow}>
                  <View style={styles.catInfo}>
                    <View style={[styles.catDot, { backgroundColor: cat?.color ?? colors.textMuted }]} />
                    <Text style={styles.catName} numberOfLines={1}>{cat?.name ?? ''}</Text>
                  </View>
                  <View style={styles.catBarWrap}>
                    <View
                      style={[
                        styles.catBar,
                        {
                          backgroundColor: cat?.color ?? colors.textMuted,
                          width: `${Math.max(pct, 2)}%`,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.catValues}>
                    <Text style={styles.catAmount}>{formatCurrency(cat?.total)}</Text>
                    <Text style={styles.catPct}>{pct?.toFixed?.(1) ?? '0'}%</Text>
                  </View>
                </View>
              );
            }) ?? null}
          </View>
        )}

        {/* Monthly Trend */}
        {(monthlyTotals?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monthly Trend</Text>
            {monthlyTotals?.map((mt) => {
              const parts = mt?.month?.split?.('-') ?? [];
              const mIdx = parseInt(parts?.[1] ?? '1', 10) - 1;
              const mYear = parts?.[0] ?? '';
              const label = `${MONTH_SHORT[mIdx] ?? ''} ${mYear}`;
              const selected = mt?.month === `${year}-${String(month + 1).padStart(2, '0')}`;
              return (
                <Pressable
                  key={mt?.month}
                  style={[styles.trendRow, selected && styles.trendSelected]}
                  onPress={() => handleMonthTap(mt?.month ?? '')}
                >
                  <Text style={[styles.trendLabel, selected && styles.trendLabelActive]}>{label}</Text>
                  <View style={styles.trendBarWrap}>
                    <View
                      style={[
                        styles.trendBar,
                        {
                          width: `${Math.max(((mt?.total ?? 0) / maxMonthlyTotal) * 100, 3)}%`,
                          backgroundColor: selected ? colors.accent : colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.trendAmount, selected && styles.trendAmountActive]}>
                    {formatCurrency(mt?.total)}
                  </Text>
                </Pressable>
              );
            }) ?? null}
          </View>
        )}

        {/* Top Expenses */}
        {(topExpenses?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top 5 Expenses</Text>
            {topExpenses?.map((exp, i) => (
              <View key={exp?.id ?? i} style={styles.topItem}>
                <View style={styles.topRank}>
                  <Text style={styles.topRankText}>{i + 1}</Text>
                </View>
                <View style={styles.topInfo}>
                  <Text style={styles.topName} numberOfLines={1}>{exp?.name ?? ''}</Text>
                  <View style={styles.topPill}>
                    <View style={[styles.topPillDot, { backgroundColor: exp?.categoryColor ?? colors.textMuted }]} />
                    <Text style={styles.topPillText}>{exp?.categoryName ?? ''}</Text>
                  </View>
                </View>
                <Text style={styles.topAmount}>{formatCurrency(exp?.amount)}</Text>
              </View>
            )) ?? null}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgPrimary },
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  header: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.md },
  totalCard: { borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', marginTop: spacing.md },
  totalLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  totalAmount: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginVertical: spacing.sm },
  totalSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  section: { marginTop: spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  catInfo: { flexDirection: 'row', alignItems: 'center', width: 120 },
  catDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
  catName: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  catBarWrap: { flex: 1, height: 10, backgroundColor: colors.bgSecondary, borderRadius: 5, marginHorizontal: spacing.sm, overflow: 'hidden' },
  catBar: { height: 10, borderRadius: 5 },
  catValues: { width: 90, alignItems: 'flex-end' },
  catAmount: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  catPct: { fontSize: 11, color: colors.textMuted },
  trendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radius.sm, marginBottom: spacing.xs },
  trendSelected: { backgroundColor: 'rgba(79, 70, 229, 0.15)' },
  trendLabel: { fontSize: 13, color: colors.textSecondary, width: 70 },
  trendLabelActive: { color: colors.accent, fontWeight: '700' },
  trendBarWrap: { flex: 1, height: 8, backgroundColor: colors.bgSecondary, borderRadius: 4, marginHorizontal: spacing.sm, overflow: 'hidden' },
  trendBar: { height: 8, borderRadius: 4 },
  trendAmount: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, width: 80, textAlign: 'right' },
  trendAmountActive: { color: colors.accent },
  topItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardSurface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  topRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.bgSecondary, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  topRankText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  topInfo: { flex: 1 },
  topName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  topPill: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  topPillDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.xs },
  topPillText: { fontSize: 12, color: colors.textSecondary },
  topAmount: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
});
