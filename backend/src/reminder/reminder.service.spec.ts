import { Test, TestingModule } from "@nestjs/testing";
import { ReminderService } from "./reminder.service";
import { SupabaseService } from "src/supabase/supabase.service";
import { MailerService } from "src/mailer/mailer.service";
import { Logger } from "@nestjs/common";

type StudentMap = Record<string, { email?: string }>;

function makeSupabaseClientMock(options: {
  sessions?: any[] | null;
  sessionsError?: any;
  members?: Array<{ user_id: string }> | null;
  membersError?: any;
  studentByUserId?: StudentMap;
}) {
  const {
    sessions = [],
    sessionsError = null,
    members = [],
    membersError = null,
    studentByUserId = {},
  } = options;

  return {
    from: jest.fn((table: string) => {
      if (table === "sessions") {
        // await ...select('*').gte(...).lte(...)  -> resolves here
        return {
          select: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest
            .fn()
            .mockResolvedValue({ data: sessions, error: sessionsError }),
        };
      }

      if (table === "group_members") {
        // await ...select('user_id').eq('group_id', ...) -> resolves on eq
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest
            .fn()
            .mockResolvedValue({ data: members, error: membersError }),
        };
      }

      if (table === "students") {
        // await ...select('email').eq('user_id', X).single() -> resolves on single()
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn((col: string, userId: string) => ({
            single: jest.fn().mockResolvedValue({
              data: studentByUserId[userId] ?? null,
              error: studentByUserId[userId] ? null : new Error("not found"),
            }),
          })),
        };
      }

      // default
      return { select: jest.fn().mockReturnThis() };
    }),
  };
}

describe("ReminderService", () => {
  let service: ReminderService;
  let supabaseSvc: { getClient: jest.Mock };
  let mailer: { sendMail: jest.Mock };

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T10:00:00Z"));

    supabaseSvc = { getClient: jest.fn() };
    mailer = { sendMail: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReminderService,
        { provide: SupabaseService, useValue: supabaseSvc },
        { provide: MailerService, useValue: mailer },
      ],
    }).compile();

    service = module.get(ReminderService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });

  it("sends 1h reminder to group members", async () => {
    const now = Date.now();
    const oneHour = new Date(now + 60 * 60 * 1000).toISOString();

    supabaseSvc.getClient.mockReturnValue(
      makeSupabaseClientMock({
        sessions: [
          {
            id: "s1",
            title: "Test 1H",
            description: "Desc",
            start_time: oneHour,
            end_time: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
            location: "Room 1",
            group_id: "g1",
          },
        ],
        members: [{ user_id: "u1" }],
        studentByUserId: { u1: { email: "u1@test.com" } },
      }),
    );

    await service.sendReminder();

    expect(mailer.sendMail).toHaveBeenCalledTimes(1);
    expect(mailer.sendMail).toHaveBeenCalledWith(
      "u1@test.com",
      'Reminder: Study Session "Test 1H"',
      expect.stringContaining("1 hour"),
      expect.stringContaining("<h3>Reminder: Test 1H</h3>"),
    );
  });

  it("sends 24h reminder to group members", async () => {
    const now = Date.now();
    const day = new Date(now + 24 * 60 * 60 * 1000).toISOString();

    supabaseSvc.getClient.mockReturnValue(
      makeSupabaseClientMock({
        sessions: [
          {
            id: "s24",
            title: "Test 24H",
            description: "Desc",
            start_time: day,
            end_time: new Date(now + 25 * 60 * 60 * 1000).toISOString(),
            location: "Room 2",
            group_id: "g2",
          },
        ],
        members: [{ user_id: "u2" }],
        studentByUserId: { u2: { email: "u2@test.com" } },
      }),
    );

    await service.sendReminder();

    expect(mailer.sendMail).toHaveBeenCalledTimes(1);
    expect(mailer.sendMail).toHaveBeenCalledWith(
      "u2@test.com",
      'Reminder: Study Session "Test 24H"',
      expect.stringContaining("24 hours"),
      expect.stringContaining("<h3>Reminder: Test 24H</h3>"),
    );
  });

  it("does nothing if sessions are not at 1h/24h boundaries", async () => {
    const now = Date.now();
    const twoHours = new Date(now + 2 * 60 * 60 * 1000).toISOString();

    supabaseSvc.getClient.mockReturnValue(
      makeSupabaseClientMock({
        sessions: [
          {
            id: "s2h",
            title: "2H Session",
            description: "Desc",
            start_time: twoHours,
            end_time: new Date(now + 3 * 60 * 60 * 1000).toISOString(),
            location: "Room 3",
            group_id: "g3",
          },
        ],
        members: [{ user_id: "u3" }],
        studentByUserId: { u3: { email: "u3@test.com" } },
      }),
    );

    await service.sendReminder();
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it("handles no sessions gracefully", async () => {
    supabaseSvc.getClient.mockReturnValue(
      makeSupabaseClientMock({ sessions: [] }),
    );

    await expect(service.sendReminder()).resolves.not.toThrow();
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it("logs when sessions query errors (and skips sending)", async () => {
    const errorSpy = jest.spyOn((service as any).logger as Logger, "error");

    supabaseSvc.getClient.mockReturnValue(
      makeSupabaseClientMock({
        sessions: null,
        sessionsError: new Error("boom"),
      }),
    );

    await service.sendReminder();

    expect(errorSpy).toHaveBeenCalled();
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });
});
