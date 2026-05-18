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
import { colors, spacing, radius, categoryColors } from '../../../src/theme';

export default function EditCategoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id = '' } = useLocalSearchParams();
  const db = useDatabase();

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const categoryId = parseInt(String(id), 10);
  const isValid = name?.trim()?.length > 0 && selectedColor !== null;

  useEffect(() => {
    if (!db?.isReady || isNaN(categoryId)) return;
    (async () => {
      try {
        const cat = await db.getCategoryById(categoryId);
        if (cat) {
          setName(cat?.name ?? '');
          setSelectedColor(cat?.color ?? null);
        }
      } catch (e) {
        console.error('Load category error:', e);
      }
      setLoading(false);
    })();
  }, [db?.isReady, categoryId]);

  const handleSave = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      await db.updateCategory(categoryId, name.trim(), selectedColor!);
      router.back();
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e?.message ?? '' : '';
      if (errMsg?.includes?.('UNIQUE')) {
        Alert.alert('Error', 'A category with this name already exists');
      } else {
        Alert.alert('Error', 'Failed to update category');
      }
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const count = await db.getCategoryExpenseCount(categoryId);
      if (count > 0) {
        Alert.alert('Cannot Delete', `${count} expense${count > 1 ? 's' : ''} use this category. Reassign them first.`);
        return;
      }
      Alert.alert('Delete Category', `Delete "${name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            await db.deleteCategory(categoryId);
            router.back();
          },
        },
      ]);
    } catch (e) {
      console.error('Delete category error:', e);
    }
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
        <Text style={styles.headerTitle}>Edit Category</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Category Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Category name"
          placeholderTextColor={colors.textMuted}
          maxLength={50}
        />

        <Text style={styles.label}>Color</Text>
        <View style={styles.colorGrid}>
          {categoryColors?.map((c) => (
            <Pressable
              key={c}
              style={[styles.colorSwatch, { backgroundColor: c }, selectedColor === c && styles.colorSelected]}
              onPress={() => setSelectedColor(c)}
            >
              {selectedColor === c && <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />}
            </Pressable>
          )) ?? null}
        </View>

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
            <Text style={styles.saveBtnText}>{saving ? 'Updating...' : 'Update Category'}</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>Delete Category</Text>
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
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  colorSwatch: { width: 48, height: 48, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  colorSelected: { borderWidth: 3, borderColor: '#FFFFFF' },
  saveBtn: { marginTop: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  deleteBtn: { marginTop: spacing.md, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.danger, alignItems: 'center' },
  deleteBtnText: { fontSize: 16, fontWeight: '600', color: colors.danger },
});
