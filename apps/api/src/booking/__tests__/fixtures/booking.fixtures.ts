export type TestBooking = {
  id: string;
  status: string;
  bookedByUserId: string;
  teacherId: string;
  startTime: Date;
  endTime: Date;
  price: number;
  readableId?: string | null;
};

export function createTestBooking(
  overrides: Partial<TestBooking> = {},
): TestBooking {
  const startTime = new Date(Date.now() + 60 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

  return {
    id: 'booking-1',
    status: 'PENDING_TEACHER_APPROVAL',
    bookedByUserId: 'user-1',
    teacherId: 'teacher-1',
    startTime,
    endTime,
    price: 100,
    readableId: 'BK-TEST-0001',
    ...overrides,
  };
}
