import { ThemeProvider } from '@/context/ThemeContext';
import { db } from '@/db/client';
import { categories as categoriesTable, habits as habitsTable } from '@/db/schema';
import { seedDatabase } from '@/db/seed';
import { eq } from 'drizzle-orm';
import { Stack } from 'expo-router';
import { createContext, useEffect, useState } from 'react';

export type Category = {
  id: number;
  userId: number;
  name: string;
  color: string;
  icon: string;
};

export type Habit = {
  id: number;
  userId: number;
  categoryId: number;
  name: string;
  frequency: string;
  goalCount: number;
  notes: string | null;
  createdAt: string;
};

type AppContextType = {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  userId: number | null;
  setUserId: React.Dispatch<React.SetStateAction<number | null>>;
};

export const AppContext = createContext<AppContextType | null>(null);

export default function RootLayout() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userId, setUserId] = useState<number | null>(1);

  useEffect(() => {
    const init = async () => {
      await seedDatabase();
      if (!userId) return;
      const habitRows = await db.select().from(habitsTable).where(eq(habitsTable.userId, userId));
      setHabits(habitRows);
      const catRows = await db.select().from(categoriesTable).where(eq(categoriesTable.userId, userId));
      setCategories(catRows);
    };
    void init();
  }, [userId]);

  return (
    <ThemeProvider>
      <AppContext.Provider value={{ habits, setHabits, categories, setCategories, userId, setUserId }}>
        <Stack screenOptions={{ headerShown: false }} />
      </AppContext.Provider>
    </ThemeProvider>
  );
}