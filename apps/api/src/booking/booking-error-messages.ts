export const BookingErrorMessages = {
  BOOKING_NOT_FOUND: 'Booking not found',
  NOT_YOUR_BOOKING: 'Not your booking',

  BOOKING_NOT_PENDING: 'Booking is not pending',
  BOOKING_NOT_SCHEDULED: 'Booking is not scheduled',
  BOOKING_NOT_AWAITING_PAYMENT: 'Booking is not awaiting payment',

  INVALID_REQUEST_BODY: 'Invalid request body',
  END_TIME_AFTER_START: 'End time must be after start time',

  INVALID_MEETING_LINK_FORMAT_AR: 'صيغة رابط الاجتماع غير صحيحة.',
  INVALID_MEETING_LINK_FORMAT_EN: 'Invalid meeting link URL format',
} as const;
