import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import { SupabaseService } from 'src/supabase/supabase.service';

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

//@Cron('*/10 * * * *')
/*
async sendScheduledReminders()
{
    const reminders = await this.reminderSer.getPendingReminders();
    if(reminders)
    {
        for(const r of reminders)
        {
            const{data:user} = await this.supabaseSer
            .getClient()
            .from('students')
            .select('email')
            .eq('user_id',r.user_id)
            .single();

            if(user?.email)
        {
            await this.sendMail(user.email, r.message,r.message);
            await this.reminderSer.markAsSent(r.id);
        }
        }

        
    }
}


async sendRemMail(to: string, subject: string, text: string, html?: string) {
  
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
}*/

}

