import { Test, TestingModule } from "@nestjs/testing";
import { ChatsService } from "./chats.service";
import { SupabaseService } from "../supabase/supabase.service";

describe("ChatsService", () => {
  let service: ChatsService;
  let supabaseSer: SupabaseService;

  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { id: "1", message: "hi", user_id: "u1", group_id: "g1", message_type: "text", created_at: new Date() },
      error: null
    }),
    // This handles the getGroupMessages chain
    then: jest.fn((cb) => cb({
      data: [
        { id: "1", message: "hi", user_id: "u1", group_id: "g1", message_type: "text", created_at: new Date() }
      ],
      error: null
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatsService,
        {
          provide: SupabaseService,
          useValue: { getClient: jest.fn(() => mockSupabaseClient) },
        },
      ],
    }).compile();

    service = module.get<ChatsService>(ChatsService);
    supabaseSer = module.get<SupabaseService>(SupabaseService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("sendMessage", () => {
    it("should send a message successfully", async () => {
      const result = await service.sendMessage("hello", "g1", "u1");
      expect(result.success).toBe(true);
      expect(result.message.id).toBe("1");
    });

    it("should fail if missing parameters", async () => {
      const result = await service.sendMessage("", "g1", "u1");
      expect(result.success).toBe(false);
    });
  });

  describe("sendFileMessage", () => {
    it("should send a file message", async () => {
      const result = await service.sendFileMessage("file msg", "g1", "u1", "file1");
      expect(result.success).toBe(true);
      expect(result.message.id).toBe("1");
    });

    it("should fail if missing parameters", async () => {
      const result = await service.sendFileMessage("file msg", "", "u1", "file1");
      expect(result.success).toBe(false);
    });
  });

  describe("getGroupMessages", () => {
    it("should return messages", async () => {
      const result = await service.getGroupMessages("g1");
      expect(result.success).toBe(true);
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.messages[0].id).toBe("1");
    });

    it("should fail if no groupId provided", async () => {
      const result = await service.getGroupMessages("");
      expect(result.success).toBe(false);
      expect(result.messages).toEqual([]);
    });
  });

  describe("editMessage", () => {
    it("should edit a message successfully", async () => {
      const result = await service.editMessage("1", "u1", "new text");
      expect(result.success).toBe(true);
    });

    it("should fail if message too old", async () => {
      // Override single() to return an old message
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: "1", message: "old", user_id: "u1", message_type: "text", created_at: new Date(Date.now() - 10 * 60 * 1000) },
        error: null
      });

      const result = await service.editMessage("1", "u1", "new text");
      expect(result.success).toBe(false);
    });
  });

  describe("deleteMessage", () => {
    it("should delete a message successfully", async () => {
      const result = await service.deleteMessage("1", "u1");
      expect(result.success).toBe(true);
    });

    it("should fail if message too old", async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: "1", message: "old", user_id: "u1", created_at: new Date(Date.now() - 10 * 60 * 1000) },
        error: null
      });

      const result = await service.deleteMessage("1", "u1");
      expect(result.success).toBe(false);
    });
  });
});

