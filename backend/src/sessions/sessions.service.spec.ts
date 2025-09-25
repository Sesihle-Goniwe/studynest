import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from './sessions.service';
import { SupabaseService } from 'src/supabase/supabase.service';
import { MailerService } from 'src/mailer/mailer.service';

function supabaseMockFactory(options?: {
  insertSession?: any;
  insertError?: any;
  members?: Array<{ user_id: string }>;
  membersError?: any;
  studentByUserId?: Record<string, { email?: string }>;
}) {
  const {
    insertSession = {
      id: 's1',
      title: 'T',
      description: 'D',
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      location: 'R',
      group_id: 'g1',
    },
    insertError = null,
    members = [{ user_id: 'u1' }, { user_id: 'u2' }],
    membersError = null,
    studentByUserId = { u1: { email: 'u1@test.dev' }, u2: { email: 'u2@test.dev' } },
  } = options ?? {};

  return {
    from: jest.fn((table: string) => {
      if (table === 'sessions') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: insertError ? null : [insertSession],
              error: insertError,
            }),
          }),
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [insertSession], error: null }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      }

      if (table === 'group_members') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: members, error: membersError }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }),
        };
      }

      if (table === 'notifications') {
        return {
          insert: jest.fn().mockResolvedValue({ data: [{ id: 'n1' }], error: null }),
        };
      }

      if (table === 'students') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn((col: string, userId: string) => ({
            single: jest.fn().mockResolvedValue({
              data: studentByUserId[userId] ?? null,
              error: studentByUserId[userId] ? null : new Error('not found'),
            }),
          })),
        };
      }

      return { select: jest.fn().mockReturnThis() };
    }),
  };
}

describe('SessionsService', () => {
  let service: SessionsService;
  let supabaseSvc: { getClient: jest.Mock };
  let mailer: { sendMail: jest.Mock };

  beforeEach(async () => {
    supabaseSvc = { getClient: jest.fn() };
    mailer = { sendMail: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: SupabaseService, useValue: supabaseSvc },
        { provide: MailerService, useValue: mailer },
      ],
    }).compile();

    service = module.get(SessionsService);
  });

  it('createSession inserts, notifies, and emails members', async () => {
    const mockClient = supabaseMockFactory();
    supabaseSvc.getClient.mockReturnValue(mockClient);

    const body = {
      group_id: 'g1',
      title: 'Algebra',
      description: 'Ch 1',
      created_by: 'u0',
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 3600000).toISOString(),
      location: 'Room 1',
    };

    const result = await service.createSession(body);
    expect(result).toBeTruthy();
    expect(mailer.sendMail).toHaveBeenCalledTimes(2); // two members with email
  });

  it('createSession still returns session when members fetch fails', async () => {
    const mockClient = supabaseMockFactory({ membersError: new Error('boom') });
    supabaseSvc.getClient.mockReturnValue(mockClient);

    const res = await service.createSession({
      group_id: 'g1',
      title: 'T',
      description: 'D',
      created_by: 'u0',
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      location: 'R',
    });

    expect(res).toBeTruthy();
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it('getSessionByGroup returns data', async () => {
    const mockClient = supabaseMockFactory();
    supabaseSvc.getClient.mockReturnValue(mockClient);

    const res = await service.getSessionByGroup('g1');
    expect(res).toBeTruthy();
  });

  it('deleteSession issues delete eq', async () => {
    const client = supabaseMockFactory();
    supabaseSvc.getClient.mockReturnValue(client);
    await expect(service.deleteSession('s1')).resolves.toBeUndefined();
  });

  it('leaveGroup deletes membership', async () => {
    const client = supabaseMockFactory();
    supabaseSvc.getClient.mockReturnValue(client);
    await expect(service.leaveGroup('g1', 'u1')).resolves.toBeUndefined();
  });

  it('getUserRole returns role', async () => {
    const client = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { role: 'member' }, error: null }),
          }),
        }),
      })),
    };
    supabaseSvc.getClient.mockReturnValue(client);

    const res = await service.getUserRole('g1', 'u1');
    expect(res).toEqual({ role: 'member' });
  });
});
