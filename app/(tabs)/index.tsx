/**
 * HabitTracker – index.tsx
 * Author: Ronan Fernando (2025/2026)
 *
 * What's original (own work):
 * Adapting the student list screen from IS4447 lab workspace into a habits list.
 * Converting the student list screen to a habits list.
 * Search and category filter logic for habits.
 * Layout and styling decisions for the main habits screen.
 * Implementing dark mode toggle using ThemeContext.
 *
 * Adapted from:
 * IS4447 Lab workspace - original student list screen structure with search
 * and filter functionality, adapted for habits.
 * PrimaryButton, ScreenHeader, HabitCard components.
 * Drizzle ORM with SQLite for data persistence — https://orm.drizzle.team/docs/select
 * expo-drizzle-studio-plugin for database debugging — https://www.npmjs.com/package/expo-drizzle-studio-plugin
 * React Context API for theme — https://react.dev/reference/react/createContext
 * icons.expo.fyi (2026) MaterialCommunityIcons — https://icons.expo.fyi
 *
 * AI assistance (Claude, Anthropic, 2026):
 * Assisted with converting the student list screen to a habits list,
 * updating context from StudentContext to AppContext, and adding
 * category-based filtering alongside existing text search.
 * Dark mode integration with ThemeContext implemented by myself.
 *
 * 
 *
 * I understand and can explain all code in this file.
 */

import HabitCard from '@/components/HabitCard';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useTheme } from '@/context/ThemeContext';
import { sqlite } from '@/db/client';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { Redirect, useRouter } from 'expo-router';
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
  const [dateFilter, setDateFilter] = useState('All Time');
  const { colors, dark, toggleTheme } = useTheme();

  useDrizzleStudio(sqlite);


  
  if (!context) return null;

  if (!context.userId) {
    return <Redirect href="/login" />;
  }


  const { habits, categories } = context;

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const categoryOptions = [
    'All',
    ...categories.map((c: Category) => c.name),
  ];

  const getDateRangeStart = (): string | null => {
    const now = new Date();
    if (dateFilter === 'Last 7 Days') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return weekAgo.toISOString().split('T')[0];
    }
    if (dateFilter === 'Last 30 Days') {
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);
      return monthAgo.toISOString().split('T')[0];
    }
    return null;
  };

  const dateRangeStart = getDateRangeStart();

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

    const matchesDate =
      !dateRangeStart ||
      habit.createdAt.split('T')[0] >= dateRangeStart;

    return matchesSearch && matchesCategory && matchesDate;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <ScreenHeader
            title="My Habits"
            subtitle={`${habits.length} habit${habits.length !== 1 ? 's' : ''} tracked`}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            accessibilityLabel="Profile"
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '../profile' })}
            style={[styles.themeToggle, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <MaterialCommunityIcons name="account-circle-outline" size={22} color={colors.text} />
          </Pressable>
          <Pressable
            accessibilityLabel={`Switch to ${dark ? 'light' : 'dark'} mode`}
            accessibilityRole="button"
            onPress={toggleTheme}
            style={[styles.themeToggle, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <MaterialCommunityIcons
              name={dark ? 'weather-sunny' : 'weather-night'}
              size={22}
              color={colors.text}
            />
          </Pressable>
        </View>
      </View>

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
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel="Search habits"
        style={[styles.searchInput, {
          backgroundColor: colors.inputBg,
          borderColor: colors.inputBorder,
          color: colors.text,
        }]}
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
                { backgroundColor: colors.filterBg, borderColor: colors.filterBorder },
                isSelected && { backgroundColor: colors.filterSelectedBg, borderColor: colors.filterSelectedBg },
              ]}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  { color: colors.text },
                  isSelected && { color: colors.filterSelectedText },
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.filterRow}>
        {['All Time', 'Last 7 Days', 'Last 30 Days'].map((option) => {
          const isSelected = dateFilter === option;

          return (
            <Pressable
              key={option}
              accessibilityLabel={`Filter by ${option}`}
              accessibilityRole="button"
              onPress={() => setDateFilter(option)}
              style={[
                styles.filterButton,
                { backgroundColor: colors.filterBg, borderColor: colors.filterBorder },
                isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  { color: colors.text },
                  isSelected && { color: '#FFFFFF' },
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredHabits.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  themeToggle: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    marginTop: 4,
    width: 40,
  },
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