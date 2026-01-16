import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';

export enum MeetingEventType {
  PARTICIPANT_JOINED = 'PARTICIPANT_JOINED',
  PARTICIPANT_LEFT = 'PARTICIPANT_LEFT',
  MEETING_STARTED = 'MEETING_STARTED',
  MEETING_ENDED = 'MEETING_ENDED',
}

export class LogMeetingEventDto {
  @IsEnum(MeetingEventType, {
    message: 'eventType must be one of: PARTICIPANT_JOINED, PARTICIPANT_LEFT, MEETING_STARTED, MEETING_ENDED',
  })
  eventType!: MeetingEventType;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>; // For device info, browser, etc.
}

export interface MeetingEventResponse {
  id: string;
  bookingId: string;
  userId: string;
  userName: string;
  userRole: string;
  eventType: MeetingEventType;
  metadata?: Record<string, any>;
  createdAt: Date;
}
