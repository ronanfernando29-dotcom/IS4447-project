/**
 * HabitTracker – targets.tsx
 * Author: Ronan Fernando (2025/2026)
 *
 * What's original (own work):
 * Designing the targets management screen with add/delete functionality.
 * Dynamic colour logic for progress bars based on target completion.
 * Layout for target cards showing progress, remaining count, and met/unmet badges.
 * Implementing dark mode colours using ThemeContext.
 *
 * Adapted from:
 * IS4447 Lab workspace - base project structure, Drizzle ORM with SQLite — https://orm.drizzle.team/docs/select
 * react-native-progress npm package for progress bars — https://www.npmjs.com/package/react-native-progress
 * icons.expo.fyi (2026) MaterialCommunityIcons — https://icons.expo.fyi
 * Progress bar colour pattern adapted from own FYP project (EatBud).
 * React Context API for theme — https://react.dev/reference/react/createContext
 *
 * AI assistance (Claude, Anthropic, 2026):
 * Assisted with building the targets screen structure including
 * Drizzle ORM queries for calculating completed logs within weekly
 * and monthly date ranges, progress calculation against target values,
 * and form for creating new targets.
 * Dark mode integration with ThemeContext implemented by myself.
 *
 *
 *
 * I understand and can explain all code in this file.
 */

import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/db/client';
import { habitLogs as habitLogsTable, targets as targetsTable } from '@/db/schema';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { and, eq, gte, lte } from 'drizzle-orm';
import { useFocusEffect } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Progress from 'react-native-progress';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext, Category, Habit } from '../_layout';

type Target = {
  id: number;
  userId: number;
  habitId: number | null;
  period: string;
  targetValue: number;
  createdAt: string;
};

export default function TargetsScreen() {
  const context = useContext(AppContext);
  const [targetsList, setTargetsList] = useState<Target[]>([]);
  const [logCounts, setLogCounts] = useState<Record<string, number>>({});
  const { colors } = useTheme();

  // Form state
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
  const [period, setPeriod] = useState('weekly');
  const [targetValue, setTargetValue] = useState('3');
  const [showForm, setShowForm] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTargets();
    }, [context?.userId])
  );

  const loadTargets = async () => {
    if (!context?.userId) return;
    const rows = await db.select().from(targetsTable).where(eq(targetsTable.userId, context.userId));
    setTargetsList(rows);
    await loadLogCounts(rows);
  };

  const loadLogCounts = async (targets: Target[]) => {
    const counts: Record<string, number> = {};
    const now = new Date();

    for (const target of targets) {
      let startDate: string;

      if (target.period === 'weekly') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now);
        monday.setDate(diff);
        startDate = monday.toISOString().split('T')[0];
      } else {
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      }

      const endDate = now.toISOString().split('T')[0];

      let logs;
      if (target.habitId) {
        logs = await db
          .select()
          .from(habitLogsTable)
          .where(
            and(
              eq(habitLogsTable.habitId, target.habitId),
              gte(habitLogsTable.date, startDate),
              lte(habitLogsTable.date, endDate),
              eq(habitLogsTable.completed, 1)
            )
          );
      } else {
        logs = await db
          .select()
          .from(habitLogsTable)
          .where(
            and(
              gte(habitLogsTable.date, startDate),
              lte(habitLogsTable.date, endDate),
              eq(habitLogsTable.completed, 1)
            )
          );
      }

      counts[target.id.toString()] = logs.length;
    }

    setLogCounts(counts);
  };

  if (!context) return null;
  const { habits, categories, userId } = context;

  const saveTarget = async () => {
    if (!userId || !targetValue.trim()) return;

    await db.insert(targetsTable).values({
      userId,
      habitId: selectedHabitId,
      period,
      targetValue: parseInt(targetValue) || 1,
      createdAt: new Date().toISOString(),
    });

    await loadTargets();
    setShowForm(false);
    setSelectedHabitId(null);
    setPeriod('weekly');
    setTargetValue('3');
  };

  const deleteTarget = async (id: number) => {
    Alert.alert('Delete Target', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await db.delete(targetsTable).where(eq(targetsTable.id, id));
          await loadTargets();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Targets" subtitle="Track your goals" />

        {!showForm ? (
          <PrimaryButton label="Add Target" onPress={() => setShowForm(true)} />
        ) : (
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>New Target</Text>

            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Habit (optional - leave blank for all habits)</Text>
            <View style={styles.optionRow}>
              <Pressable
                accessibilityLabel="Target applies to all habits"
                accessibilityRole="button"
                onPress={() => setSelectedHabitId(null)}
                style={[styles.habitOption, selectedHabitId === null && styles.habitOptionSelected]}
              >
                <Text style={[styles.habitOptionText, selectedHabitId === null && styles.habitOptionTextSelected]}>
                  All Habits
                </Text>
              </Pressable>
              {habits.map((habit: Habit) => {
                const cat = categories.find((c: Category) => c.id === habit.categoryId);
                return (
                  <Pressable
                    key={habit.id}
                    accessibilityLabel={`Target for ${habit.name}`}
                    accessibilityRole="button"
                    onPress={() => setSelectedHabitId(habit.id)}
                    style={[styles.habitOption, selectedHabitId === habit.id && styles.habitOptionSelected]}
                  >
                    <Text style={[styles.habitOptionText, selectedHabitId === habit.id && styles.habitOptionTextSelected]}>
                      {habit.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Period</Text>
            <View style={styles.optionRow}>
              {['weekly', 'monthly'].map((p) => (
                <Pressable
                  key={p}
                  accessibilityLabel={`Set period to ${p}`}
                  accessibilityRole="button"
                  onPress={() => setPeriod(p)}
                  style={[styles.periodButton, period === p && styles.periodButtonSelected]}
                >
                  <Text style={[styles.periodText, period === p && styles.periodTextSelected]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <FormField label="Target (times)" value={targetValue} onChangeText={setTargetValue} placeholder="e.g. 5" />

            <PrimaryButton label="Save Target" onPress={saveTarget} />
            <View style={styles.cancelButton}>
              <PrimaryButton label="Cancel" variant="secondary" onPress={() => setShowForm(false)} />
            </View>
          </View>
        )}

        <View style={styles.targetsList}>
          {targetsList.length === 0 ? (
            <Text style={styles.emptyText}>No targets set yet.</Text>
          ) : (
            targetsList.map((target) => {
              const habit = target.habitId ? habits.find((h: Habit) => h.id === target.habitId) : null;
              const category = habit ? categories.find((c: Category) => c.id === habit.categoryId) : null;
              const current = logCounts[target.id.toString()] ?? 0;
              const progress = Math.min(current / target.targetValue, 1);
              const remaining = Math.max(target.targetValue - current, 0);
              const isMet = current >= target.targetValue;

              return (
                <View key={target.id} style={[styles.targetCard, { backgroundColor: colors.card, borderColor: colors.border }, isMet && styles.targetCardMet]}>
                  <View style={styles.targetHeader}>
                    <View style={[styles.iconBox, { backgroundColor: (category?.color ?? '#6B7280') + '20' }]}>
                      <MaterialCommunityIcons
                        name={habit ? (category?.icon as any) ?? 'star' : 'target'}
                        size={22}
                        color={category?.color ?? '#6B7280'}
                      />
                    </View>
                    <View style={styles.targetInfo}>
                      <Text style={[styles.targetName, { color: colors.text }]}>
                        {habit ? habit.name : 'All Habits'}
                      </Text>
                      <Text style={[styles.targetPeriod, { color: colors.textSecondary }]}>
                        {target.targetValue}x {target.period}
                      </Text>
                    </View>
                    {isMet ? (
                      <View style={styles.metBadge}>
                        <MaterialCommunityIcons name="check-circle" size={16} color="#059669" />
                        <Text style={styles.metText}>Met</Text>
                      </View>
                    ) : (
                      <Text style={styles.remainingText}>{remaining} to go</Text>
                    )}
                  </View>

                  <View style={styles.progressSection}>
                    <Progress.Bar
                      progress={progress}
                      width={null}
                      height={8}
                      borderRadius={4}
                      color={
                        progress >= 1.0 ? '#10B981' :
                        progress >= 0.5 ? '#F59E0B' :
                        progress > 0 ? '#EF4444' :
                        '#E5E7EB'
                      }
                      unfilledColor="#E5E7EB"
                      borderWidth={0}
                    />
                    <Text style={[styles.progressText, { color: colors.textSecondary }]}>{current} / {target.targetValue}</Text>
                  </View>

                  <Pressable
                    accessibilityLabel={`Delete target for ${habit ? habit.name : 'all habits'}`}
                    accessibilityRole="button"
                    onPress={() => deleteTarget(target.id)}
                    style={styles.deleteButton}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                  </Pressable>
                </View>
              );
            })
          )}
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
    marginBottom: 20,
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
    gap: 8,
    marginBottom: 16,
  },
  habitOption: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  habitOptionSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  habitOptionText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
  },
  habitOptionTextSelected: {
    color: '#FFFFFF',
  },
  periodButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  periodButtonSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  periodText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
  },
  periodTextSelected: {
    color: '#FFFFFF',
  },
  cancelButton: {
    marginTop: 10,
  },
  targetsList: {
    marginTop: 20,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  targetCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  targetCardMet: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  targetHeader: {
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
  targetInfo: {
    flex: 1,
  },
  targetName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  targetPeriod: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 2,
  },
  metBadge: {
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  remainingText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '600',
  },
  progressSection: {
    marginTop: 12,
  },
  progressText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  deleteButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    padding: 4,
  },
});