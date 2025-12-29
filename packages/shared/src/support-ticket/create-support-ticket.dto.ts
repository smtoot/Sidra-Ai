import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  MaxLength,
  IsArray,
  ArrayMaxSize,
  IsUrl,
} from 'class-validator';
import { TicketCategory } from './ticket-category.enum';
import { TicketPriority } from './ticket-priority.enum';

export class CreateSupportTicketDto {
  @IsEnum(TicketCategory)
  category!: TicketCategory;

  @IsString()
  @MaxLength(200, { message: 'Subject must be at most 200 characters' })
  subject!: string;

  @IsString()
  @MaxLength(5000, { message: 'Description must be at most 5000 characters' })
  description!: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @ArrayMaxSize(10, { message: 'Maximum 10 evidence files allowed' })
  @IsOptional()
  evidence?: string[];

  // Optional context linking
  @IsUUID()
  @IsString()
  @IsOptional()
  linkedBookingId?: string;

  @IsUUID()
  @IsString()
  @IsOptional()
  linkedTeacherId?: string;

  @IsUUID()
  @IsString()
  @IsOptional()
  linkedStudentId?: string;

  // Priority can be set by user (defaults to NORMAL in service)
  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;
}
