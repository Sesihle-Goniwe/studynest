import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class OnboardStudentDto {
  @IsString()
  @IsNotEmpty()
  university: string;

  @IsString()
  @IsNotEmpty()
  course: string;

  @IsInt()
  @Min(1)
  year: number;

  @IsString()
  @IsOptional()
  fullName?: string;
}

