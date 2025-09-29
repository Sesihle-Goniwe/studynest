import {Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { GroupsService } from "./groups.service";
import { CreateGroupDto } from "./dto/create-group.dto/create-group.dto";
import { SetGroupGoalDto } from "./dto/create-group.dto/set-group_goal.dto";
@Controller("groups")
export class GroupsController {
  constructor(private supabaseSer: GroupsService) {}

  @Get()
  async getAllGroups() {
    return await this.supabaseSer.getAllGroup();
  }

  @Get(":userId")
  async getGroupsById(@Param("userId") userId: string) {
    return this.supabaseSer.getMyGroups(userId);
  }

  @Post("create")
  async createGroup(@Body() createGroupDto: CreateGroupDto) {
    return this.supabaseSer.createGroup(
      createGroupDto.name,
      createGroupDto.description,
      createGroupDto.userId,
    );
  }
 @Post("set")
async setGroupGoal(@Body() setGroupGoalDto: SetGroupGoalDto) {
  return this.supabaseSer.setGroupGoals(setGroupGoalDto);
}

@Get('goals/:groupId')
async getGroupGoals(@Param('groupId') groupId: string) {
  return this.supabaseSer.getGroupGoals(groupId);
}



  @Post("join")
  async joinGroup(
    @Body("groupId") groupId: string,
    @Body("userId") userId: string,
    @Body("role") role: "admin" | "member" = "member",
  ) {
    return this.supabaseSer.joinGroup(groupId, userId, role);
  }

  @Delete(":userId")
  async deleteGroup(@Param("userId") userId: string) {
    return this.supabaseSer.deleteGroup(userId);
  }

  @Patch(":id")
  async updateGroup(
    @Param("id") id: string,
    @Body() body: { name: string; description: string },
  ) {
    return this.supabaseSer.updateGroup(id, body.name, body.description);
  }
}
