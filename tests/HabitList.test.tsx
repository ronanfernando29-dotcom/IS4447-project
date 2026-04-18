import { render, waitFor } from '@testing-library/react-native';
import IndexScreen from '../app/(tabs)/index';
import { AppContext } from '../app/_layout';

jest.mock('@/db/client', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
  sqlite: {},
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock('expo-drizzle-studio-plugin', () => ({
  useDrizzleStudio: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

const mockCategory = {
  id: 1,
  userId: 1,
  name: 'Health',
  color: '#10B981',
  icon: '💪',
};

const mockHabit = {
  id: 1,
  userId: 1,
  categoryId: 1,
  name: 'Drink Water',
  frequency: 'daily',
  goalCount: 8,
  notes: '8 glasses per day',
  createdAt: '2025-01-01',
};

describe('IndexScreen', () => {
  it('renders the habit and the add button', async () => {
    const { getByText } = render(
      <AppContext.Provider
        value={{
          habits: [mockHabit],
          setHabits: jest.fn(),
          categories: [mockCategory],
          setCategories: jest.fn(),
          userId: 1,
          setUserId: jest.fn(),
        }}
      >
        <IndexScreen />
      </AppContext.Provider>
    );

    await waitFor(() => {
      expect(getByText('Drink Water')).toBeTruthy();
      expect(getByText('Add Habit')).toBeTruthy();
    });
  });
});