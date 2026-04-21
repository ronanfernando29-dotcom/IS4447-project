/**
 * HabitTracker – insights.tsx
 * Author: Ronan Fernando (2025/2026)
 *
 * What's original (own work):
 * Implementing weekly navigation with date arrows adapted from FYP (EatBud).
 * Dynamic colour logic for progress feedback based on completion rate.
 * Layout and styling decisions for chart cards.
 * Implementing dark mode colours using ThemeContext.
 *
 * Adapted from:
 * IS4447 Lab workspace - base project structure, Drizzle ORM with SQLite — https://orm.drizzle.team/docs/select
 * Weekly navigation pattern adapted from own FYP project (EatBud WeeklyReportScreen).
 * react-native-progress for progress bars — https://www.npmjs.com/package/react-native-progress
 * react-native-pie-chart for donut charts — https://www.npmjs.com/package/react-native-pie-chart
 * react-native-chart-kit for bar charts — https://www.npmjs.com/package/react-native-chart-kit
 * icons.expo.fyi (2026) MaterialCommunityIcons — https://icons.expo.fyi
 * React Context API for theme — https://react.dev/reference/react/createContext
 *
 * AI assistance (Claude, Anthropic, 2026):
 * Assisted with building the insights screen structure including bar chart
 * configuration, pie chart data formatting, streak calculation logic,
 * and Drizzle ORM queries for filtering habit logs by date range.
 * Handling TypeScript issues with react-native-pie-chart by adding @ts-ignore
 * and adjusting data format.
 * Dark mode integration with ThemeContext implemented by myself.
 *
 * 
 *
 * I understand and can explain all code in this file.
 */

import ScreenHeader from '@/components/ui/screen-header';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/db/client';
import { habitLogs as habitLogsTable } from '@/db/schema';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { and, eq, gte, lte } from 'drizzle-orm';
import { useFocusEffect } from 'expo-router';
import { useCallback, useContext, useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import PieChart from 'react-native-pie-chart';
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

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() + (day === 0 ? 0 : 7 - day);
  d.setDate(diff);
  d.setHours(23, 59, 59, 999);
  return d;
}

function addDays(date: Date, numberOfDays: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + numberOfDays);
  return result;
}

function formatDayLabel(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

export default function InsightsScreen() {
  const context = useContext(AppContext);
  const [weekAnchorDate, setWeekAnchorDate] = useState(() => new Date());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { colors } = useTheme();

  const weekFrom = useMemo(() => startOfWeek(weekAnchorDate), [weekAnchorDate]);
  const weekTo = useMemo(() => endOfWeek(weekAnchorDate), [weekAnchorDate]);
  const weekFromStr = weekFrom.toISOString().split('T')[0];
  const weekToStr = weekTo.toISOString().split('T')[0];

  const screenWidth = Dimensions.get('window').width - 36;

  const loadLogs = useCallback(async () => {
    const rows = await db
      .select()
      .from(habitLogsTable)
      .where(
        and(
          gte(habitLogsTable.date, weekFromStr),
          lte(habitLogsTable.date, weekToStr),
          eq(habitLogsTable.completed, 1)
        )
      );
    setLogs(rows);
  }, [weekFromStr, weekToStr]);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [loadLogs])
  );

  if (!context) return null;
  const { habits, categories } = context;

  // Daily completions for bar chart (Mon-Sun)
  const dailyCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (const log of logs) {
      const d = new Date(log.date);
      let dayIndex = d.getDay() - 1;
      if (dayIndex < 0) dayIndex = 6;
      counts[dayIndex]++;
    }
    return counts;
  }, [logs]);

  // Overall completion
  const totalPossible = habits.length * 7;
  const totalCompleted = logs.length;
  const completionRate = totalPossible > 0 ? totalCompleted / totalPossible : 0;

  // category breakdown for pie chart
  const categoryData = useMemo(() => {
    const countMap: Record<number, number> = {};
    for (const log of logs) {
      const habit = habits.find((h: Habit) => h.id === log.habitId);
      if (habit) {
        countMap[habit.categoryId] = (countMap[habit.categoryId] || 0) + 1;
      }
    }

    const data: { name: string; count: number; color: string }[] = [];
    for (const [catId, count] of Object.entries(countMap)) {
      const cat = categories.find((c: Category) => c.id === Number(catId));
      if (cat) {
        data.push({ name: cat.name, count, color: cat.color });
      }
    }

    return data;
  }, [logs, habits, categories]);

  const pieSeries = categoryData.length > 0
    ? categoryData.map((d) => ({ value: d.count, color: d.color }))
    : [{ value: 1, color: '#E5E7EB' }];

  // Streak calculation
  const streak = useMemo(() => {
    if (habits.length === 0) return 0;

    let currentStreak = 0;
    const today = new Date();
    const checkDate = new Date(today);

    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const completedToday = logs.filter((l) => l.date === dateStr).length;

      // For streak check all logs 
      // need to query per day but for simplicity use a broader approach
      if (i === 0 && completedToday === 0) {
        // Today not done yet, check from yesterday
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }

      if (completedToday > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return currentStreak;
  }, [logs, habits]);

  // Feedback message
  const feedbackMessage = completionRate >= 0.8
    ? 'Amazing consistency this week! Keep it up!'
    : completionRate >= 0.5
    ? "Good progress! Try to complete a few more habits next week"
    : completionRate > 0
    ? 'Room for improvement.. Focus on building consistency'
    : 'No habits completed this week. Start small!';

  const feedbackColor = completionRate >= 0.8
    ? '#10B981'
    : completionRate >= 0.5
    ? '#F59E0B'
    : '#EF4444';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Insights" subtitle="Your habit analytics" />

        {/* Week Navigation */}
        <View style={styles.weekBar}>
          <Pressable
            accessibilityLabel="Previous week"
            accessibilityRole="button"
            onPress={() => setWeekAnchorDate((d) => addDays(d, -7))}
            hitSlop={10}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
          </Pressable>

          <Pressable
            accessibilityLabel="Go to current week"
            accessibilityRole="button"
            onPress={() => setWeekAnchorDate(new Date())}
            hitSlop={10}
          >
            <Text style={[styles.weekText, { color: colors.text }]}>
              {formatDayLabel(weekFrom)} – {formatDayLabel(weekTo)}
            </Text>
          </Pressable>

          <Pressable
            accessibilityLabel="Next week"
            accessibilityRole="button"
            onPress={() => setWeekAnchorDate((d) => addDays(d, 7))}
            hitSlop={10}
          >
            <MaterialCommunityIcons name="chevron-right" size={28} color={colors.text} />
          </Pressable>
        </View>

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <MaterialCommunityIcons name="fire" size={32} color="#F59E0B" />
          <View style={styles.streakInfo}>
            <Text style={styles.streakNumber}>{streak} Day Streak</Text>
            <Text style={styles.streakLabel}>
              {streak > 0 ? 'Keep the streak alive!' : 'Complete a habit to start your streak!'}
            </Text>
          </View>
        </View>

        {/* Overall Completion Donut */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Completion</Text>
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.pieWrapper}>
            {/* @ts-ignore */}
            <PieChart
              widthAndHeight={180}
              series={totalCompleted > 0
                ? [
                    { value: totalCompleted, color: feedbackColor },
                    { value: Math.max(totalPossible - totalCompleted, 0), color: '#E5E7EB' },
                  ]
                : [
                    { value: 0, color: '#E5E7EB' },
                    { value: 1, color: '#E5E7EB' },
                  ]
              }
              coverRadius={0.7}
              coverFill={'#FFFFFF'}
            />
            <View style={styles.pieCenter}>
              <Text style={[styles.piePercentage, { color: feedbackColor }]}>
                {Math.round(completionRate * 100)}%
              </Text>
              <Text style={styles.pieLabel}>completed</Text>
            </View>
          </View>

          <Text style={[styles.completionText, { color: colors.text }]}>
            {totalCompleted} of {totalPossible} habits completed
          </Text>

          <View style={styles.progressRow}>
            <Progress.Bar
              progress={completionRate}
              width={null}
              height={8}
              borderRadius={4}
              color={feedbackColor}
              unfilledColor="#E5E7EB"
              borderWidth={0}
            />
          </View>

          <Text style={[styles.feedbackText, { color: feedbackColor }]}>
            {feedbackMessage}
          </Text>
        </View>

        {/* Daily Bar Chart */}
        <Text style={styles.sectionTitle}>Daily Completions</Text>
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* @ts-ignore */}
          <BarChart
            data={{
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              datasets: [{ data: dailyCounts }],
            }}
            width={screenWidth - 32}
            height={200}
            fromZero
            yAxisLabel=""
            yAxisSuffix=""
            formatYLabel={(value: any) => Math.round(Number(value)).toString()}
            chartConfig={{
              backgroundColor: colors.card,
              backgroundGradientFrom: colors.card,
              backgroundGradientTo: colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              labelColor: () => colors.textSecondary,
              barPercentage: 0.6,
              propsForBackgroundLines: {
                stroke: '#F1F5F9',
              },
            }}
            style={styles.barChart}
          />
        </View>

        {/* Category Breakdown Pie */}
        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.pieWrapper}>
            {/* @ts-ignore */}
            <PieChart
              widthAndHeight={180}
              series={pieSeries}
              coverRadius={0.65}
              coverFill={colors.card}
            />
          </View>

          {categoryData.length > 0 ? (
            <View style={styles.legendContainer}>
              {categoryData.map((item) => (
                <View key={item.name} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendText, { color: colors.text }]}>
                    {item.name}: {item.count}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No data for this week</Text>
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
  weekBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
  },
  weekText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  streakCard: {
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    padding: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    color: '#92400E',
    fontSize: 20,
    fontWeight: '700',
  },
  streakLabel: {
    color: '#B45309',
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    padding: 16,
  },
  pieWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pieCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  piePercentage: {
    fontSize: 28,
    fontWeight: '700',
  },
  pieLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  completionText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  progressRow: {
    marginTop: 10,
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  barChart: {
    borderRadius: 10,
    marginLeft: -16,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginTop: 16,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  legendDot: {
    borderRadius: 999,
    height: 12,
    width: 12,
  },
  legendText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});