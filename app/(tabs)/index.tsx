/**
 * HabitTracker – index.tsx
 * Author: Ronan Fernando (2025/2026)
 *
 * What's original (own work):
 * Adapting the student list screen from IS4447 lab workspace into a habits list.
 * Converting the student list screen to a habits list,
 * Search and category filter logic for habits.
 * Layout and styling decisions for the main habits screen.
 *
 * Adapted from:
 * IS4447 Lab workspace - original student list screen structure with search
 * and filter functionality, adapted for habits.
 * PrimaryButton, ScreenHeader, HabitCard components.
 * Drizzle ORM with SQLite for data persistence.
 * expo-drizzle-studio-plugin for database debugging.
 *
 * AI assistance (Claude, Anthropic, 2026):
 * Assisted with converting the student list screen to a habits list,
 * updating context from StudentContext to AppContext, and adding
 * category-based filtering alongside existing text search.
 * 
 *
 * Link to AI conversation: [paste link]
 *
 * I understand and can explain all code in this file.
 */

import HabitCard from '@/components/HabitCard';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { sqlite } from '@/db/client';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext, Category, Habit } from '../_layout';

export default function IndexScreen() {
  const router = useRouter();
  const context = useContext(AppContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useDrizzleStudio(sqlite);

  if (!context) return null;

  const { habits, categories } = context;

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const categoryOptions = [
    'All',
    ...categories.map((c: Category) => c.name),
  ];

  const filteredHabits = habits.filter((habit: Habit) => {
    const category = categories.find((c: Category) => c.id === habit.categoryId);

    const matchesSearch =
      normalizedQuery.length === 0 ||
      habit.name.toLowerCase().includes(normalizedQuery) ||
      (habit.notes ?? '').toLowerCase().includes(normalizedQuery) ||
      (category?.name ?? '').toLowerCase().includes(normalizedQuery);

    const matchesCategory =
      selectedCategory === 'All' ||
      category?.name === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="My Habits"
        subtitle={`${habits.length} habit${habits.length !== 1 ? 's' : ''} tracked`}
      />

      <PrimaryButton
        label="Add Habit"
        onPress={() => router.push({ pathname: '../add' })}
      />
      <View style={{ marginTop: 10 }}>
        <PrimaryButton
          label="Manage Categories"
          variant="secondary"
          onPress={() => router.push({ pathname: '../categories' })}
        />
      </View>

      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search habits..."
        accessibilityLabel="Search habits"
        style={styles.searchInput}
      />

      <View style={styles.filterRow}>
        {categoryOptions.map((cat) => {
          const isSelected = selectedCategory === cat;

          return (
            <Pressable
              key={cat}
              accessibilityLabel={`Filter by category ${cat}`}
              accessibilityRole="button"
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.filterButton,
                isSelected && styles.filterButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  isSelected && styles.filterButtonTextSelected,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredHabits.length === 0 ? (
          <Text style={styles.emptyText}>
            No habits match your filters
          </Text>
        ) : (
          filteredHabits.map((habit: Habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F8FAFC',
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 14,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#94A3B8',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#94A3B8',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterButtonSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextSelected: {
    color: '#FFFFFF',
  },
  emptyText: {
    color: '#475569',
    fontSize: 16,
    paddingTop: 8,
    textAlign: 'center',
  },
});