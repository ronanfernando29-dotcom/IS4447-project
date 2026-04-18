import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { habits as habitsTable } from '@/db/schema';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext, Category, Habit } from '../../_layout';

export default function EditHabit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(AppContext);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [goalCount, setGoalCount] = useState('1');
  const [frequency, setFrequency] = useState('daily');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const habit = context?.habits.find(
    (h: Habit) => h.id === Number(id)
  );

  useEffect(() => {
    if (!habit) return;
    setName(habit.name);
    setNotes(habit.notes ?? '');
    setGoalCount(String(habit.goalCount));
    setFrequency(habit.frequency);
    setSelectedCategoryId(habit.categoryId);
  }, [habit]);

  if (!context || !habit) return null;

  const { categories, setHabits, userId } = context;

  const saveChanges = async () => {
    if (!name.trim() || !selectedCategoryId) return;

    await db
      .update(habitsTable)
      .set({
        name: name.trim(),
        notes: notes.trim() || null,
        goalCount: parseInt(goalCount) || 1,
        frequency,
        categoryId: selectedCategoryId,
      })
      .where(eq(habitsTable.id, Number(id)));

    if (userId) {
      const rows = await db.select().from(habitsTable).where(eq(habitsTable.userId, userId));
      setHabits(rows);
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Edit Habit" subtitle={`Update ${habit.name}`} />
        <View style={styles.form}>
          <FormField label="Habit Name" value={name} onChangeText={setName} />
          <FormField label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional description" />
          <FormField label="Goal Count" value={goalCount} onChangeText={setGoalCount} />

          <Text style={styles.sectionLabel}>Frequency</Text>
          <View style={styles.optionRow}>
            {['daily', 'weekly'].map((freq) => (
              <Pressable
                key={freq}
                accessibilityLabel={`Set frequency to ${freq}`}
                accessibilityRole="button"
                onPress={() => setFrequency(freq)}
                style={[styles.optionButton, frequency === freq && styles.optionButtonSelected]}
              >
                <Text style={[styles.optionText, frequency === freq && styles.optionTextSelected]}>
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.optionRow}>
            {categories.map((cat: Category) => (
              <Pressable
                key={cat.id}
                accessibilityLabel={`Select category ${cat.name}`}
                accessibilityRole="button"
                onPress={() => setSelectedCategoryId(cat.id)}
                style={[
                  styles.categoryButton,
                  { borderColor: cat.color },
                  selectedCategoryId === cat.id && { backgroundColor: cat.color },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialCommunityIcons
                      name={(cat.icon as any)}
                      size={18}
                      color={selectedCategoryId === cat.id ? '#FFFFFF' : cat.color}
                    />
                    <Text style={[
                      styles.categoryText,
                      { color: cat.color },
                      selectedCategoryId === cat.id && { color: '#FFFFFF' },
                    ]}>
                      {cat.name}
                    </Text>
                  </View>
              </Pressable>
            ))}
          </View>
        </View>

        <PrimaryButton label="Save Changes" onPress={saveChanges} />
        <View style={styles.buttonSpacing}>
          <PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F8FAFC',
    flex: 1,
    padding: 20,
  },
  content: {
    paddingBottom: 24,
  },
  form: {
    marginBottom: 6,
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
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  optionButtonSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  optionText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  categoryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonSpacing: {
    marginTop: 10,
  },
});