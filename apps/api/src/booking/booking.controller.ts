import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { BookingService } from './booking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  UserRole,
  CreateBookingDto,
  UpdateBookingStatusDto,
  CreateRatingDto,
} from '@sidra/shared';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) { }

  // Parent creates a booking request
  // SECURITY: Rate limit to prevent booking spam
  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 bookings per minute
  @UseGuards(RolesGuard)
  @Roles(UserRole.PARENT, (UserRole as any).STUDENT) // Allow both roles
  createRequest(@Request() req: any, @Body() dto: CreateBookingDto) {
    return this.bookingService.createRequest(req.user, dto);
  }

  // Teacher approves a booking
  // SECURITY: Rate limit to prevent rapid approval spam
  @Patch(':id/approve')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 approvals per minute
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER)
  approveRequest(@Request() req: any, @Param('id') id: string) {
    return this.bookingService.approveRequest(req.user.userId, id);
  }

  // Teacher rejects a booking
  // SECURITY: Rate limit to prevent rapid rejection spam
  @Patch(':id/reject')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 rejections per minute
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER)
  rejectRequest(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingService.rejectRequest(req.user.userId, id, dto);
  }

  // Get teacher's incoming requests
  @Get('teacher/requests')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER)
  getTeacherRequests(@Request() req: any) {
    return this.bookingService.getTeacherRequests(req.user.userId);
  }

  // Get teacher's all sessions
  @Get('teacher/my-sessions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER)
  getTeacherSessions(@Request() req: any) {
    return this.bookingService.getTeacherSessions(req.user.userId);
  }

  // Get ALL teacher bookings (all statuses - for requests page) (PAGINATED)
  @Get('teacher/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER)
  getAllTeacherBookings(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.bookingService.getAllTeacherBookings(req.user.userId, page, limit);
  }

  // Get parent's bookings (PAGINATED)
  @Get('parent/my-bookings')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PARENT)
  getParentBookings(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.bookingService.getParentBookings(req.user.userId, page, limit);
  }

  // Get student's bookings
  @Get('student/my-bookings')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  getStudentBookings(@Request() req: any) {
    return this.bookingService.getStudentBookings(req.user.userId);
  }

  // Get single booking by ID (for session detail page)
  @Get(':id')
  getBookingById(@Request() req: any, @Param('id') id: string) {
    return this.bookingService.getBookingById(
      req.user.userId,
      req.user.role,
      id,
    );
  }

  // Teacher updates their private notes (prep notes and summary)
  @Patch(':id/teacher-notes')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER)
  updateTeacherNotes(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: { teacherPrepNotes?: string; teacherSummary?: string },
  ) {
    return this.bookingService.updateTeacherNotes(req.user.userId, id, dto);
  }

  // Teacher updates meeting link for a specific session
  // SECURITY: Rate limit to prevent spam
  @Patch(':id/meeting-link')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 updates per minute
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER)
  updateMeetingLink(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: { meetingLink: string },
  ) {
    return this.bookingService.updateMeetingLink(req.user.userId, id, dto);
  }

  // --- Phase 2C: Payment Integration ---

  // Parent or Student pays for approved booking
  // SECURITY: Rate limit payment attempts to prevent abuse
  @Patch(':id/pay')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 payment attempts per minute
  @UseGuards(RolesGuard)
  @Roles(UserRole.PARENT, UserRole.STUDENT)
  payForBooking(@Request() req: any, @Param('id') id: string) {
    return this.bookingService.payForBooking(req.user.userId, id);
  }

  // Teacher marks session as completed
  // SECURITY: Rate limit to prevent accidental duplicate completions
  @Patch(':id/complete-session')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 completions per minute (teachers may have back-to-back sessions)
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER)
  completeSession(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: any, // CompleteSessionDto - all fields optional
  ) {
    return this.bookingService.completeSession(req.user.userId, id, dto);
  }

  // Admin marks booking as completed
  @Patch(':id/complete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  markCompleted(@Param('id') id: string) {
    return this.bookingService.markCompleted(id);
  }

  // --- Escrow Payment Release System ---

  // Parent/Student confirms session early (before auto-release)
  @Patch(':id/confirm-early')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PARENT, UserRole.STUDENT)
  confirmSessionEarly(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto?: { rating?: number },
  ) {
    return this.bookingService.confirmSessionEarly(
      req.user.userId,
      id,
      dto?.rating,
    );
  }

  // --- Session Rating ---

  // Parent/Student rates a completed session
  @Post(':id/rate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PARENT, UserRole.STUDENT)
  rateBooking(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CreateRatingDto,
  ) {
    return this.bookingService.rateBooking(req.user.userId, id, dto);
  }

  // Parent/Student raises a dispute
  @Post(':id/dispute')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PARENT, UserRole.STUDENT)
  raiseDispute(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: { type: string; description: string; evidence?: string[] },
  ) {
    return this.bookingService.raiseDispute(req.user.userId, id, dto);
  }

  // --- Cancellation Flow ---

  // Get cancellation estimate (read-only preview)
  @Get(':id/cancel-estimate')
  getCancellationEstimate(@Request() req: any, @Param('id') id: string) {
    return this.bookingService.getCancellationEstimate(
      req.user.userId,
      req.user.role,
      id,
    );
  }

  // Cancel booking (role-based logic)
  @Patch(':id/cancel')
  cancelBooking(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: { reason?: string },
  ) {
    return this.bookingService.cancelBooking(
      req.user.userId,
      req.user.role,
      id,
      dto.reason,
    );
  }
}
