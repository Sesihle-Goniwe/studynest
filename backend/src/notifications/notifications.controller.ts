import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { CurrentUser } from "../decorators/current-user.decorator";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly supabaseService: NotificationsService) {}

  @Get()
  async getAll() {
    return this.supabaseService.getAllNotifications();
  }

  @Get("my-notifications")
  async getMyNotifications(@CurrentUser("id") callerId?: string) {
    return this.supabaseService.getNotifications(callerId!);
  }

  @Get(":userId")
  async getNotifications(
    @Param("userId") userId: string,
    @CurrentUser("id") callerId?: string,
  ) {
    const targetId = userId === "me" ? callerId : callerId || userId;
    return this.supabaseService.getNotifications(targetId!);
  }

  @Patch(":id")
  async markAsRead(@Param("id") id: string) {
    return this.supabaseService.markAsRead(id);
  }

  @Delete(":userId")
  async clearNotifications(
    @Param("userId") userId: string,
    @CurrentUser("id") callerId?: string,
  ) {
    const targetId = userId === "me" ? callerId : callerId || userId;
    return this.supabaseService.clearNotifications(targetId!);
  }
}
