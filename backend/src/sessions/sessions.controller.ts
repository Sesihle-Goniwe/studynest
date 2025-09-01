import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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
}
