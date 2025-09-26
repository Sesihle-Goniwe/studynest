import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
 import { ChatsService } from './chats.service';
 
 @Controller('chats')
 export class ChatsController {
 constructor(private chatsService: ChatsService) {}
 
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
 

@Patch('edit/:messageId')
async editMessage(
  @Param('messageId') messageId: string,
  @Body('userId') userId: string,
  @Body('text') text: string
) {
  const result = await this.chatsService.editMessage(messageId, userId, text);
  if (!result.success) throw new Error('Failed to edit message');
  return result;
}

@Delete('delete/:messageId')
async deleteMessage(
  @Param('messageId') messageId: string,
  @Query('userId') userId: string // change from @Body to @Query
) {
  const result = await this.chatsService.deleteMessage(messageId, userId);
  if (!result.success) throw new Error('Failed to delete message');
  return result;
}
/*@Delete(":userId")
  async deleteGroup(@Param("userId") userId: string) {
    return this.supabaseSer.deleteGroup(userId);
  }*/


 }