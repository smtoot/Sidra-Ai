export declare enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE"
}
export declare class UpdateTeacherProfileDto {
    displayName?: string;
    bio?: string;
    yearsOfExperience?: number;
    education?: string;
    gender?: Gender;
    meetingLink?: string;
}
