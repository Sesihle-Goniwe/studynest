import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { SupabaseService } from "src/supabase/supabase.service";
import { MailerService } from "src/mailer/mailer.service";
@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly supabaseSer: SupabaseService,
    private readonly mailer: MailerService,
  ) {}

  @Cron("*/5 * * * *")
  async sendReminder() {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const twenty4 = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: session, error } = await this.supabaseSer
      .getClient()
      .from("sessions")
      .select("*")
      .gte("start_time", now.toISOString())
      .lte("start_time", twenty4.toISOString());

    if (error) {
      this.logger.error("failed to fetch sessions", error.message);
    }

    const sessions = session;

    for (const session of sessions || []) {
      const start = new Date(session.start_time);
      const diffMs = start.getTime() - now.getTime();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));

      let reminderType: "1h" | "24h" | null = null;
      if (diffHours === 1) reminderType = "1h";
      if (diffHours === 24) reminderType = "24h";

      if (!reminderType) continue;

      // 2. Fetch group members
      const { data: members, error: membersErr } = await this.supabaseSer
        .getClient()
        .from("group_members")
        .select("user_id")
        .eq("group_id", session.group_id);

      if (membersErr) {
        this.logger.error(
          `Failed to fetch members for group ${session.group_id}`,
        );
        continue;
      }

      // 3. Send reminder emails
      for (const member of members) {
        const { data: student, error: studentErr } = await this.supabaseSer
          .getClient()
          .from("students")
          .select("email")
          .eq("user_id", member.user_id)
          .single();

        if (!studentErr && student?.email) {
          await this.mailer.sendMail(
            student.email,
            `Reminder: Study Session "${session.title}"`,
            `Your study session starts at ${session.start_time} in ${reminderType === "1h" ? "1 hour" : "24 hours"}.`,
            `<h3>Reminder: ${session.title}</h3>
             <p>${session.description}</p>
             <p><strong>When:</strong> ${session.start_time} - ${session.end_time}</p>
             <p><strong>Where:</strong> ${session.location}</p>
             <p><em>This is a ${reminderType} reminder.</em></p>`,
          );

          this.logger.log(
            `Sent ${reminderType} reminder to ${student.email} for session ${session.id}`,
          );
        }
      }
    }
  }
}
