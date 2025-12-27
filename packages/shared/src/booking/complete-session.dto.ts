import { IsString, IsOptional, IsBoolean, IsInt, Min, Max, IsUrl } from 'class-validator';

/**
 * DTO for completing a session with optional structured details
 * All fields are optional to give teachers flexibility
 */
export class CompleteSessionDto {
    @IsOptional()
    @IsString()
    @IsUrl({}, { message: 'Must be a valid image URL' })
    sessionProofUrl?: string; // Screenshot from session (confidential, for disputes)

    @IsOptional()
    @IsString()
    topicsCovered?: string; // What was taught in this session

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    studentPerformanceRating?: number; // 1-5 stars

    @IsOptional()
    @IsString()
    studentPerformanceNotes?: string; // How the student performed

    @IsOptional()
    @IsBoolean()
    homeworkAssigned?: boolean; // Whether homework was given

    @IsOptional()
    @IsString()
    homeworkDescription?: string; // Description of homework

    @IsOptional()
    @IsString()
    nextSessionRecommendations?: string; // What to focus on next

    @IsOptional()
    @IsString()
    additionalNotes?: string; // Any other observations
}
