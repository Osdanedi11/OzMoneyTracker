import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDatabase } from '../../../src/context/DatabaseContext';
import { colors, spacing, radius } from '../../../src/theme';
import type { Category } from '../../../src/types';
import { DatePickerField } from '../../../src/components/DatePickerField';

export default function EditExpenseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id = '' } = useLocalSearchParams();
  const db = useDatabase();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const expenseId = parseInt(String(id), 10);
  const categories = db?.categories ?? [];
  const selectedCategory = categories?.find(c => c?.id === categoryId) ?? null;
  const isValid = name?.trim()?.length > 0 && parseFloat(amount) > 0 && categoryId !== null;

  useEffect(() => {
    if (!db?.isReady || isNaN(expenseId)) return;
    (async () => {
      try {
        const exp = await db.getExpenseById(expenseId);
        if (exp) {
          setName(exp?.name ?? '');
          setAmount(String(exp?.amount ?? ''));
          setCategoryId(exp?.categoryId ?? null);
          setDate(exp?.date ?? '');
        }
      } catch (e) {
        console.error('Load expense error:', e);
      }
      setLoading(false);
    })();
  }, [db?.isReady, expenseId]);

  const handleSave = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      await db.updateExpense(expenseId, name.trim(), parseFloat(amount), categoryId!, date);
      router.back();
    } catch (e) {
      console.error('Update expense error:', e);
      Alert.alert('Error', 'Failed to update expense');
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Expense', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await db.deleteExpense(expenseId);
            router.back();
          } catch (e) {
            console.error('Delete expense error:', e);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Expense</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Expense Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Grocery shopping"
          placeholderTextColor={colors.textMuted}
          maxLength={100}
        />

        <Text style={styles.label}>Amount ($)</Text>
        <View style={styles.amountRow}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            style={[styles.input, styles.amountInput]}
            value={amount}
            onChangeText={(t) => {
              const cleaned = t.replace(/[^0-9.]/g, '');
              const parts = cleaned.split('.');
              if ((parts?.length ?? 0) > 2) return;
              if ((parts?.[1]?.length ?? 0) > 2) return;
              setAmount(cleaned);
            }}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />
        </View>

        <Text style={styles.label}>Category</Text>
        <Pressable
          style={styles.pickerBtn}
          onPress={() => setShowCategoryPicker(!showCategoryPicker)}
        >
          {selectedCategory ? (
            <View style={styles.selectedCat}>
              <View style={[styles.catDot, { backgroundColor: selectedCategory?.color ?? colors.textMuted }]} />
              <Text style={styles.catText}>{selectedCategory?.name ?? ''}</Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>Select a category</Text>
          )}
          <MaterialCommunityIcons
            name={showCategoryPicker ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>

        {showCategoryPicker && (
          <View style={styles.catList}>
            {categories?.map((cat) => (
              <Pressable
                key={cat?.id}
                style={[styles.catOption, cat?.id === categoryId && styles.catOptionSelected]}
                onPress={() => { setCategoryId(cat?.id); setShowCategoryPicker(false); }}
              >
                <View style={[styles.catDot, { backgroundColor: cat?.color ?? colors.textMuted }]} />
                <Text style={styles.catOptionText}>{cat?.name ?? ''}</Text>
                {cat?.id === categoryId && <MaterialCommunityIcons name="check" size={18} color={colors.accent} />}
              </Pressable>
            )) ?? null}
          </View>
        )}

        <Text style={styles.label}>Date</Text>
        <DatePickerField value={date} onChange={setDate} />

        <Pressable
          onPress={handleSave}
          disabled={!isValid || saving}
          style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
        >
          <LinearGradient
            colors={isValid ? colors.gradientPrimary : ['#333', '#444'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.saveBtn, !isValid && styles.saveBtnDisabled]}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Updating...' : 'Update Expense'}</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>Delete Expense</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgPrimary },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 44, justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  form: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginRight: spacing.sm },
  amountInput: { flex: 1 },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.cardSurface, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.cardBorder, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  selectedCat: { flexDirection: 'row', alignItems: 'center' },
  catDot: { width: 12, height: 12, borderRadius: 6, marginRight: spacing.sm },
  catText: { fontSize: 16, color: colors.textPrimary },
  placeholderText: { fontSize: 16, color: colors.textMuted },
  catList: { backgroundColor: colors.cardSurface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, marginTop: spacing.sm, overflow: 'hidden' },
  catOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  catOptionSelected: { backgroundColor: 'rgba(79, 70, 229, 0.1)' },
  catOptionText: { flex: 1, fontSize: 15, color: colors.textPrimary },
  saveBtn: { marginTop: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  deleteBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.danger,
    alignItems: 'center',
  },
  deleteBtnText: { fontSize: 16, fontWeight: '600', color: colors.danger },
});
