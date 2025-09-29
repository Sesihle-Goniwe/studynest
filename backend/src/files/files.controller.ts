/* --- 
  BACKEND: src/files/files.controller.ts (Updated as requested)
--- */
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Get,
  Param,
  Query, // Query decorator is used for GET requests
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { FilesService } from "./files.service";
import type { Express } from "express";

@Controller("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { userId: string },
  ) {
    const userId = body.userId;
    return this.filesService.upload(file, userId);
  }

  @Get('personal/:id/url')
  // Get the userId from the URL's query string (e.g., ?userId=abc-123)
  getPersonalSignedUrl(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ) {
    return this.filesService.getPersonalFileSignedUrl(id, userId);
  }

  @Get('group/:id/url')
  // Get the userId from the URL's query string (e.g., ?userId=abc-123)
  getGroupSignedUrl(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ) {
    return this.filesService.getGroupFileSignedUrl(id, userId);
  }

  @Post(":fileId/summarize")
  summarizeNote(
    @Param("fileId") fileId: string,
    @Body() body: { userId: string },
  ) {
    const userId = body.userId;
    return this.filesService.summarize(fileId, userId);
  }
}