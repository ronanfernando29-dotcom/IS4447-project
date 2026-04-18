import { db } from '../db/client';
import { seedDatabase } from '../db/seed';

jest.mock('../db/client', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

const mockDb = db as unknown as {
  select: jest.Mock;
  insert: jest.Mock;
};

describe('seedDatabase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts seed data when tables are empty', async () => {
    const mockValues = jest.fn().mockResolvedValue(undefined);
    const mockFrom = jest.fn().mockResolvedValue([]);

    mockDb.select.mockReturnValue({ from: mockFrom });
    mockDb.insert.mockReturnValue({ values: mockValues });

    await seedDatabase();

    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('does nothing when users already exist', async () => {
    const mockFrom = jest.fn().mockResolvedValue([
      { id: 1, username: 'demo', passwordHash: 'abc', createdAt: '2025-01-01' },
    ]);

    mockDb.select.mockReturnValue({ from: mockFrom });

    await seedDatabase();

    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});