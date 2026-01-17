export type TestUser = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  role?: string;
};

export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: 'user-1',
    firstName: 'Test',
    lastName: 'User',
    displayName: 'Test User',
    role: 'PARENT',
    ...overrides,
  };
}
