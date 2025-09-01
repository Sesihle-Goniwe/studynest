// src/progress/dto/create-study-log.dto.ts
export class CreateStudyLogDto {
  userId: string;
  topicId: string;
  date: string; // ISO date string
  hours: number;
}
