import { Habit, Category, AppContext } from '@/app/_layout';
import InfoTag from '@/components/ui/info-tag';
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  habit: Habit;
};

export default function HabitCard({ habit }: Props) {
  const router = useRouter();
  const context = useContext(AppContext);

  const category = context?.categories.find(
    (c: Category) => c.id === habit.categoryId
  );

  const openDetails = () =>
    router.push({
      pathname: '/habit/[id]',
      params: { id: habit.id.toString() },
    });

  const habitSummary = `${habit.name}, ${category?.name ?? 'Uncategorised'}, ${habit.frequency}`;

  return (
    <Pressable
      accessibilityLabel={`${habitSummary}, view details`}
      accessibilityRole="button"
      onPress={openDetails}
      style={({ pressed }) => [
        styles.card,
        pressed ? styles.cardPressed : null,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>{category?.icon ?? '📌'}</Text>
        <View style={styles.headerText}>
          <Text style={styles.name}>{habit.name}</Text>
          {habit.notes ? (
            <Text style={styles.notes} numberOfLines={1}>{habit.notes}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.tags}>
        <InfoTag label="Category" value={category?.name ?? 'None'} />
        <InfoTag label="Goal" value={`${habit.goalCount}x ${habit.frequency}`} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  cardPressed: {
    opacity: 0.88,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  name: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  notes: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
});
