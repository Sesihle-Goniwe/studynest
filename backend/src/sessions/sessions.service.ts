import { Injectable } from '@nestjs/common';
import { group } from 'console';
import { title } from 'process';
import { SupabaseService } from 'src/supabase/supabase.service'; 
@Injectable()
export class SessionsService {

    constructor (private readonly supabaseSer:SupabaseService){}
    async createSession(body:any)
    {
        const {data,error} = await this.supabaseSer
        .getClient()
        .from('sessions')
        .insert([{group_id: body.group_id, title: body.title,
            scheduled_at: body.scheduledAt, created_by: body.createdBy
        }])
        .select();

        if(error)
        {
            console.log("failed to create sesioon");
        }
        return data;
    }

    async getSessionByGroup(groupId:string)
    {
        const {data, error} =await this.supabaseSer
        .getClient()
        .from('sessions')
        .select('*')
        .eq('group_id',groupId);

        if(error)
        {
            console.log("Failed to get groups");
        }

        return data;
    }

}
