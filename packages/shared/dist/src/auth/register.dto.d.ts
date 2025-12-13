export declare enum UserRole {
    PARENT = "PARENT",
    TEACHER = "TEACHER",
    ADMIN = "ADMIN",
    SUPPORT = "SUPPORT"
}
export declare class RegisterDto {
    email: string;
    password: string;
    role: UserRole;
}
