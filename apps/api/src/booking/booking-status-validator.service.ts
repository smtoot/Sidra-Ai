import { BadRequestException, Injectable } from '@nestjs/common';
import {
  getAllowedTransitions,
  isValidStatusTransition,
} from './booking-policy.constants';

type ValidateTransitionOptions = {
  allowSameStatus?: boolean;
};

@Injectable()
export class BookingStatusValidatorService {
  validateTransition(
    currentStatus: string,
    newStatus: string,
    options: ValidateTransitionOptions = {},
  ): void {
    if (options.allowSameStatus && currentStatus === newStatus) {
      return;
    }

    if (!isValidStatusTransition(currentStatus, newStatus)) {
      const allowed = getAllowedTransitions(currentStatus);
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }
  }
}
