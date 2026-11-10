import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  full_name?: string;

  @IsString()
  @IsOptional()
  university?: string;

  @IsString()
  @IsOptional()
  course?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  profileImage?: string;
}
