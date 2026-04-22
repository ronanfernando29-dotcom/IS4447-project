/**
 * HabitTracker – NotificationSetup.tsx
 * Author: Ronan Fernando (2025/2026)
 *
 * What's original (own work):
 * Notification toggle UI and scheduling logic.
 * Adapted notification pattern from own FYP project (EatBud reminders.js).
 *
 * Adapted from:
 * Own FYP project (EatBud) - notification scheduling pattern with expo-notifications.
 * expo-notifications for local scheduled reminders — https://docs.expo.dev/versions/latest/sdk/notifications/
 * React Native Platform API — https://reactnative.dev/docs/platform
 * icons.expo.fyi (2026) MaterialCommunityIcons — https://icons.expo.fyi
 *
 * AI assistance (Claude, Anthropic, 2026):
 * Assisted with adapting FYP notification code for habit tracker,
 * switching from one-off date triggers to daily recurring triggers,
 * and building the toggle UI component.
 *
 *
 * I understand and can explain all code in this file.
 */

import { useTheme } from '@/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function NotificationSetup() {
  const { colors } = useTheme();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    checkExistingNotifications();
  }, []);

  const checkExistingNotifications = async () => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    setEnabled(scheduled.length > 0);
  };

  const enableReminders = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please enable notifications in your device settings.');
      return;
    }

    // Cancel any existing ones first
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule daily reminder at 9 AM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'HabitBud Reminder',
        body: "Don't forget to log your habits today!",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
      },
    });

    // Schedule evening reminder at 8 PM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'HabitBud Evening Check',
        body: 'Have you completed all your habits today?',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
      },
    });

    // Test notification ( 5 seconds)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'HabitBud Reminder',
        body: "Don't forget to log your habits today!",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
      },
    });
    
    setEnabled(true);
    Alert.alert('Reminders Set', 'You will get daily reminders at 9 AM and 8 PM.');
  };

  const disableReminders = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setEnabled(false);
    Alert.alert('Reminders Off', 'Daily reminders have been turned off.');
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.row}>
        <MaterialCommunityIcons name="bell-outline" size={24} color={colors.primary} />
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]}>Daily Reminders</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {enabled ? 'Reminders at 9 AM & 8 PM' : 'Get reminded to log habits'}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={enabled ? 'Disable reminders' : 'Enable reminders'}
          accessibilityRole="button"
          onPress={enabled ? disableReminders : enableReminders}
          style={[styles.toggle, enabled && styles.toggleEnabled]}
        >
          <View style={[styles.toggleCircle, enabled && styles.toggleCircleEnabled]} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  toggle: {
    backgroundColor: '#D1D5DB',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    paddingHorizontal: 2,
    width: 50,
  },
  toggleEnabled: {
    backgroundColor: '#10B981',
  },
  toggleCircle: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    height: 26,
    width: 26,
  },
  toggleCircleEnabled: {
    alignSelf: 'flex-end',
  },
});