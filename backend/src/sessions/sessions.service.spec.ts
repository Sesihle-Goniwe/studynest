import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from './sessions.service';
import { SupabaseService } from 'src/supabase/supabase.service';
import { MailerService } from 'src/mailer/mailer.service';
import { DateTime } from 'luxon';

describe('SessionsService', () => {
  let service: SessionsService;
  let supabaseMock: any;
  let mailerMock: any;

  // Chainable Supabase mock factory
  const chainableMock = () => ({
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn(),
  });

  beforeEach(async () => {
    supabaseMock = {
      getClient: jest.fn().mockReturnValue(chainableMock()),
    };

    mailerMock = {
      sendMail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: SupabaseService, useValue: supabaseMock },
        { provide: MailerService, useValue: mailerMock },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create session, notify members, and send emails', async () => {
      const mockSession = {
        id: 'session1',
        title: 'Test Session',
        description: 'Description',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        location: 'Room 101',
        group_id: 'group1',
      };

      const mockMembers = [{ user_id: 'student1' }];
      const mockStudent = { email: 'student@test.com' };

      // Mock session insert
      supabaseMock.getClient().from().insert().select.mockResolvedValue({
        data: [mockSession],
        error: null,
      });

      // Mock fetching group members
      supabaseMock.getClient().from().select().eq.mockResolvedValue({
        data: mockMembers,
        error: null,
      });

      // Mock fetching student email
      supabaseMock.getClient().from().select().eq().single.mockResolvedValue({
        data: mockStudent,
        error: null,
      });

      // Mock notification insert
      supabaseMock.getClient().from().insert.mockResolvedValue({ data: [], error: null });

      const result = await service.createSession({
        group_id: 'group1',
        title: 'Test Session',
        description: 'Description',
        created_by: 'teacher1',
        start_time: mockSession.start_time,
        end_time: mockSession.end_time,
        location: 'Room 101',
      });

      expect(result).toEqual(mockSession);
      expect(mailerMock.sendMail).toHaveBeenCalledWith(
        'student@test.com',
        `New Study Session: ${mockSession.title}`,
        expect.stringContaining('A session is scheduled on'),
        expect.stringContaining(`<h3>${mockSession.title}</h3>`),
      );
    });
  });

  describe('leaveGroup', () => {
    it('should remove user from group', async () => {
      // Mock delete chain
      supabaseMock.getClient().from().delete().eq().eq.mockResolvedValue({ error: null });

      await expect(service.leaveGroup('group1', 'student1')).resolves.not.toThrow();
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', async () => {
      supabaseMock.getClient().from().delete().eq.mockResolvedValue({ error: null });

      await expect(service.deleteSession('session1')).resolves.not.toThrow();
    });
  });

  describe('getSessionByGroup', () => {
    it('should return sessions by group', async () => {
      const mockData = [{ id: 'session1', group_id: 'group1' }];
      supabaseMock.getClient().from().select().eq.mockResolvedValue({ data: mockData, error: null });

      const result = await service.getSessionByGroup('group1');
      expect(result).toEqual(mockData);
    });
  });

  describe('getUserRole', () => {
    it('should return user role', async () => {
      const mockData = { role: 'member' };
      supabaseMock.getClient().from().select().eq().eq().single.mockResolvedValue({ data: mockData, error: null });

      const result = await service.getUserRole('group1', 'student1');
      expect(result).toEqual(mockData);
    });
  });
});
