import { Test } from '@nestjs/testing';
import { BookingStatusValidatorService } from '../booking-status-validator.service';

describe('BookingStatusValidatorService', () => {
  let service: BookingStatusValidatorService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [BookingStatusValidatorService],
    }).compile();

    service = moduleRef.get(BookingStatusValidatorService);
  });

  it('allows valid transitions', () => {
    expect(() =>
      service.validateTransition('PENDING_TEACHER_APPROVAL', 'SCHEDULED'),
    ).not.toThrow();
  });

  it('rejects invalid transitions', () => {
    expect(() =>
      service.validateTransition('COMPLETED', 'SCHEDULED'),
    ).toThrow();
  });

  it('can allow same-status transitions when configured', () => {
    expect(() =>
      service.validateTransition('WAITING_FOR_PAYMENT', 'WAITING_FOR_PAYMENT', {
        allowSameStatus: true,
      }),
    ).not.toThrow();
  });
});
