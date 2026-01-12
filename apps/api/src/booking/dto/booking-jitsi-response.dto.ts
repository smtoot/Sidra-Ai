/**
 * Response DTO for booking with Jitsi configuration
 */
export class BookingJitsiResponseDto {
  bookingId: string;
  meetingMethod: 'jitsi' | 'external';
  jitsiConfig?: {
    domain: string;
    roomName: string;
    jwt: string;
    userInfo: {
      displayName: string;
      email?: string;
    };
  };
  externalMeetingLink?: string;
  canJoin: boolean;
  message?: string;
}
