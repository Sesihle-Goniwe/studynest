import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import * as Mailjet from 'node-mailjet';
import { SupabaseService } from "src/supabase/supabase.service";
import { DateTime } from "luxon";

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private mailjet;

  constructor(private supabaseSer: SupabaseService) {
    // Correct Mailjet initialization
    this.mailjet = new Mailjet.default({
      apiKey: process.env.MAILJET_API_KEY,
      apiSecret: process.env.MAILJET_SECRET_KEY,
    });
    this.logger.log('Mailjet initialized successfully');
  }

  joinGroupEmailTemplate(groupName: string) {
    const subject = `A new member on StudyNest 🎉`;

    const text = `
Hello,

A new member has joined your group "${groupName}" on StudyNest.

Happy studying!  
— The StudyNest Team
  `;

    const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #4CAF50;">New group Member! 🎉</h2>
    <p>A new Member has joined the group 
    <strong>"${groupName}"</strong> on <b>StudyNest</b>.</p>
    
    <p>We're excited to see you collaborate and achieve your study goals together 🚀</p>
  </div>
  `;

    return { subject, text, html };
  }

  async sendJoinGroupMail(to: string, groupName: string) {
    const { subject, text, html } = this.joinGroupEmailTemplate(groupName);
    return this.sendMail(to, subject, text, html);
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    try {
      const result = await this.mailjet
        .post('send', { version: 'v3.1' })
        .request({
          Messages: [
            {
              From: {
                Email: "neststudy18@gmail.com",
                Name: "StudyNest"
              },
              To: [
                {
                  Email: to,
                }
              ],
              Subject: subject,
              TextPart: text,
              HTMLPart: html || text,
            }
          ]
        });

      this.logger.log(`✅ Email sent successfully to ${to}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${to}: ${error.message}`);
      if (error.response) {
        this.logger.error(`Mailjet response: ${JSON.stringify(error.response)}`);
      }
      throw error;
    }
  }

  @Cron("*/1 * * * *")
  async sendReminders() {
    const nowLocal = DateTime.now().setZone("Africa/Johannesburg");
    const twoMinFromNow = nowLocal
      .plus({ hours: 1 })
      .toFormat("yyyy-MM-dd HH:mm:ss");
    const fiveMinFromNow = nowLocal
      .plus({ hours: 24 })
      .toFormat("yyyy-MM-dd HH:mm:ss");

    this.logger.log('Checking for sessions to remind...');

    const { data: sessions, error } = await this.supabaseSer
      .getClient()
      .from("sessions")
      .select("*")
      .in("start_time", [twoMinFromNow, fiveMinFromNow]);

    if (error) {
      this.logger.error(`Failed to fetch sessions: ${error.message}`);
      return;
    }

    if (!sessions || sessions.length === 0) {
      this.logger.log('No sessions found for reminders');
      return;
    }

    this.logger.log(`Found ${sessions.length} sessions for reminders`);

    for (const session of sessions) {
      // fetch group members
      const { data: members, error: memError } = await this.supabaseSer
        .getClient()
        .from("group_members")
        .select("user_id")
        .eq("group_id", session.group_id);

      if (memError) {
        this.logger.error(`Failed to fetch members for group ${session.group_id}: ${memError.message}`);
        continue;
      }

      this.logger.log(`Sending reminders for session "${session.title}" to ${members.length} members`);

      for (const member of members) {
        const { data: student } = await this.supabaseSer
          .getClient()
          .from("students")
          .select("email")
          .eq("user_id", member.user_id)
          .single();

        if (student?.email) {
          const start = DateTime.fromISO(session.start_time, { zone: "utc" });
          const dateFormatted = start.toFormat("dd-LL-yyyy");
          const timeFormatted = start.toFormat("HH:mm");

          try {
            await this.sendMail(
              student.email,
              `Reminder: ${session.title}`,
              `Your study session "${session.title}" starts on ${dateFormatted} at ${timeFormatted} (${session.location})`,
              `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
                 <h3>Reminder: ${session.title}</h3>
                 <p>${session.description}</p>
                 <p><strong>Date:</strong> ${dateFormatted}</p>
                 <p><strong>Time:</strong> ${timeFormatted}</p>
                 <p><strong>Where:</strong> ${session.location}</p>
                 <br>
                 <p>Communication from your Campus Study buddy</p>
               </div>`,
            );
          } catch (emailError) {
            this.logger.error(`Failed to send reminder to ${student.email}: ${emailError.message}`);
          }
        }
      }
    }
  }
}