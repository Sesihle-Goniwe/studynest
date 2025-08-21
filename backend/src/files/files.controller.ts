/* --- 
  BACKEND: src/files/files.controller.ts
--- */
import { Controller, Post, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import type { Express } from 'express';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  // 1. Use the @Body() decorator to get the other form fields
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body: { userId: string }) {
    // 2. Extract the userId from the body
    const userId = body.userId;

    // 3. Pass both to the service
    return this.filesService.upload(file, userId);
  }
}
