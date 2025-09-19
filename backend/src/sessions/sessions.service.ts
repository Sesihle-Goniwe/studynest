import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service'; 
import { MailerService } from 'src/mailer/mailer.service';
import { DateTime } from "luxon";
import { start } from 'repl';
@Injectable()
export class SessionsService {

    constructor (private readonly supabaseSer:SupabaseService,
        private readonly mailerSer:MailerService
    ){}
    async createSession(body:any)
    {
        
    try {
        // Normalize start and end to UTC
        //const startUtc = DateTime.fromISO(body.start_time, { zone: "Africa/Johannesburg" }).toUTC();
        //const endUtc = DateTime.fromISO(body.end_time, { zone: "Africa/Johannesburg"}).toUTC();

        // Insert into Supabase
        const { data, error } = await this.supabaseSer
            .getClient()
            .from("sessions")
            .insert([{
                group_id: body.group_id,
                title: body.title,
                description: body.description,
                created_by: body.created_by,
                start_time:body.start_time,
                end_time:body.end_time,
                location: body.location,
            }])
            .select();

        if (error) {
            console.log("failed to create session", error.message, error.details);
            return null;
        }

        const session = data?.[0];

        // fetch members
        const { data: members, error: memError } = await this.supabaseSer
            .getClient()
            .from("group_members")
            .select("user_id")
            .eq("group_id", body.group_id);

        if (memError) {
            console.log("failed to fetch members", memError.message);
            return session;
        }

        // send notifications
        
        for (const member of members) {
            await this.supabaseSer
                .getClient()
                .from("notifications")
                .insert([{
                    user_id: member.user_id,
                    title: `New Study Session: ${session.title}`,
                    message: `A session is scheduled from ${session.start_time} to ${session.end_time} at ${session.location}`,
                    read: false,
                }]);

            const { data: student, error: studentErr } = await this.supabaseSer
                .getClient()
                .from("students")
                .select("email")
                .eq("user_id", member.user_id)
                .single();

            if (!studentErr && student?.email) 
                {
                        const start = DateTime.fromJSDate(new Date(session.start_time), {zone: "uct"});
                        const end   = DateTime.fromJSDate(new Date(session.end_time),{zone: "uct"});

                        const dateFormatted = start.toFormat("dd-LL-yyyy");
                        const startTimeFormatted = start.toFormat("HH:mm");
                        const endTimeFormatted   = end.toFormat("HH:mm");


                await this.mailerSer.sendMail(
                    student.email,
                    `New Study Session: ${session.title}`,
                    `A session is scheduled on ${dateFormatted} from ${startTimeFormatted} to ${endTimeFormatted} at ${session.location}`,
                    `<h3>${session.title}</h3>
                    <p>${session.description}</p>
                    <p><strong>Date:</strong> ${dateFormatted}</p>
                    <p><strong>Time:</strong> ${startTimeFormatted} - ${endTimeFormatted}</p>
                    <p><strong>Where:</strong> ${session.location}</p>
                    <p>Communication from your Campus Study buddy<p>`
                    );
            }
        }

        return session;
    } catch (err: any) {
        console.error("Session creation failed:", err.message);
        throw err; // so frontend can show a message
    }
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

    async deleteSession(sessionId:string)
    {
        
        const {error}= await this.supabaseSer
        .getClient()
        .from('sessions')
        .delete()
        .eq('id',sessionId)

        if(error)

            {
                console.log("failed to delete session")
                return;
            }

    }
    async leaveGroup(group_id:string,userId:string)
    {
        const {error}= await this.supabaseSer
        .getClient()
        .from('group_members')
        .delete()
        .eq('group_id',group_id)
        .eq('user_id',userId)

        if(error)
        {
            console.log("Failed to be removed from group");
        }
    }

    async getUserRole(groupId:string,userId:string)
    {
        const { data, error } = await this.supabaseSer
        .getClient()
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

        if(error)
        {
            console.log("failed to get userRole");
        }

        return data;
    }

}
