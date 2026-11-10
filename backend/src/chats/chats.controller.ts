import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  InternalServerErrorException,
} from "@nestjs/common";
import { ChatsService } from "./chats.service";
import { FilesService } from "../files/files.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { CurrentUser } from "../decorators/current-user.decorator";
import type { Express } from "express";

@Controller("chats")
export class ChatsController {
  constructor(
    private chatsService: ChatsService,
    private filesService: FilesService,
  ) {}

  @Get("ping")
  ping() {
    return { ok: true, msg: "chats controller live" };
  }

  @Post("send")
  async sendMessage(
    @Body() body: { text: string; groupId: string; userId?: string },
    @CurrentUser("id") callerId?: string,
  ) {
    const userId = callerId || body?.userId || "";
    const result = await this.chatsService.sendMessage(
      body.text,
      body.groupId,
      userId,
    );
    if (!result.success) {
      throw new InternalServerErrorException("Failed to send message");
    }
    return result;
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFileToChat(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { groupId: string; userId?: string; message?: string },
    @CurrentUser("id") callerId?: string,
  ) {
    const userId = callerId || body?.userId || "";
    const uploadResult = await this.filesService.upload(file, userId);

    if (!uploadResult.data?.id) {
      throw new InternalServerErrorException("Failed to upload file");
    }

    const messageText = body?.message || `📎 ${file.originalname}`;
    const messageResult = await this.chatsService.sendFileMessage(
      messageText,
      body.groupId,
      userId,
      uploadResult.data.id,
    );

    return {
      success: true,
      file: uploadResult.data,
      message: messageResult.message,
    };
  }

  @Get("group/:groupId")
  async getGroupMessages(@Param("groupId") groupId: string) {
    const result = await this.chatsService.getGroupMessages(groupId);
    if (!result.success) {
      throw new InternalServerErrorException("Failed to load messages");
    }
    return result;
  }

  @Patch("edit/:messageId")
  async editMessage(
    @Param("messageId") messageId: string,
    @Body("text") text: string,
    @Body("userId") bodyUserId?: string,
    @CurrentUser("id") callerId?: string,
  ) {
    const userId = callerId || bodyUserId || "";
    const result = await this.chatsService.editMessage(messageId, userId, text);
    if (!result.success) {
      throw new InternalServerErrorException("Failed to edit message");
    }
    return result;
  }

  @Delete("delete/:messageId")
  async deleteMessage(
    @Param("messageId") messageId: string,
    @Query("userId") queryUserId?: string,
    @CurrentUser("id") callerId?: string,
  ) {
    const userId = callerId || queryUserId || "";
    const result = await this.chatsService.deleteMessage(messageId, userId);
    if (!result.success) {
      throw new InternalServerErrorException("Failed to delete message");
    }
    return result;
  }
}
