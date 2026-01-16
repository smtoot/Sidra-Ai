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
  nbf?: number; // Not before timestamp
  context: {
    user: {
      id: string;
      name: string;
      email?: string;
      avatar?: string;
      moderator?: boolean;
      affiliation?: 'owner' | 'member';
      features?: {
        'screen-sharing'?: string | boolean;
        recording?: string | boolean;
        [key: string]: any;
      };
    };
    // P0-2: Include booking metadata for validation
    booking?: {
      id: string;
      tokenVersion: number;
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
  /**
   * Helper: Get Jitsi settings from Database or Fallback to defaults
   */
  private async getJitsiSettings() {
    const settings = await this.prisma.system_settings.findUnique({
      where: { id: 'default' },
    });

    // Default Jitsi Config Structure
    const jitsiConfig = (settings?.jitsiConfig as any) || {};

    return {
      appId:
        jitsiConfig.appId ||
        this.configService.get<string>('JITSI_APP_ID_STAGING') ||
        this.configService.get<string>('JITSI_APP_ID_PRODUCTION'),
      appSecret:
        jitsiConfig.appSecret ||
        this.configService.get<string>('JITSI_APP_SECRET_STAGING') ||
        this.configService.get<string>('JITSI_APP_SECRET_PRODUCTION'),
      domain:
        jitsiConfig.domain ||
        this.configService.get<string>('JITSI_DOMAIN') ||
        'meet-staging.sidra.sd',
      xmppDomain:
        jitsiConfig.xmppDomain ||
        this.configService.get<string>('JITSI_XMPP_DOMAIN') ||
        'meet.jitsi',
      // Feature Flags
      startAudioMuted: jitsiConfig.startAudioMuted ?? false,
      startVideoMuted: jitsiConfig.startVideoMuted ?? false,
      enableChat: jitsiConfig.enableChat ?? true,
      enableScreenSharing: jitsiConfig.enableScreenSharing ?? true,
      enableRecording: jitsiConfig.enableRecording ?? false,
      // Toolbar Config
      teacherToolbarButtons:
        (jitsiConfig.teacherToolbarButtons as string[]) || null,
      studentToolbarButtons:
        (jitsiConfig.studentToolbarButtons as string[]) || null,
    };
  }

  /**
   * Generate a JWT token for Jitsi authentication
   *
   * P0-1 SECURITY FIX: Token expiry is now session-bound instead of 24 hours
   * P0-2 SECURITY FIX: Token includes booking metadata for invalidation support
   *
   * @param roomName - The Jitsi room name
   * @param userInfo - User information for the JWT context
   * @param sessionEndTime - Session end time (token expires 30 min after this)
   * @param bookingInfo - Optional booking metadata for token invalidation
   */
  async generateJitsiToken(
    roomName: string,
    userInfo: JitsiUserInfo,
    sessionEndTime: Date,
    bookingInfo?: { id: string; tokenVersion: number },
  ): Promise<string> {
    const config = await this.getJitsiSettings();

    if (!config.appId || !config.appSecret) {
      this.logger.error('Jitsi configuration missing: APP_ID or APP_SECRET');
      throw new BadRequestException('Jitsi is not properly configured');
    }

    const now = Math.floor(Date.now() / 1000);

    // P0-1 SECURITY FIX: Token expires 30 minutes after session end time
    // This allows buffer for sessions that run slightly over, but prevents
    // long-lived tokens that could be used after booking cancellation
    const SESSION_BUFFER_MINUTES = 30;
    const sessionEndTimestamp = Math.floor(sessionEndTime.getTime() / 1000);
    const exp = sessionEndTimestamp + SESSION_BUFFER_MINUTES * 60;

    // Ensure token is valid for at least 1 hour from now (minimum validity)
    const minExp = now + 60 * 60; // 1 hour minimum
    const finalExp = Math.max(exp, minExp);

    const payload: JitsiTokenPayload = {
      aud: config.appId,
      iss: config.appId,
      sub: config.xmppDomain,
      room: roomName,
      exp: finalExp,
      nbf: now, // Token not valid before now
      context: {
        user: {
          id: userInfo.id,
          name: userInfo.displayName,
          moderator: userInfo.role === 'teacher',
          affiliation: userInfo.role === 'teacher' ? 'owner' : 'member',
          features: {
            'screen-sharing': config.enableScreenSharing ? 'true' : 'false',
            recording: config.enableRecording ? 'true' : 'false',
          } as any,
        },
        // P0-2: Include booking metadata in token for audit/validation
        ...(bookingInfo && {
          booking: {
            id: bookingInfo.id,
            tokenVersion: bookingInfo.tokenVersion,
          },
        }),
      },
    };

    try {
      const token = jwt.sign(payload, config.appSecret, { algorithm: 'HS256' });
      this.logger.log(
        `Generated Jitsi token for user ${userInfo.id} in room ${roomName} (expires: ${new Date(finalExp * 1000).toISOString()})`,
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

  // Removed getJitsiDomain as it's now handled in getJitsiSettings

  /**
   * Generate a unique room name for a booking
   *
   * P0-2 SECURITY FIX: Room name now includes token version to invalidate
   * old tokens when booking is cancelled or rescheduled. When tokenVersion
   * changes, the room name changes, making old tokens useless.
   *
   * @param bookingId - The booking UUID
   * @param tokenVersion - The current token version (increments on cancellation)
   */
  generateRoomName(bookingId: string, tokenVersion: number = 1): string {
    const cleanId = bookingId.replace(/-/g, '');
    // Include token version in room name - when version changes, room changes
    // This effectively invalidates all previously issued tokens for this booking
    return `sidra_booking_${cleanId}_v${tokenVersion}`;
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
    this.logger.log(
      `[DEBUG] getJitsiConfigForBooking called for ${bookingId} by ${userId}`,
    );

    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        teacher_profiles: { include: { users: true } },
        users_bookings_bookedByUserIdTousers: true,
        users_bookings_studentUserIdTousers: true,
        children: true,
      },
    });

    if (!booking) throw new BadRequestException('Booking not found');

    const isTeacher =
      booking.teacherId === booking.teacher_profiles.id &&
      booking.teacher_profiles.userId === userId;
    const isBooker = booking.bookedByUserId === userId;
    const isStudent = booking.studentUserId === userId;

    if (!isTeacher && !isBooker && !isStudent) {
      throw new UnauthorizedException('You do not have access to this booking');
    }

    // Check if Jitsi is enabled for this teacher (admin-controlled)
    const jitsiEnabledForTeacher =
      await this.featureFlagService.isJitsiEnabledForTeacher(booking.teacherId);

    // If Jitsi is NOT enabled for this teacher, use external meeting link
    if (!jitsiEnabledForTeacher) {
      return {
        bookingId,
        meetingMethod: 'external',
        externalMeetingLink: booking.meetingLink || undefined,
        canJoin: !!booking.meetingLink,
        message: booking.meetingLink
          ? 'External meeting link available'
          : 'No meeting link available yet. Teacher will provide one.',
      };
    }

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

    // Get dynamic settings
    const config = await this.getJitsiSettings();
    const userInfo = await this.getUserInfo(userId, booking);

    // P0-2 SECURITY FIX: Include token version in room name for invalidation
    // Note: jitsiTokenVersion field added in migration - cast to any until Prisma client regenerated
    const tokenVersion = (booking as any).jitsiTokenVersion || 1;
    const roomName = booking.jitsiRoomId
      ? `${booking.jitsiRoomId}_v${tokenVersion}` // Append version to existing room ID
      : this.generateRoomName(bookingId, tokenVersion);

    // P0-1 SECURITY FIX: Token expires based on session end time, not 24 hours
    // P0-2 SECURITY FIX: Include booking metadata for audit trail
    const token = await this.generateJitsiToken(
      roomName,
      userInfo,
      new Date(booking.endTime),
      { id: bookingId, tokenVersion },
    );

    // Default buttons if not set in DB
    const defaultTeacherButtons = [
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
      'security',
    ];

    const defaultStudentButtons = [
      'microphone',
      'camera',
      'closedcaptions',
      'desktop',
      'fullscreen',
      'fodeviceselection',
      'hangup',
      'profile',
      'chat',
      'raisehand',
      'tileview',
    ];

    const toolbarButtons =
      userInfo.role === 'teacher'
        ? config.teacherToolbarButtons || defaultTeacherButtons
        : config.studentToolbarButtons || defaultStudentButtons;

    // Remove 'chat' if disabled globally
    const finalToolbarButtons = config.enableChat
      ? toolbarButtons
      : toolbarButtons.filter((b) => b !== 'chat');

    const jitsiConfig: JitsiConfig = {
      domain: config.domain,
      roomName,
      jwt: token,
      userInfo,
      configOverwrite: {
        startWithAudioMuted:
          config.startAudioMuted && userInfo.role !== 'teacher',
        startWithVideoMuted: config.startVideoMuted,
        enableWelcomePage: false,
        prejoinPageEnabled: true,
        enableClosePage: false,
        defaultLanguage: 'en',
        disableDeepLinking: true,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: true,
        SHOW_WATERMARK_FOR_GUESTS: true,
        DEFAULT_BACKGROUND: '#1a1a1a',
        DEFAULT_LOGO_URL: 'images/watermark.png',
        JITSI_WATERMARK_LINK: 'https://sidra.sd',
        TOOLBAR_BUTTONS: finalToolbarButtons,
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
      displayName = 'مستخدم';
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
      displayName,
      role,
    };
  }

  // Note: toggleJitsiForBooking removed - Jitsi is now admin-controlled only.
  // Admin enables/disables Jitsi via:
  // 1. Global toggle: system_settings.jitsiConfig.enabled
  // 2. Per-teacher whitelist: teacher_profiles.jitsiEnabled
}
