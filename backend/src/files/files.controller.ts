import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Get,
  Param,
  Query,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { FilesService } from "./files.service";
import { CurrentUser } from "../decorators/current-user.decorator";
import type { Express } from "express";

@Controller("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body?: { userId?: string },
    @CurrentUser("id") callerId?: string,
  ) {
    const userId = callerId || body?.userId || "";
    return this.filesService.upload(file, userId);
  }

  @Get("personal/:id/url")
  getPersonalSignedUrl(
    @Param("id") id: string,
    @Query("userId") queryUserId?: string,
    @CurrentUser("id") callerId?: string,
  ) {
    const userId = callerId || queryUserId || "";
    return this.filesService.getPersonalFileSignedUrl(id, userId);
  }

  @Get("group/:id/url")
  getGroupSignedUrl(
    @Param("id") id: string,
    @Query("userId") queryUserId?: string,
    @CurrentUser("id") callerId?: string,
  ) {
    const userId = callerId || queryUserId || "";
    return this.filesService.getGroupFileSignedUrl(id, userId);
  }

  @Post(":fileId/summarize")
  summarizeNote(
    @Param("fileId") fileId: string,
    @Body() body?: { userId?: string },
    @CurrentUser("id") callerId?: string,
  ) {
    const userId = callerId || body?.userId || "";
    return this.filesService.summarize(fileId, userId);
  }
}
