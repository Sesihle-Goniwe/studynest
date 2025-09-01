import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto/create-group.dto';
@Controller('groups')
export class GroupsController {

    constructor (private supabaseSer: GroupsService){}

    @Get()
    
    async getAllGroups()
    {
        return await this.supabaseSer.getAllGroup();
    }
    
    @Get(':userId')
    async getGroupsById(@Param('userId') userId:string)
    {
            return this.supabaseSer.getMyGroups(userId);
    }

        @Post('create')
        async createGroup(@Body() createGroupDto: CreateGroupDto) {
        return this.supabaseSer.createGroup(
            createGroupDto.name,
            createGroupDto.description,
            createGroupDto.userId
        );
        }

    @Post('join')
    async joinGroup(@Body('groupId') groupId:string, @Body('userId') userId:string,
                    @Body('role') role:'admin' | 'member'='member')
        {
            return this.supabaseSer.joinGroup(groupId,userId,role);
        }
         
}
