import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from '@sidra/shared';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(createAuthDto: RegisterDto): Promise<{
        access_token: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
    }>;
    getProfile(req: any): Promise<{
        parentProfile: ({
            students: {
                id: string;
                name: string;
                parentId: string;
                gradeLevel: string | null;
            }[];
        } & {
            id: string;
            userId: string;
        }) | null;
        teacherProfile: {
            id: string;
            displayName: string | null;
            bio: string | null;
            yearsOfExperience: number | null;
            education: string | null;
            gender: import("@prisma/client").$Enums.Gender | null;
            kycStatus: import("@prisma/client").$Enums.KYCStatus;
            kycRejectionReason: string | null;
            hasCompletedOnboarding: boolean;
            onboardingStep: number;
            cancellationPolicy: import("@prisma/client").$Enums.CancellationPolicy;
            encryptedMeetingLink: string | null;
            averageRating: number;
            totalReviews: number;
            totalSessions: number;
            userId: string;
        } | null;
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        phoneNumber: string | null;
        isActive: boolean;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
