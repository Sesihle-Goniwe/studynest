import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { SessionsService } from './sessions.service';
@Controller('sessions')
export class SessionsController {

    constructor(private readonly sessionsSer:SessionsService){}

     @Post('create')
        async createSession(@Body() body:any)
        {
            return this.sessionsSer.createSession(body);
        }

        @Get(':groupId')
        async getSessionByGroup(@Param('groupId') groupId:string)
        {
            return this.sessionsSer.getSessionByGroup(groupId);
        }

         @Get(':groupId/:userId')
        async getUserRole(@Param('groupId') groupId:string,@Param('userId') userId:string,)
        {
            return this.sessionsSer.getUserRole(groupId,userId);
        }

        @Delete(':sessionId')
            async deleteSession(@Param('sessionId') sessionId:string)
            {
                return this.sessionsSer.deleteSession(sessionId);
            }

        @Delete(':groupId/:userId')
        async leaveGroup(
            @Param('groupId') groupId: string,
            @Param('userId') userId: string,
        )
        {
            return this.sessionsSer.leaveGroup(groupId,userId);
        }
}
