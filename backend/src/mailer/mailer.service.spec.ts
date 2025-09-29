import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { SupabaseService } from '../supabase/supabase.service';

// Mock Mailjet properly
const mockMailjet = {
  post: jest.fn().mockReturnThis(),
  request: jest.fn(),
};

jest.mock('node-mailjet', () => {
  return {
    __esModule: true,
    default: jest.fn(() => mockMailjet),
  };
});

// Mock SupabaseService
const mockSupabaseService = {
  getClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    single: jest.fn(),
  }),
};

// Mock Luxon DateTime
jest.mock('luxon', () => {
  const actualLuxon = jest.requireActual('luxon');
  return {
    ...actualLuxon,
    DateTime: {
      now: jest.fn(),
      fromISO: jest.fn(),
    },
  };
});

describe('MailerService', () => {
  let service: MailerService;
  let supabaseService: SupabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<MailerService>(MailerService);
    supabaseService = module.get<SupabaseService>(SupabaseService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('joinGroupEmailTemplate', () => {
    it('should generate correct email template for group join', () => {
      const groupName = 'Study Group A';
      const result = service.joinGroupEmailTemplate(groupName);

      expect(result.subject).toBe('A new member on StudyNest 🎉');
      expect(result.text).toContain(groupName);
      expect(result.html).toContain(groupName);
      expect(result.html).toContain('New group Member! 🎉');
    });

    it('should include group name in both text and html', () => {
      const groupName = 'Test Group';
      const result = service.joinGroupEmailTemplate(groupName);

      expect(result.text).toContain(`"${groupName}"`);
      expect(result.html).toContain(`<strong>"${groupName}"</strong>`);
    });
  });

  describe('sendJoinGroupMail', () => {
    it('should call sendMail with correct parameters', async () => {
      const to = 'test@example.com';
      const groupName = 'Study Group';
      const sendMailSpy = jest.spyOn(service, 'sendMail').mockResolvedValue(undefined);

      await service.sendJoinGroupMail(to, groupName);

      expect(sendMailSpy).toHaveBeenCalledWith(
        to,
        'A new member on StudyNest 🎉',
        expect.stringContaining(groupName),
        expect.stringContaining(groupName),
      );
    });
  });

  describe('sendMail', () => {
    it('should send email successfully', async () => {
      const to = 'test@example.com';
      const subject = 'Test Subject';
      const text = 'Test text content';
      const html = '<p>Test HTML content</p>';

      mockMailjet.post.mockReturnValue({
        request: jest.fn().mockResolvedValue({}),
      });

      await service.sendMail(to, subject, text, html);

      expect(mockMailjet.post).toHaveBeenCalledWith('send', { version: 'v3.1' });
      expect(mockMailjet.post().request).toHaveBeenCalledWith({
        Messages: [
          {
            From: {
              Email: 'neststudy18@gmail.com',
              Name: 'StudyNest',
            },
            To: [
              {
                Email: to,
              },
            ],
            Subject: subject,
            TextPart: text,
            HTMLPart: html,
          },
        ],
      });
    });

    it('should handle email sending failure', async () => {
      const to = 'test@example.com';
      const subject = 'Test Subject';
      const text = 'Test text content';
      const error = new Error('Mailjet API error');

      mockMailjet.post.mockReturnValue({
        request: jest.fn().mockRejectedValue(error),
      });

      const loggerSpy = jest.spyOn(Logger.prototype, 'error');

      await expect(service.sendMail(to, subject, text)).rejects.toThrow('Mailjet API error');
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to send email'));
    });

    it('should use text as HTML when html parameter is not provided', async () => {
      const to = 'test@example.com';
      const subject = 'Test Subject';
      const text = 'Test text content';

      mockMailjet.post.mockReturnValue({
        request: jest.fn().mockResolvedValue({}),
      });

      await service.sendMail(to, subject, text);

      expect(mockMailjet.post().request).toHaveBeenCalledWith(
        expect.objectContaining({
          Messages: [
            expect.objectContaining({
              HTMLPart: text,
            }),
          ],
        }),
      );
    });
  });

  describe('sendReminders', () => {
    beforeEach(() => {
      // Mock DateTime.now()
      const { DateTime } = require('luxon');
      (DateTime.now as jest.Mock) = jest.fn().mockReturnValue({
        setZone: jest.fn().mockReturnThis(),
        plus: jest.fn().mockReturnThis(),
        toFormat: jest.fn().mockReturnValue('2024-01-01 10:00:00'),
      });

      // Mock DateTime.fromISO
      (DateTime.fromISO as jest.Mock) = jest.fn().mockReturnValue({
        toFormat: jest.fn().mockImplementation((format: string) => {
          if (format === 'dd-LL-yyyy') return '01-01-2024';
          if (format === 'HH:mm') return '10:00';
          return '';
        }),
      });
    });

    it('should not send reminders when no sessions found', async () => {
      const supabaseClient = mockSupabaseService.getClient();
      (supabaseClient.from().select().in as jest.Mock).mockReturnValue({
        data: [],
        error: null,
      });

      const sendMailSpy = jest.spyOn(service, 'sendMail').mockResolvedValue(undefined);

      await service.sendReminders();

      expect(sendMailSpy).not.toHaveBeenCalled();
    });

    it('should handle session fetch error', async () => {
      const supabaseClient = mockSupabaseService.getClient();
      (supabaseClient.from().select().in as jest.Mock).mockReturnValue({
        data: null,
        error: { message: 'Database error' },
      });

      const loggerSpy = jest.spyOn(Logger.prototype, 'error');

      await service.sendReminders();

      expect(loggerSpy).toHaveBeenCalledWith('Failed to fetch sessions: Database error');
    });

    it('should send reminders for sessions with members', async () => {
      const mockSessions = [
        {
          id: 1,
          group_id: 1,
          title: 'Math Study Session',
          description: 'Calculus review',
          start_time: '2024-01-01T10:00:00Z',
          location: 'Library',
        },
      ];

      const mockMembers = [
        { user_id: 1 },
        { user_id: 2 },
      ];

      const mockStudents = [
        { email: 'student1@example.com' },
        { email: 'student2@example.com' },
      ];

      const supabaseClient = mockSupabaseService.getClient();
      
      // Mock sessions query
      (supabaseClient.from().select().in as jest.Mock).mockReturnValueOnce({
        data: mockSessions,
        error: null,
      });

      // Mock members query
      (supabaseClient.from().select().eq as jest.Mock).mockReturnValueOnce({
        data: mockMembers,
        error: null,
      });

      // Mock student queries
      (supabaseClient.from().select().eq().single as jest.Mock)
        .mockResolvedValueOnce({ data: mockStudents[0] }) // First student
        .mockResolvedValueOnce({ data: mockStudents[1] }); // Second student

      const sendMailSpy = jest.spyOn(service, 'sendMail').mockResolvedValue(undefined);

      await service.sendReminders();

      expect(sendMailSpy).toHaveBeenCalledTimes(2);
      expect(sendMailSpy).toHaveBeenCalledWith(
        'student1@example.com',
        'Reminder: Math Study Session',
        expect.stringContaining('Math Study Session'),
        expect.stringContaining('Math Study Session'),
      );
    });

    it('should continue processing when member fetch fails for one group', async () => {
      const mockSessions = [
        {
          id: 1,
          group_id: 1,
          title: 'Session A',
          description: 'Description A',
          start_time: '2024-01-01T10:00:00Z',
          location: 'Location A',
        },
        {
          id: 2,
          group_id: 2,
          title: 'Session B',
          description: 'Description B',
          start_time: '2024-01-01T11:00:00Z',
          location: 'Location B',
        },
      ];

      const supabaseClient = mockSupabaseService.getClient();
      
      // Mock sessions query
      (supabaseClient.from().select().in as jest.Mock).mockReturnValueOnce({
        data: mockSessions,
        error: null,
      });

      // Mock members query - first fails, second succeeds
      (supabaseClient.from().select().eq as jest.Mock)
        .mockReturnValueOnce({
          data: null,
          error: { message: 'Member fetch error' },
        })
        .mockReturnValueOnce({
          data: [{ user_id: 1 }],
          error: null,
        });

      // Mock student query for second session
      (supabaseClient.from().select().eq().single as jest.Mock).mockResolvedValueOnce({
        data: { email: 'student@example.com' },
      });

      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      const sendMailSpy = jest.spyOn(service, 'sendMail').mockResolvedValue(undefined);

      await service.sendReminders();

      expect(loggerSpy).toHaveBeenCalledWith('Failed to fetch members for group 1: Member fetch error');
      expect(sendMailSpy).toHaveBeenCalledTimes(1); // Should still send for second session
    });

    it('should handle email sending errors for individual members', async () => {
      const mockSessions = [
        {
          id: 1,
          group_id: 1,
          title: 'Test Session',
          description: 'Test Description',
          start_time: '2024-01-01T10:00:00Z',
          location: 'Test Location',
        },
      ];

      const mockMembers = [
        { user_id: 1 },
        { user_id: 2 },
      ];

      const supabaseClient = mockSupabaseService.getClient();
      
      (supabaseClient.from().select().in as jest.Mock).mockReturnValueOnce({
        data: mockSessions,
        error: null,
      });

      (supabaseClient.from().select().eq as jest.Mock).mockReturnValueOnce({
        data: mockMembers,
        error: null,
      });

      (supabaseClient.from().select().eq().single as jest.Mock)
        .mockResolvedValueOnce({ data: { email: 'student1@example.com' } })
        .mockResolvedValueOnce({ data: { email: 'student2@example.com' } });

      const sendMailSpy = jest.spyOn(service, 'sendMail')
        .mockResolvedValueOnce(undefined) // First email succeeds
        .mockRejectedValueOnce(new Error('Email failed')); // Second email fails

      const loggerSpy = jest.spyOn(Logger.prototype, 'error');

      await service.sendReminders();

      expect(sendMailSpy).toHaveBeenCalledTimes(2);
      expect(loggerSpy).toHaveBeenCalledWith('Failed to send reminder to student2@example.com: Email failed');
    });
  });

  describe('Mailjet initialization', () => {
    it('should initialize Mailjet with environment variables', () => {
      // The Mailjet initialization happens in the constructor
      // We can verify it was called correctly by checking the mock
      const { default: Mailjet } = require('node-mailjet');
      expect(Mailjet).toHaveBeenCalledWith({
        apiKey: process.env.MAILJET_API_KEY,
        apiSecret: process.env.MAILJET_SECRET_KEY,
      });
    });
  });
});