import { Test, TestingModule } from '@nestjs/testing';
import { ReminderService } from './reminder.service';
import { SupabaseService } from 'src/supabase/supabase.service';
import { MailerService } from 'src/mailer/mailer.service';

describe('ReminderService', () => {
  let service: ReminderService;
  let supabaseMock: any;
  let mailerMock: any;

  beforeEach(async () => {
    // Mock Supabase client
    supabaseMock = {
      getClient: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        //single: jest.fn().mockResolvedValue({ data: { email: 'student@test.com' }, error: null }),
         single: jest.fn(),
      }),
    };

    // Mock Mailer
    mailerMock = {
      sendMail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReminderService,
        { provide: SupabaseService, useValue: supabaseMock },
        { provide: MailerService, useValue: mailerMock },
      ],
    }).compile();

    service = module.get<ReminderService>(ReminderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch sessions and send reminders', async () => {
    const mockSession = [
      {
        id: 'session1',
        title: 'Test Session',
        description: 'Description',
        start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1h later
        end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        location: 'Room 101',
        group_id: 'group1',
      },
    ];

    // Mock sessions fetch
    supabaseMock.getClient().from().select().gte().lte.mockResolvedValue({ data: mockSession, error: null });

    // Mock group members fetch
    supabaseMock.getClient().from().select().eq.mockResolvedValue({ data: [{ user_id: 'student1' }], error: null });

    // Mock student fetch
supabaseMock.getClient().from().select().eq().single.mockResolvedValue(
  {
  data: { email: 'student@test.com' },
  error: null,
});


    await service.sendReminder();

    expect(mailerMock.sendMail).toHaveBeenCalledWith(
      'student@test.com',
      'Reminder: Study Session "Test Session"',
      expect.stringContaining('Your study session starts at'),
      expect.stringContaining('<h3>Reminder: Test Session</h3>'),
    );
  });

  it('should handle no sessions gracefully', async () => {
    supabaseMock.getClient().from().select().gte().lte.mockResolvedValue({ data: [], error: null });
    await expect(service.sendReminder()).resolves.not.toThrow();
    expect(mailerMock.sendMail).not.toHaveBeenCalled();
  });
});
