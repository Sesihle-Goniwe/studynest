import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { ChatsService } from "./chats.service";

@Controller("chats")
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post("send")
  async sendMessage(
    @Body("text") text: string,
    @Body("groupId") groupId: string,
    @Body("userId") userId: string,
  ) {
    return this.chatsService.sendMessage(text, groupId, userId);
  }

  @Get("group/:groupId")
  async getGroupMessages(@Param("groupId") groupId: string) {
    return this.chatsService.getGroupMessages(groupId);
  }
}
