import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { FeatureFlagService } from '../feature-flag/feature-flag.service';

export interface JitsiUserInfo {
  id: string;
  email?: string;
  displayName: string;
  role: 'teacher' | 'student' | 'parent';
}

export interface JitsiConfig {
  domain: string;
  roomName: string;
  jwt: string;
  userInfo: JitsiUserInfo;
  configOverwrite?: Record<string, any>;
  interfaceConfigOverwrite?: Record<string, any>;
}

export interface JitsiTokenPayload {
  aud: string;
  iss: string;
  sub: string;
  room: string;
  exp: number;
  context: {
    user: {
      id: string;
      name: string;
      email?: string;
      avatar?: string;
      moderator?: boolean;
    };
  };
}

@Injectable()
export class JitsiService {
  private readonly logger = new Logger(JitsiService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  /**
   * Generate a JWT token for Jitsi authentication
   */
  generateJitsiToken(
    roomName: string,
    userInfo: JitsiUserInfo,
    expiryHours: number = 24,
  ): string {
    const appId =
      this.configService.get<string>('JITSI_APP_ID_STAGING') ||
      this.configService.get<string>('JITSI_APP_ID_PRODUCTION');
    const appSecret =
      this.configService.get<string>('JITSI_APP_SECRET_STAGING') ||
      this.configService.get<string>('JITSI_APP_SECRET_PRODUCTION');

    if (!appId || !appSecret) {
      this.logger.error('Jitsi configuration missing: APP_ID or APP_SECRET');
      throw new BadRequestException('Jitsi is not properly configured');
    }

    const now = Math.floor(Date.now() / 1000);
    const exp = now + expiryHours * 60 * 60; // Convert hours to seconds

    const payload: JitsiTokenPayload = {
      aud: appId,
      iss: appId,
      sub: this.getJitsiDomain(),
      room: roomName,
      exp,
      context: {
        user: {
          id: userInfo.id,
          name: userInfo.displayName,
          email: userInfo.email,
          moderator: userInfo.role === 'teacher', // Teachers are moderators
        },
      },
    };

    try {
      const token = jwt.sign(payload, appSecret, { algorithm: 'HS256' });
      this.logger.log(
        `Generated Jitsi token for user ${userInfo.id} in room ${roomName}`,
      );
      return token;
    } catch (error) {
      this.logger.error(
        `Failed to generate Jitsi token: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to generate meeting token');
    }
  }

  /**
   * Get Jitsi domain from environment
   */
  private getJitsiDomain(): string {
    return (
      this.configService.get<string>('JITSI_DOMAIN') || 'meet-staging.sidra.sd'
    );
  }

  /**
   * Generate a unique room name for a booking
   */
  generateRoomName(bookingId: string): string {
    // Format: sidra_booking_{bookingId}
    // Remove hyphens to make it cleaner
    const cleanId = bookingId.replace(/-/g, '');
    return `sidra_booking_${cleanId}`;
  }

  /**
   * Get Jitsi configuration for a booking
   */
  async getJitsiConfigForBooking(
    bookingId: string,
    userId: string,
  ): Promise<{
    bookingId: string;
    meetingMethod: 'jitsi' | 'external';
    jitsiConfig?: JitsiConfig;
    externalMeetingLink?: string;
    canJoin: boolean;
    message?: string;
    accessibleAt?: Date;
  }> {
    // Check if Jitsi is globally enabled
    if (!this.featureFlagService.isJitsiEnabled()) {
      this.logger.debug('Jitsi is globally disabled');
      // Fall back to external meeting link
      const booking = await this.prisma.bookings.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new BadRequestException('Booking not found');
      }

      return {
        bookingId,
        meetingMethod: 'external',
        externalMeetingLink: booking.meetingLink || undefined,
        canJoin: !!booking.meetingLink,
        message: booking.meetingLink
          ? 'External meeting link available'
          : 'No meeting link available yet',
      };
    }

    // Fetch booking with user relationships
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        teacher_profiles: {
          include: {
            users: true,
          },
        },
        users_bookings_bookedByUserIdTousers: true,
        users_bookings_studentUserIdTousers: true,
        children: true,
      },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    // Verify user has access to this booking
    const isTeacher =
      booking.teacherId === booking.teacher_profiles.id &&
      booking.teacher_profiles.userId === userId;
    const isBooker = booking.bookedByUserId === userId;
    const isStudent = booking.studentUserId === userId;

    if (!isTeacher && !isBooker && !isStudent) {
      throw new UnauthorizedException('You do not have access to this booking');
    }

    // Check if booking uses external meeting link
    if (booking.useExternalMeetingLink || !booking.jitsiEnabled) {
      return {
        bookingId,
        meetingMethod: 'external',
        externalMeetingLink: booking.meetingLink || undefined,
        canJoin: !!booking.meetingLink,
        message: booking.meetingLink
          ? 'External meeting link available'
          : 'No meeting link available yet',
      };
    }

    // Check if user can join based on time
    const canJoinResult = await this.canJoinMeeting(booking);

    if (!canJoinResult.canJoin) {
      return {
        bookingId,
        meetingMethod: 'jitsi',
        canJoin: false,
        message: canJoinResult.message,
        accessibleAt: canJoinResult.accessibleAt,
      };
    }

    // Generate user info for JWT
    const userInfo = await this.getUserInfo(userId, booking);

    // Generate JWT token
    const roomName = booking.jitsiRoomId || this.generateRoomName(bookingId);
    const token = this.generateJitsiToken(roomName, userInfo);

    // Build Jitsi config
    const jitsiConfig: JitsiConfig = {
      domain: this.getJitsiDomain(),
      roomName,
      jwt: token,
      userInfo,
      configOverwrite: {
        startWithAudioMuted: userInfo.role !== 'teacher', // Only teachers start unmuted
        startWithVideoMuted: false,
        enableWelcomePage: false,
        prejoinPageEnabled: true,
        enableClosePage: false,
        defaultLanguage: 'en',
        disableDeepLinking: true,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DEFAULT_BACKGROUND: '#1a1a1a',
        TOOLBAR_BUTTONS: [
          'microphone',
          'camera',
          'closedcaptions',
          'desktop',
          'fullscreen',
          'fodeviceselection',
          'hangup',
          'profile',
          'chat',
          'recording',
          'livestreaming',
          'etherpad',
          'sharedvideo',
          'settings',
          'raisehand',
          'videoquality',
          'filmstrip',
          'feedback',
          'stats',
          'shortcuts',
          'tileview',
          'download',
          'help',
          'mute-everyone',
        ],
      },
    };

    return {
      bookingId,
      meetingMethod: 'jitsi',
      jitsiConfig,
      canJoin: true,
      message: 'Jitsi meeting is ready to join',
    };
  }

  /**
   * Check if user can join the meeting based on time
   */
  private async canJoinMeeting(booking: any): Promise<{
    canJoin: boolean;
    message?: string;
    accessibleAt?: Date;
  }> {
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);

    // Get system settings for access window
    const settings = await this.prisma.system_settings.findUnique({
      where: { id: 'default' },
    });

    const accessMinutes = settings?.meetingLinkAccessMinutesBefore || 15;
    const accessTime = new Date(
      startTime.getTime() - accessMinutes * 60 * 1000,
    );

    // Check if too early
    if (now < accessTime) {
      const minutesUntilAccess = Math.ceil(
        (accessTime.getTime() - now.getTime()) / (60 * 1000),
      );
      return {
        canJoin: false,
        message: `Meeting will be accessible ${minutesUntilAccess} minute(s) before the scheduled start time`,
        accessibleAt: accessTime,
      };
    }

    // Check if too late (meeting ended)
    if (now > endTime) {
      return {
        canJoin: false,
        message: 'This meeting has ended',
      };
    }

    // Check booking status
    if (booking.status !== 'SCHEDULED' && booking.status !== 'COMPLETED') {
      return {
        canJoin: false,
        message: `Cannot join meeting. Booking status: ${booking.status}`,
      };
    }

    return {
      canJoin: true,
    };
  }

  /**
   * Get user information for Jitsi JWT
   */
  private async getUserInfo(
    userId: string,
    booking: any,
  ): Promise<JitsiUserInfo> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        teacher_profiles: true,
        student_profiles: true,
        parent_profiles: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    let displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (!displayName) {
      displayName = user.email.split('@')[0];
    }

    let role: 'teacher' | 'student' | 'parent';
    if (user.role === 'TEACHER') {
      role = 'teacher';
    } else if (user.role === 'STUDENT') {
      role = 'student';
    } else {
      role = 'parent';
    }

    return {
      id: user.id,
      email: user.email,
      displayName,
      role,
    };
  }

  /**
   * Update booking to use Jitsi or external link
   */
  async toggleJitsiForBooking(
    bookingId: string,
    useExternal: boolean,
    teacherUserId: string,
  ): Promise<void> {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        teacher_profiles: true,
      },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    // Check if the user is the teacher for this booking
    if (booking.teacher_profiles?.userId !== teacherUserId) {
      throw new UnauthorizedException(
        'Only the teacher can change the meeting method',
      );
    }

    await this.prisma.bookings.update({
      where: { id: bookingId },
      data: {
        useExternalMeetingLink: useExternal,
        // If switching to Jitsi and no room ID exists, generate one
        ...(!useExternal &&
          !booking.jitsiRoomId && {
            jitsiRoomId: this.generateRoomName(bookingId),
            jitsiEnabled: true,
          }),
      },
    });

    this.logger.log(
      `Booking ${bookingId} meeting method changed to ${useExternal ? 'external' : 'jitsi'}`,
    );
  }
}
