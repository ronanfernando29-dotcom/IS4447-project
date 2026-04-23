/**
 * HabitTracker – categories.tsx
 * Author: Ronan Fernando (2025/2026)
 *
 * What's original (own work):
 * Designing the category management screen with create, edit, and delete.
 * Colour picker and icon selector UI for category customisation.
 * Layout and styling decisions for category cards and form.
 * chose specific MaterialCommunityIcons from icons.expo.fyi,
 * adapted styling to match app theme.
 *
 * Adapted from:
 * IS4447 Lab workspace - base project structure, FormField, PrimaryButton,
 * ScreenHeader components, Drizzle ORM with SQLite.
 * icons.expo.fyi (2026) MaterialCommunityIcons for icon selection.
 *
 * AI assistance (Claude, Anthropic, 2026):
 * Assisted with building the categories screen structure including
 * colour picker grid, icon selector grid, edit/create form toggle,
 * delete confirmation alert, and Drizzle ORM queries for CRUD operations.
 * 
 *
 *
 * I understand and can explain all code in this file.
 */

import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { categories as categoriesTable } from '@/db/schema';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext, Category } from './_layout';

// category colours to choose from
const COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6',
  '#EF4444', '#EC4899', '#14B8A6', '#F97316',
];

// selection of icons from MaterialCommunityIcons for categorisation
const ICONS = [
  'heart-pulse', 'run', 'book-open-variant', 'meditation',
  'food-apple', 'water', 'dumbbell', 'walk',
  'bicycle', 'sleep', 'music', 'pencil',
  'code-tags', 'cash', 'school', 'star',
];

export default function CategoriesScreen() {
  const router = useRouter();
  const context = useContext(AppContext);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [editingId, setEditingId] = useState<number | null>(null);

  if (!context) return null;
  const { categories, setCategories, userId } = context;

  const reloadCategories = async () => {
    if (!userId) return;
    const rows = await db.select().from(categoriesTable).where(eq(categoriesTable.userId, userId));
    setCategories(rows);
  };

  const saveCategory = async () => {
    if (!name.trim() || !userId) return;

    if (editingId) {
      await db
        .update(categoriesTable)
        .set({ name: name.trim(), color: selectedColor, icon: selectedIcon })
        .where(eq(categoriesTable.id, editingId));
    } else {
      await db.insert(categoriesTable).values({
        userId,
        name: name.trim(),
        color: selectedColor,
        icon: selectedIcon,
      });
    }

    await reloadCategories();
    resetForm();
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSelectedColor(cat.color);
    setSelectedIcon(cat.icon);
  };

  const deleteCategory = async (id: number) => {
    Alert.alert('Delete Category', 'Are you sure? Habits using this category will need updating.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
          await reloadCategories();
          if (editingId === id) resetForm();
        },
      },
    ]);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setSelectedColor(COLORS[0]);
    setSelectedIcon(ICONS[0]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Categories" subtitle="Organise your habits" />

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{editingId ? 'Edit Category' : 'New Category'}</Text>
          <FormField label="Name" value={name} onChangeText={setName} placeholder="e.g. Health" />

          <Text style={styles.sectionLabel}>Colour</Text>
          <View style={styles.optionRow}>
            {COLORS.map((color) => (
              <Pressable
                key={color}
                accessibilityLabel={`Select colour ${color}`}
                accessibilityRole="button"
                onPress={() => setSelectedColor(color)}
                style={[
                  styles.colorCircle,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorSelected,
                ]}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Icon</Text>
          <View style={styles.optionRow}>
            {ICONS.map((icon) => (
              <Pressable
                key={icon}
                accessibilityLabel={`Select icon ${icon}`}
                accessibilityRole="button"
                onPress={() => setSelectedIcon(icon)}
                style={[
                  styles.iconButton,
                  selectedIcon === icon && { backgroundColor: selectedColor + '20', borderColor: selectedColor },
                ]}
              >
                <MaterialCommunityIcons
                  name={icon as any}
                  size={22}
                  color={selectedIcon === icon ? selectedColor : '#6B7280'}
                />
              </Pressable>
            ))}
          </View>

          <PrimaryButton label={editingId ? 'Save Changes' : 'Add Category'} onPress={saveCategory} />
          {editingId ? (
            <View style={styles.cancelButton}>
              <PrimaryButton label="Cancel Edit" variant="secondary" onPress={resetForm} />
            </View>
          ) : null}
        </View>

        <Text style={styles.listTitle}>Your Categories</Text>
        {categories.length === 0 ? (
          <Text style={styles.emptyText}>No categories yet. Create one above.</Text>
        ) : (
          categories.map((cat: Category) => (
            <View key={cat.id} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                  <MaterialCommunityIcons name={cat.icon as any} size={22} color={cat.color} />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
                <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
              </View>
              <View style={styles.categoryActions}>
                <PrimaryButton label="Edit" compact onPress={() => startEdit(cat)} />
                <PrimaryButton label="Delete" compact variant="danger" onPress={() => deleteCategory(cat.id)} />
              </View>
            </View>
          ))
        )}

        <View style={styles.backButton}>
          <PrimaryButton label="Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F8FAFC',
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
    padding: 16,
  },
  formTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  colorCircle: {
    borderRadius: 999,
    height: 36,
    width: 36,
  },
  colorSelected: {
    borderColor: '#0F172A',
    borderWidth: 3,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderRadius: 10,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  cancelButton: {
    marginTop: 10,
  },
  listTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  categoryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  categoryIcon: {
    alignItems: 'center',
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    marginRight: 12,
    width: 38,
  },
  categoryName: {
    color: '#111827',
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  colorDot: {
    borderRadius: 999,
    height: 14,
    width: 14,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  backButton: {
    marginTop: 16,
  },
});