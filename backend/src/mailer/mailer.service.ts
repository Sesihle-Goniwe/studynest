import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import { SupabaseService } from 'src/supabase/supabase.service';
import { DateTime } from "luxon";
@Injectable()
export class MailerService {

        private readonly logger = new Logger(MailerService.name);
        private transporter;

        constructor(
            private supabaseSer:SupabaseService
        )
        {
            this.transporter  = nodemailer.createTransport(
                {
                    service: 'gmail',
                    auth: {
                        //user: 'neststudy18@gmail.com',
                        //pass: 'ukglhwrdcudkzhmc',
                        user: process.env.MAIL_USER,
                        pass: process.env.MAIL_PASS,
                    }
                }
            )
        }

async sendMail(to: string, subject: string, text: string, html?: string) {
  
    try 
    {
        const info = await this.transporter.sendMail({
        from: `"StudyNest" ${process.env.MAIL_USER}`, 
        to,
        subject,
        text,
        html,
    });

    this.logger.log(`Email sent to ${to}`);
  } catch (error) {

    this.logger.error(`Failed to send email: ${error.message}`);
    throw error;
  }
}
@Cron('*/1 * * * *')
  async sendReminders() 
  {
    const nowLocal = DateTime.now().setZone("Africa/Johannesburg"); 
    const twoMinFromNow = nowLocal.plus({ hours: 1 }).toFormat("yyyy-MM-dd HH:mm:ss");
    const fiveMinFromNow = nowLocal.plus({ hours: 24 }).toFormat("yyyy-MM-dd HH:mm:ss");

console.log("Query window 2min:", twoMinFromNow);
console.log("Query window 5min:", fiveMinFromNow);

    const { data: sessions,error } = await this.supabaseSer
    .getClient()
    .from("sessions")
    .select("*")
    .gte("start_time", nowLocal.plus({ minutes: 2 }).toFormat("yyyy-MM-dd HH:mm:ss"))
    .lt("start_time", nowLocal.plus({ minutes: 3 }).toFormat("yyyy-MM-dd HH:mm:ss"));


    if (error) {
      this.logger.error(`Failed to fetch sessions: ${error.message}`);
      return;
    }

    if (!sessions || sessions.length === 0) {
      return;
    }

    for (const session of sessions) {
      // fetch group members
      const { data: members,error: memError } = await this.supabaseSer
        .getClient()
        .from('group_members')
        .select('user_id')
        .eq('group_id', session.group_id);

         if (memError) {
            console.log("failed to fetch members", memError.message);
            return 
        }
      for (const member of members) {
        const { data: student } = await this.supabaseSer
          .getClient()
          .from('students')
          .select('email')
          .eq('user_id', member.user_id)
          .single();

        if (student?.email) {
          const start = DateTime.fromISO(session.start_time, { zone: 'utc' });
          const dateFormatted = start.toFormat('dd-LL-yyyy');
          const timeFormatted = start.toFormat('HH:mm');

          await this.sendMail(
            student.email,
            `Reminder: ${session.title}`,
            `Your study session "${session.title}" starts on ${dateFormatted} at ${timeFormatted} (${session.location})`,
            `<h3>Reminder: ${session.title}</h3>
             <p>${session.description}</p>
             <p><strong>Date:</strong> ${dateFormatted}</p>
             <p><strong>Time:</strong> ${timeFormatted}</p>
             <p><strong>Where:</strong> ${session.location}</p>
            <p>Communication from your Campus Study buddy<p>`
          );
        }
      }
    }
  }

}

