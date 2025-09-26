// src/progress/dto/create-topic.dto.ts

export class CreateTopicDto {
  name: string;
  file_id?: string; // Optional: To link to an uploaded file later
  userId: string; // Add this property
}
