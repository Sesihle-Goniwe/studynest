import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
@Injectable()
export class MailerService {

        private readonly logger = new Logger(MailerService.name);
        private transporter;

        constructor()
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



}
