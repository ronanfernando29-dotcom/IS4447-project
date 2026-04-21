/**
 * HabitTracker – today.tsx
 * Author: Ronan Fernando (2025/2026)
 *
 * What's original (own work):
 * Designing the daily habit check-off interface with toggle and counter controls.
 * Dynamic colour logic for progress bar based on completion rate.
 * Layout and styling for habit cards with completed/uncompleted states.
 * Implementing dark mode colours using ThemeContext.
 *
 * Adapted from:
 * IS4447 Lab workspace - base project structure, Drizzle ORM with SQLite — https://orm.drizzle.team/docs/select
 * react-native-progress npm package for progress bars — https://www.npmjs.com/package/react-native-progress
 * icons.expo.fyi (2026) MaterialCommunityIcons — https://icons.expo.fyi
 * Progress bar colour pattern adapted from own FYP project (EatBud).
 * React Context API for theme — https://react.dev/reference/react/createContext
 * ZenQuotes API for motivational quotes — https://zenquotes.io
 *
 * AI assistance (Claude, Anthropic, 2026):
 * Assisted with building the daily logging screen structure including
 * toggle and count-based habit logging, Drizzle ORM queries for
 * inserting and updating habit logs by date, and overall daily
 * progress calculation.
 * Dark mode integration with ThemeContext implemented by myself.
 *
 *
 * I understand and can explain all code in this file.
 */

import QuoteCard from '@/components/QuoteCard';
import ScreenHeader from '@/components/ui/screen-header';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/db/client';
import { habitLogs as habitLogsTable } from '@/db/schema';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { eq } from 'drizzle-orm';
import { useFocusEffect } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Progress from 'react-native-progress';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext, Category, Habit } from '../_layout';

type LogEntry = {
  id: number;
  habitId: number;
  date: string;
  count: number;
  completed: number;
  notes: string | null;
};

export default function TodayScreen() {
  const context = useContext(AppContext);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const today = new Date().toISOString().split('T')[0];
  const { colors } = useTheme();

  useFocusEffect(
    useCallback(() => {
      loadTodayLogs();
    }, [context?.habits])
  );

  const loadTodayLogs = async () => {
    const rows = await db
      .select()
      .from(habitLogsTable)
      .where(eq(habitLogsTable.date, today));
    setLogs(rows);
  };

  if (!context) return null;
  const { habits, categories } = context;

  const getLog = (habitId: number) => logs.find((l) => l.habitId === habitId);

  const toggleHabit = async (habit: Habit) => {
    const existing = getLog(habit.id);

    if (existing) {
      if (existing.completed) {
        // Unmark delete log
        await db.delete(habitLogsTable).where(eq(habitLogsTable.id, existing.id));
      } else {
        // Mark as completed
        await db
          .update(habitLogsTable)
          .set({ completed: 1, count: 1 })
          .where(eq(habitLogsTable.id, existing.id));
      }
    } else {
      // Create new log
      await db.insert(habitLogsTable).values({
        habitId: habit.id,
        date: today,
        count: 1,
        completed: 1,
      });
    }

    await loadTodayLogs();
  };

  const updateCount = async (habit: Habit, newCount: number) => {
    if (newCount < 0) return;
    const existing = getLog(habit.id);

    if (existing) {
      await db
        .update(habitLogsTable)
        .set({ count: newCount, completed: newCount >= habit.goalCount ? 1 : 0 })
        .where(eq(habitLogsTable.id, existing.id));
    } else {
      await db.insert(habitLogsTable).values({
        habitId: habit.id,
        date: today,
        count: newCount,
        completed: newCount >= habit.goalCount ? 1 : 0,
      });
    }

    await loadTodayLogs();
  };

  const completedCount = habits.filter((h) => getLog(h.id)?.completed).length;
  const overallProgress = habits.length > 0 ? completedCount / habits.length : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Today" subtitle={today} />
        <QuoteCard />

        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryText, { color: colors.text }]}>
            {completedCount} of {habits.length} habits completed
          </Text>
          <Progress.Bar
            progress={overallProgress}
            width={null}
            height={10}
            borderRadius={5}
            color={
              overallProgress >= 1.0 ? '#10B981' :
              overallProgress >= 0.5 ? '#F59E0B' :
              overallProgress > 0 ? '#EF4444' :
              '#E5E7EB'
            }
            unfilledColor="#E5E7EB"
            borderWidth={0}
          />
        </View>

        {habits.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No habits yet. Add one from the Habits tab.</Text>
        ) : (
          habits.map((habit: Habit) => {
            const category = categories.find((c: Category) => c.id === habit.categoryId);
            const log = getLog(habit.id);
            const isCompleted = log?.completed === 1;
            const currentCount = log?.count ?? 0;
            const isCountBased = habit.goalCount > 1;
            const progress = isCountBased
              ? Math.min(currentCount / habit.goalCount, 1)
              : isCompleted ? 1 : 0;

            return (
              <View key={habit.id} style={[styles.habitCard, { backgroundColor: colors.card, borderColor: colors.border }, isCompleted && styles.habitCardCompleted]}>
                <View style={styles.habitHeader}>
                  <View style={[styles.iconBox, { backgroundColor: (category?.color ?? '#94A3B8') + '20' }]}>
                    <MaterialCommunityIcons
                      name={(category?.icon as any) ?? 'star'}
                      size={22}
                      color={category?.color ?? '#94A3B8'}
                    />
                  </View>
                  <View style={styles.habitInfo}>
                    <Text style={[styles.habitName, { color: colors.text }, isCompleted && styles.habitNameCompleted]}>
                      {habit.name}
                    </Text>
                    <Text style={[styles.habitGoal, { color: colors.textSecondary }]}>
                      {isCountBased ? `${currentCount} / ${habit.goalCount}` : isCompleted ? 'Done' : 'Not done'}
                    </Text>
                  </View>

                  {isCountBased ? (
                    <View style={styles.counterRow}>
                      <Pressable
                        accessibilityLabel={`Decrease count for ${habit.name}`}
                        accessibilityRole="button"
                        onPress={() => updateCount(habit, currentCount - 1)}
                        style={styles.counterButton}
                      >
                        <MaterialCommunityIcons name="minus" size={20} color="#6B7280" />
                      </Pressable>
                      <Text style={styles.counterText}>{currentCount}</Text>
                      <Pressable
                        accessibilityLabel={`Increase count for ${habit.name}`}
                        accessibilityRole="button"
                        onPress={() => updateCount(habit, currentCount + 1)}
                        style={styles.counterButton}
                      >
                        <MaterialCommunityIcons name="plus" size={20} color="#6B7280" />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      accessibilityLabel={`Mark ${habit.name} as ${isCompleted ? 'not done' : 'done'}`}
                      accessibilityRole="button"
                      onPress={() => toggleHabit(habit)}
                      style={[styles.checkButton, isCompleted && styles.checkButtonDone]}
                    >
                      <MaterialCommunityIcons
                        name={isCompleted ? 'check' : 'circle-outline'}
                        size={24}
                        color={isCompleted ? '#FFFFFF' : '#94A3B8'}
                      />
                    </Pressable>
                  )}
                </View>

                {isCountBased ? (
                  <View style={styles.progressRow}>
                    <Progress.Bar
                      progress={progress}
                      width={null}
                      height={6}
                      borderRadius={3}
                      color={
                        progress >= 1.0 ? '#10B981' :
                        progress >= 0.5 ? '#F59E0B' :
                        progress > 0 ? '#EF4444' :
                        '#E5E7EB'
                      }
                      unfilledColor="#E5E7EB"
                      borderWidth={0}
                    />
                  </View>
                ) : null}
              </View>
            );
          })
        )}
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    padding: 16,
  },
  summaryText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  habitCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  habitCardCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  habitHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  iconBox: {
    alignItems: 'center',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  habitNameCompleted: {
    color: '#059669',
  },
  habitGoal: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 2,
  },
  counterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  counterButton: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  counterText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  checkButton: {
    alignItems: 'center',
    borderColor: '#D1D5DB',
    borderRadius: 999,
    borderWidth: 2,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  checkButtonDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  progressRow: {
    marginTop: 10,
  },
});