import React, { useCallback, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Alert, FlatList,
  Animated as RNAnimated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useDatabase } from '../../src/context/DatabaseContext';
import { colors, spacing, radius } from '../../src/theme';
import type { Category } from '../../src/types';

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useDatabase();
  const [categories, setCategories] = useState<Category[]>([]);

  const loadData = useCallback(async () => {
    if (!db?.isReady) return;
    await db.refreshCategories();
    setCategories(db?.categories ?? []);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      if (db?.isReady) {
        setCategories(db?.categories ?? []);
      }
    }, [db?.isReady, db?.categories])
  );

  const defaultCats = categories?.filter(c => c?.isDefault === 1) ?? [];
  const customCats = categories?.filter(c => c?.isDefault === 0) ?? [];

  const handleDeleteCategory = async (cat: Category) => {
    try {
      const count = await db.getCategoryExpenseCount(cat?.id);
      if (count > 0) {
        Alert.alert(
          'Cannot Delete',
          `${count} expense${count > 1 ? 's' : ''} use this category. Reassign them first.`,
          [{ text: 'OK' }]
        );
        return;
      }
      Alert.alert(
        'Delete Category',
        `Delete "${cat?.name ?? ''}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await db.deleteCategory(cat?.id);
            },
          },
        ]
      );
    } catch (e) {
      console.error('Delete category error:', e);
    }
  };

  const renderRightActions = (
    _progress: RNAnimated.AnimatedInterpolation<number>,
    _dragX: RNAnimated.AnimatedInterpolation<number>,
    cat: Category
  ) => (
    <Pressable
      style={styles.deleteAction}
      onPress={() => handleDeleteCategory(cat)}
      accessibilityLabel="Delete category"
    >
      <Text style={styles.deleteText}>Delete</Text>
    </Pressable>
  );

  const renderCategory = (cat: Category, isDefault: boolean) => {
    const content = (
      <Pressable
        style={({ pressed }) => [styles.catItem, pressed && !isDefault && styles.pressed]}
        onPress={isDefault ? undefined : () => router.push(`/edit-category/${cat?.id}`)}
        disabled={isDefault}
        accessibilityLabel={cat?.name ?? 'Category'}
      >
        <View style={[styles.catDot, { backgroundColor: cat?.color ?? colors.textMuted }]} />
        <Text style={styles.catName}>{cat?.name ?? ''}</Text>
        {isDefault ? (
          <MaterialCommunityIcons name="lock" size={18} color={colors.textMuted} />
        ) : (
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        )}
      </Pressable>
    );

    if (isDefault) return <View key={cat?.id}>{content}</View>;

    return (
      <Swipeable
        key={cat?.id}
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, cat)}
        overshootRight={false}
      >
        {content}
      </Swipeable>
    );
  };

  const data = [
    { type: 'section' as const, title: 'Default', key: 'section-default' },
    ...defaultCats.map(c => ({ type: 'item' as const, cat: c, isDefault: true, key: `cat-${c?.id}` })),
    { type: 'section' as const, title: 'Custom', key: 'section-custom' },
    ...customCats.map(c => ({ type: 'item' as const, cat: c, isDefault: false, key: `cat-${c?.id}` })),
  ];

  return (
    <GestureHandlerRootView style={[styles.screen, { paddingTop: insets.top }]}>
      <Text style={styles.header}>Categories</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => {
          if (item.type === 'section') {
            return <Text style={styles.sectionTitle}>{item.title}</Text>;
          }
          if (item.type === 'item' && item.cat) {
            return renderCategory(item.cat, item.isDefault ?? false);
          }
          return null;
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={styles.footer}>
            {customCats.length === 0 && (
              <Text style={styles.emptyText}>No custom categories yet</Text>
            )}
            <Pressable
              style={styles.addButton}
              onPress={() => router.push('/add-category')}
              accessibilityLabel="Add Category"
            >
              <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
              <Text style={styles.addButtonText}>Add Category</Text>
            </Pressable>
          </View>
        }
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgPrimary },
  header: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, paddingHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.sm },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.lg, marginBottom: spacing.sm },
  catItem: {
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
  catDot: { width: 14, height: 14, borderRadius: 7, marginRight: spacing.md },
  catName: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.textPrimary },
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
  footer: { marginTop: spacing.md },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addButtonText: { fontSize: 16, fontWeight: '600', color: colors.primary, marginLeft: spacing.sm },
});
