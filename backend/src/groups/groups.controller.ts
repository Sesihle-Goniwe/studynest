import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { GroupsService } from "./groups.service";
import { CreateGroupDto } from "./dto/create-group.dto/create-group.dto";
import { SetGroupGoalDto } from "./dto/create-group.dto/set-group_goal.dto";
import { CurrentUser } from "../decorators/current-user.decorator";

@Controller("groups")
export class GroupsController {
  constructor(private supabaseSer: GroupsService) {}

  @Get()
  async getAllGroups() {
    return await this.supabaseSer.getAllGroup();
  }

  @Get("my-groups")
  async getMyOwnGroups(@CurrentUser("id") callerId: string) {
    return this.supabaseSer.getMyGroups(callerId);
  }

  @Get(":userId")
  async getGroupsById(
    @Param("userId") userId: string,
    @CurrentUser("id") callerId?: string,
  ) {
    const targetId = userId === "me" ? callerId : callerId || userId;
    return this.supabaseSer.getMyGroups(targetId!);
  }

  @Post("create")
  async createGroup(
    @Body() createGroupDto: CreateGroupDto,
    @CurrentUser("id") callerId?: string,
  ) {
    const creatorId = callerId || createGroupDto.userId;
    return this.supabaseSer.createGroup(
      createGroupDto.name,
      createGroupDto.description,
      creatorId,
    );
  }

  @Post("set")
  async setGroupGoal(
    @Body() setGroupGoalDto: SetGroupGoalDto,
    @CurrentUser("id") callerId?: string,
  ) {
    if (!setGroupGoalDto.createdBy && callerId) {
      setGroupGoalDto.createdBy = callerId;
    }
    return this.supabaseSer.setGroupGoals(setGroupGoalDto);
  }

  @Get("goals/:groupId")
  async getGroupGoals(@Param("groupId") groupId: string) {
    return this.supabaseSer.getGroupGoals(groupId);
  }

  @Post("join")
  async joinGroup(
    @Body("groupId") groupId: string,
    @Body("userId") userId?: string,
    @Body("role") role: "admin" | "member" = "member",
    @CurrentUser("id") callerId?: string,
  ) {
    const memberId = callerId || userId || "";
    return this.supabaseSer.joinGroup(groupId, memberId, role);
  }

  @Delete(":userId")
  async deleteGroup(
    @Param("userId") userId: string,
    @CurrentUser("id") callerId?: string,
  ) {
    const targetId = userId === "me" ? callerId : callerId || userId;
    return this.supabaseSer.deleteGroup(targetId!);
  }

  @Patch(":id")
  async updateGroup(
    @Param("id") id: string,
    @Body() body: { name: string; description: string },
  ) {
    return this.supabaseSer.updateGroup(id, body.name, body.description);
  }
}
