import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly supabaseService: NotificationsService) {}

  @Get()
  async getAll() {
    return await this.supabaseService.getAllNotifications();
  }
  @Get(":userId")
  async getNotifications(@Param("userId") userId: string) {
    return this.supabaseService.getNotifications(userId);
  }
  @Patch(":id")
  async markAsRead(@Param("id") id: string) {
    return this.supabaseService.markAsRead(id);
  }

  @Delete(":userId")
  async clearNotifications(@Param("userId") userId: string) {
    return this.supabaseService.clearNotifications(userId);
  }
}
