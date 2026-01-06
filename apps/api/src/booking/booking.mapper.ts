/**
 * Mapper utility for transforming booking data from database (snake_case/relations)
 * to API response format (camelCase/clean objects).
 */
export class BookingMapper {
    /**
     * Maps a single booking object
     */
    static mapBooking(booking: any): any {
        if (!booking) return null;

        // Determine student name based on beneficiary type
        let studentName = 'طالب';
        let studentId = booking.studentUserId;

        if (booking.beneficiaryType === 'CHILD' && booking.children) {
            studentName = booking.children.name;
            studentId = booking.children.id; // Or parent ID? booking references childId
        } else if (booking.users_bookings_studentUserIdTousers) {
            studentName = booking.users_bookings_studentUserIdTousers.firstName;
        }

        // Determine subject name (relation is 'subjects', want 'subject')
        // and ensure it's an object { id, nameAr, nameEn }
        const subject = booking.subjects ? {
            id: booking.subjects.id,
            nameAr: booking.subjects.nameAr,
            nameEn: booking.subjects.nameEn,
            code: booking.subjects.id // fallback or check if code exists
        } : null;

        return {
            id: booking.id,
            status: booking.status,
            startTime: booking.startTime,
            endTime: booking.endTime,
            price: booking.price,
            meetingLink: booking.meetingLink,

            // Relations
            subject: subject,
            studentName: studentName,
            studentId: studentId,

            // Include original user object if needed, properly named
            student: booking.users_bookings_studentUserIdTousers ? {
                id: booking.users_bookings_studentUserIdTousers.id,
                firstName: booking.users_bookings_studentUserIdTousers.firstName,
                lastName: booking.users_bookings_studentUserIdTousers.lastName,
                profilePhotoUrl: booking.users_bookings_studentUserIdTousers.profilePhotoUrl,
            } : null,

            child: booking.children ? {
                id: booking.children.id,
                name: booking.children.name,
                gradeLevel: booking.children.gradeLevel,
            } : null,

            // Feedback/Ratings if available
            rating: booking.ratings ? {
                score: booking.ratings.score,
                comment: booking.ratings.comment
            } : null,

            // Metadata
            beneficiaryType: booking.beneficiaryType,
            cancelReason: booking.cancelReason,
            createdAt: booking.createdAt,
        };
    }

    /**
     * Maps an array of bookings
     */
    static mapBookings(bookings: any[]): any[] {
        if (!bookings) return [];
        return bookings.map(b => this.mapBooking(b));
    }
}
