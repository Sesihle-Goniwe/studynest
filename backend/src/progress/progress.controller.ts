// src/progress/progress.controller.ts

import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Query, Patch } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { CreateStudyLogDto } from './dto/create-study-log.dto';

// Assume you have an AuthGuard, if not, we can adjust this.
// import { AuthGuard } from '@nestjs/passport'; // Or your custom guard

@Controller('progress')
// @UseGuards(AuthGuard('jwt')) // SECURE YOUR ENDPOINTS!
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('topics')
  create(@Body() createTopicDto: CreateTopicDto, @Request() req) {
    // --- IMPORTANT ---
    // You need to extract the user ID from the request.
    // This depends on your authentication setup.
    // A common way is from a JWT payload attached by a guard.
    return this.progressService.createTopic(createTopicDto);
  }


  // Reminder: Your backend endpoint should look like this for now
  @Get('topics')
  findAll(@Query('userId') userId: string) {
    return this.progressService.findAllTopicsForUser(userId);
  }
  // We'll add PATCH, DELETE, and session logging endpoints here later.
  @Post('study-logs')
  addStudyLog(@Body() dto: CreateStudyLogDto) {
    return this.progressService.addStudyLog(dto);
  }

  @Get('study-logs')
  getStudyLogs(@Query('userId') userId: string, @Query('topicId') topicId?: string) {
    return this.progressService.getStudyLogs(userId, topicId);
  }
  @Patch('topics/:id')
  update(@Param('id') id: string, @Body() body: { status: string }) {
    return this.progressService.updateStatus(id, body.status);
  }

  @Delete('topics/:id')
  remove(@Param('id') id: string) {
    return this.progressService.remove(id);
  }
  @Get('user-groups')
  findUserGroups(@Query('userId') userId: string) {
    return this.progressService.findUserGroups(userId);
  }

  @Get('rankings/:groupId')
  getRankings(@Param('groupId') groupId: string) {
    return this.progressService.getRankingsForGroup(groupId);
  }
}

