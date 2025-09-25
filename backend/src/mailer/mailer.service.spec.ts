import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from './mailer.service';
import { SupabaseService } from 'src/supabase/supabase.service';

// ---- Stable nodemailer mock (captures instance you can assert on) ----
const sendMailMock = jest.fn().mockResolvedValue({ messageId: '123' });
const createTransportMock = jest.fn().mockReturnValue({ sendMail: sendMailMock });

jest.mock('nodemailer', () => ({
  createTransport: (...args: any[]) => createTransportMock(...args),
}));

describe('MailerService', () => {
  let service: MailerService;

  beforeEach(async () => {
    process.env.MAIL_USER = 'noreply@test.dev';
    process.env.MAIL_PASS = 'secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerService,
        { provide: SupabaseService, useValue: { getClient: jest.fn() } },
      ],
    }).compile();

    service = module.get(MailerService);
    sendMailMock.mockClear();
    createTransportMock.mockClear();
  });

  it('smoke: service is defined', () => {
    expect(service).toBeDefined();
  });

  it('sendMail delegates to nodemailer transport', async () => {
    await service.sendMail('to@test.dev', 'Subject', 'text', '<b>html</b>');
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: `"StudyNest" ${process.env.MAIL_USER}`,
        to: 'to@test.dev',
        subject: 'Subject',
        text: 'text',
        html: '<b>html</b>',
      }),
    );
  });

  it('sendJoinGroupMail uses the template + sendMail', async () => {
    const spy = jest.spyOn(service, 'sendMail').mockResolvedValue(undefined as any);
    await service.sendJoinGroupMail('owner@test.dev', 'Group A');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toBe('owner@test.dev');        // to
    expect(spy.mock.calls[0][1]).toMatch(/StudyNest/i);         // subject
  });
});
