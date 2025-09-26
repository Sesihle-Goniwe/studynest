import { Test, TestingModule } from "@nestjs/testing";
import { NotificationsService } from "./notifications.service";
import { SupabaseService } from "src/supabase/supabase.service";
import { MailerService } from "../mailer/mailer.service";

describe("NotificationsService", () => {
  let service: NotificationsService;
  let supabaseMock: any;
  let mailerMock: any;

  beforeEach(async () => {
    // Supabase client mock
    const mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [{ id: 1, message: "Test notification" }],
        error: null,
      }),
      single: jest
        .fn()
        .mockResolvedValueOnce({
          data: { id: 1, user_id: "user123", message: "hello" },
          error: null,
        }) // insert notification
        .mockResolvedValueOnce({
          data: { email: "test@example.com" },
          error: null,
        }) // get user email
        .mockResolvedValue({ data: { id: 1, read: true }, error: null }), // mark as read
    };

    supabaseMock = {
      getClient: jest.fn().mockReturnValue(mockSupabaseClient),
    };

    // Mailer mock
    mailerMock = {
      sendMail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: SupabaseService, useValue: supabaseMock },
        { provide: MailerService, useValue: mailerMock },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getAllNotifications", () => {
    it("should return notifications from supabase", async () => {
      const mockData = [{ id: 1, message: "Test notification" }];
      // override order mock for this test
      supabaseMock
        .getClient()
        .order.mockResolvedValue({ data: mockData, error: null });

      const result = await service.getAllNotifications();
      expect(result).toEqual(mockData);
    });
  });

  describe("createNotification", () => {
    it("should insert notification and send email", async () => {
      const result = await service.createNotification("user123", "hello");
      expect(result).toEqual({ id: 1, user_id: "user123", message: "hello" });
      expect(mailerMock.sendMail).toHaveBeenCalledWith(
        "test@example.com",
        "hello",
        "hello",
      );
    });
  });

  describe("markAsRead", () => {
    it("should update notification as read", async () => {
      const mockData = [{ id: "1", read: true }];
      supabaseMock
        .getClient()
        .from()
        .update()
        .eq()
        .select.mockResolvedValue({ data: mockData, error: null });
      const result = await service.markAsRead("1");
      expect(result).toEqual(mockData[0]);
    });
  });

  describe("clearNotifications", () => {
    it("should delete notifications for a user", async () => {
      supabaseMock
        .getClient()
        .from()
        .delete()
        .eq.mockResolvedValue({ data: [], error: null });
      const result = await service.clearNotifications("user123");
      expect(result).toEqual([]);
    });
  });
});
