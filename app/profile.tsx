/**
 * HabitTracker – profile.tsx
 * Author: Ronan Fernando (2025/2026)
 *
 * What's original (own work):
 * Profile screen layout with logout and delete account.
 *
 * Adapted from:
 * Drizzle ORM for user queries — https://orm.drizzle.team/docs/delete
 * icons.expo.fyi (2026) MaterialCommunityIcons — https://icons.expo.fyi
 *
 * AI assistance (Claude, Anthropic, 2026):
 * Assisted with building profile screen with logout, delete account
 * with cascade delete of user data, and navigation back to login.
 *
 *
 * I understand and can explain all code in this file.
 */

import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/db/client';
import {
  categories as categoriesTable,
  habitLogs as habitLogsTable,
  habits as habitsTable,
  targets as targetsTable,
  users as usersTable,
} from '@/db/schema';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from './_layout';

export default function ProfileScreen() {
  const router = useRouter();
  const context = useContext(AppContext);
  const { colors } = useTheme();

  if (!context) return null;
  const { userId, setUserId, setHabits, setCategories } = context;

  const handleLogout = () => {
    setUserId(null);
    setHabits([]);
    setCategories([]);
    router.replace('/login');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!userId) return;

            const userHabits = await db
              .select()
              .from(habitsTable)
              .where(eq(habitsTable.userId, userId));

            for (const habit of userHabits) {
              await db.delete(habitLogsTable).where(eq(habitLogsTable.habitId, habit.id));
            }

            await db.delete(targetsTable).where(eq(targetsTable.userId, userId));
            await db.delete(habitsTable).where(eq(habitsTable.userId, userId));
            await db.delete(categoriesTable).where(eq(categoriesTable.userId, userId));
            await db.delete(usersTable).where(eq(usersTable.id, userId));

            setUserId(null);
            setHabits([]);
            setCategories([]);
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Profile" subtitle="Manage your account" />

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="account-circle" size={64} color={colors.primary} />
        <Text style={[styles.username, { color: colors.text }]}>Logged in</Text>
        <Text style={[styles.userId, { color: colors.textSecondary }]}>User ID: {userId}</Text>
      </View>

      <PrimaryButton label="Logout" variant="secondary" onPress={handleLogout} />

      <View style={styles.spacing}>
        <PrimaryButton label="Delete Account" variant="danger" onPress={handleDeleteAccount} />
      </View>

      <View style={styles.spacing}>
        <PrimaryButton label="Back" variant="secondary" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 18,
  },
  card: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    padding: 24,
  },
  username: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  userId: {
    fontSize: 13,
    marginTop: 4,
  },
  spacing: {
    marginTop: 12,
  },
});