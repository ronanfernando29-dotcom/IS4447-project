import { db } from './client';
import { categories, habitLogs, habits, targets, users } from './schema';

export async function seedDatabase() {
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) return;

  // demo user for testing
  await db.insert(users).values([
    { username: 'demo', passwordHash: 'password', createdAt: new Date().toISOString() },
  ]);

  // mockcategories
  await db.insert(categories).values([
    { userId: 1, name: 'Health', color: '#10B981', icon: 'heart-pulse' },
    { userId: 1, name: 'Fitness', color: '#3B82F6', icon: 'run' },
    { userId: 1, name: 'Productivity', color: '#F59E0B', icon: 'book-open-variant' },
    { userId: 1, name: 'Wellness', color: '#8B5CF6', icon: 'meditation' },
  ]);

  // mock habits
  await db.insert(habits).values([
    { userId: 1, categoryId: 1, name: 'Drink Water', frequency: 'daily', goalCount: 8, notes: '8 glasses per day', createdAt: new Date().toISOString() },
    { userId: 1, categoryId: 2, name: 'Go Running', frequency: 'daily', goalCount: 1, notes: 'At least 30 minutes', createdAt: new Date().toISOString() },
    { userId: 1, categoryId: 3, name: 'Read a Book', frequency: 'daily', goalCount: 1, notes: 'Read for 30 minutes', createdAt: new Date().toISOString() },
    { userId: 1, categoryId: 4, name: 'Meditate', frequency: 'daily', goalCount: 1, notes: '10 minutes of mindfulness', createdAt: new Date().toISOString() },
    { userId: 1, categoryId: 2, name: 'Workout', frequency: 'daily', goalCount: 1, notes: 'Gym or home workout', createdAt: new Date().toISOString() },
  ]);

  // Create habit logs for the past 14 days
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Drink Water - most days
    if (i % 2 === 0 || i < 5) {
      await db.insert(habitLogs).values({ habitId: 1, date: dateStr, count: Math.floor(Math.random() * 4) + 5, completed: 1 });
    }
    // Go Running - some days
    if (i % 3 === 0 || i < 3) {
      await db.insert(habitLogs).values({ habitId: 2, date: dateStr, count: 1, completed: 1 });
    }
    // Read a Book - most days
    if (i !== 5 && i !== 9) {
      await db.insert(habitLogs).values({ habitId: 3, date: dateStr, count: 1, completed: 1 });
    }
    // Meditate - about half the days
    if (i % 2 === 0) {
      await db.insert(habitLogs).values({ habitId: 4, date: dateStr, count: 1, completed: 1 });
    }
    // Workout - a few days
    if (i % 4 === 0) {
      await db.insert(habitLogs).values({ habitId: 5, date: dateStr, count: 1, completed: 1 });
    }
  }

  // Create targets
  await db.insert(targets).values([
    { userId: 1, habitId: 1, period: 'weekly', targetValue: 7, createdAt: new Date().toISOString() },
    { userId: 1, habitId: 2, period: 'weekly', targetValue: 3, createdAt: new Date().toISOString() },
    { userId: 1, habitId: 3, period: 'monthly', targetValue: 25, createdAt: new Date().toISOString() },
    { userId: 1, habitId: null, period: 'weekly', targetValue: 20, createdAt: new Date().toISOString() },
  ]);
}
