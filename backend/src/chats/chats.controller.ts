import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChatsService } from './chats.service';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get('ping')
  ping() {
    return { ok: true, msg: 'chats controller live' };
  }

  @Post('send')
  async sendMessage(@Body() body: { text: string; groupId: string; userId: string }) {
    const { text, groupId, userId } = body;
    const result = await this.chatsService.sendMessage(text, groupId, userId);
    if (!result.success) {
      throw new Error('Failed to send message');
    }
    return result;
  }

  @Get('group/:groupId')
  async getGroupMessages(@Param('groupId') groupId: string) {
    const result = await this.chatsService.getGroupMessages(groupId);
    if (!result.success) {
      throw new Error('Failed to load messages');
    }
    return result;
  }
}
