import InfoTag from '@/components/ui/info-tag';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { habits as habitsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext, Category, Habit } from '../_layout';

export default function HabitDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(AppContext);

  if (!context) return null;

  const { habits, categories, setHabits, userId } = context;
  const habit = habits.find((h: Habit) => h.id === Number(id));
  const category = categories.find((c: Category) => c.id === habit?.categoryId);

  if (!habit) return null;

  const deleteHabit = async () => {
    await db.delete(habitsTable).where(eq(habitsTable.id, Number(id)));
    if (userId) {
      const rows = await db.select().from(habitsTable).where(eq(habitsTable.userId, userId));
      setHabits(rows);
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title={habit.name} subtitle={category ? `${category.icon} ${category.name}` : 'Habit details'} />

      <View style={styles.tags}>
        <InfoTag label="Category" value={category?.name ?? 'None'} />
        <InfoTag label="Frequency" value={habit.frequency} />
        <InfoTag label="Goal" value={`${habit.goalCount}x`} />
      </View>

      {habit.notes ? (
        <View style={styles.notesBox}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{habit.notes}</Text>
        </View>
      ) : null}

      <PrimaryButton
        label="Edit"
        onPress={() =>
          router.push({
            pathname: '../habit/[id]/edit',
            params: { id },
          })
        }
      />

      <View style={styles.buttonSpacing}>
        <PrimaryButton
          label="Delete"
          variant="danger"
          onPress={deleteHabit}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 20,
  },
  notesBox: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
    padding: 14,
  },
  notesLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    color: '#111827',
    fontSize: 15,
  },
  buttonSpacing: {
    marginTop: 12,
  },
});