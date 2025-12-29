import {
  IsString,
  IsArray,
  IsUrl,
  ArrayMaxSize,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @MaxLength(5000, { message: 'Message must be at most 5000 characters' })
  content!: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @ArrayMaxSize(5, { message: 'Maximum 5 attachments allowed per message' })
  @IsOptional()
  attachments?: string[];
}
