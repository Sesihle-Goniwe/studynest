import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Patch,
  Request,
} from "@nestjs/common";
import { ProgressService } from "./progress.service";
import { CreateTopicDto } from "./dto/create-topic.dto";
import { CreateStudyLogDto } from "./dto/create-study-log.dto";
import { CurrentUser } from "../decorators/current-user.decorator";

@Controller("progress")
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post("topics")
  create(
    @Body() createTopicDto: CreateTopicDto,
    @Request() req?: any,
    @CurrentUser("id") callerId?: string,
  ) {
    if (!createTopicDto.userId && callerId) {
      createTopicDto.userId = callerId;
    }
    return this.progressService.createTopic(createTopicDto);
  }

  @Get("topics")
  findAll(
    @Query("userId") queryUserId?: string,
    @CurrentUser("id") callerId?: string,
  ) {
    const userId = queryUserId || callerId;
    return this.progressService.findAllTopicsForUser(userId!);
  }

  @Post("study-logs")
  addStudyLog(
    @Body() dto: CreateStudyLogDto,
    @CurrentUser("id") callerId?: string,
  ) {
    if (!dto.userId && callerId) {
      dto.userId = callerId;
    }
    return this.progressService.addStudyLog(dto);
  }

  @Get("study-logs")
  getStudyLogs(
    @Query("userId") queryUserId?: string,
    @Query("topicId") topicId?: string,
    @CurrentUser("id") callerId?: string,
  ) {
    const userId = queryUserId || callerId;
    return this.progressService.getStudyLogs(userId!, topicId);
  }

  @Patch("topics/:id")
  update(@Param("id") id: string, @Body() body: { status: string }) {
    return this.progressService.updateStatus(id, body.status);
  }

  @Delete("topics/:id")
  remove(@Param("id") id: string) {
    return this.progressService.remove(id);
  }

  @Get("user-groups")
  findUserGroups(
    @Query("userId") queryUserId?: string,
    @CurrentUser("id") callerId?: string,
  ) {
    const userId = queryUserId || callerId;
    return this.progressService.findUserGroups(userId!);
  }

  @Get("rankings/:groupId")
  getRankings(@Param("groupId") groupId: string) {
    return this.progressService.getRankingsForGroup(groupId);
  }
}
