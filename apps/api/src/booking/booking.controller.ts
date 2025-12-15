import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { BookingService } from './booking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, CreateBookingDto, UpdateBookingStatusDto } from '@sidra/shared';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingController {
    constructor(private readonly bookingService: BookingService) { }

    // Parent creates a booking request
    @Post()
    @UseGuards(RolesGuard)
    @Roles(UserRole.PARENT, (UserRole as any).STUDENT) // Allow both roles
    createRequest(@Request() req: any, @Body() dto: CreateBookingDto) {
        return this.bookingService.createRequest(req.user, dto);
    }

    // Teacher approves a booking
    @Patch(':id/approve')
    @UseGuards(RolesGuard)
    @Roles(UserRole.TEACHER)
    approveRequest(@Request() req: any, @Param('id') id: string) {
        return this.bookingService.approveRequest(req.user.userId, id);
    }

    // Teacher rejects a booking
    @Patch(':id/reject')
    @UseGuards(RolesGuard)
    @Roles(UserRole.TEACHER)
    rejectRequest(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
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

    // Get parent's bookings
    @Get('parent/my-bookings')
    @UseGuards(RolesGuard)
    @Roles(UserRole.PARENT)
    getParentBookings(@Request() req: any) {
        return this.bookingService.getParentBookings(req.user.userId);
    }

    // Get student's bookings
    @Get('student/my-bookings')
    @UseGuards(RolesGuard)
    @Roles(UserRole.STUDENT)
    getStudentBookings(@Request() req: any) {
        return this.bookingService.getStudentBookings(req.user.userId);
    }

    // --- Phase 2C: Payment Integration ---

    // Parent or Student pays for approved booking
    @Patch(':id/pay')
    @UseGuards(RolesGuard)
    @Roles(UserRole.PARENT, UserRole.STUDENT)
    payForBooking(@Request() req: any, @Param('id') id: string) {
        return this.bookingService.payForBooking(req.user.userId, id);
    }

    // Teacher marks session as completed
    @Patch(':id/complete-session')
    @UseGuards(RolesGuard)
    @Roles(UserRole.TEACHER)
    completeSession(@Request() req: any, @Param('id') id: string) {
        return this.bookingService.completeSession(req.user.userId, id);
    }

    // Admin marks booking as completed
    @Patch(':id/complete')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    markCompleted(@Param('id') id: string) {
        return this.bookingService.markCompleted(id);
    }
}
