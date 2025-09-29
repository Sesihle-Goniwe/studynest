import { Test, TestingModule } from "@nestjs/testing";
import { ChatsController } from "./chats.controller";
import { ChatsService } from "./chats.service";
import { FilesService } from "../files/files.service";

describe("ChatsController", () => {
  let controller: ChatsController;
  let chatsService: ChatsService;
  let filesService: FilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatsController],
      providers: [
        {
          provide: ChatsService,
          useValue: {
            sendMessage: jest.fn(),
            sendFileMessage: jest.fn(),
            getGroupMessages: jest.fn(),
            editMessage: jest.fn(),
            deleteMessage: jest.fn(),
          },
        },
        {
          provide: FilesService,
          useValue: {
            upload: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ChatsController>(ChatsController);
    chatsService = module.get<ChatsService>(ChatsService);
    filesService = module.get<FilesService>(FilesService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("ping", () => {
    it("should return ok message", () => {
      expect(controller.ping()).toEqual({ ok: true, msg: 'chats controller live' });
    });
  });

  describe("sendMessage", () => {
    it("should send a message successfully", async () => {
      const mockResult: { success: boolean; message: any; error?: any } = { success: true, message: "test message" };
      jest.spyOn(chatsService, 'sendMessage').mockResolvedValue(mockResult);

      const result = await controller.sendMessage({ text: "hello", groupId: "1", userId: "u1" });
      expect(result).toEqual(mockResult);
    });

    it("should throw an error if sendMessage fails", async () => {
      jest.spyOn(chatsService, 'sendMessage').mockResolvedValue({ success: false, message: null });

      await expect(controller.sendMessage({ text: "hi", groupId: "1", userId: "u1" }))
        .rejects
        .toThrow('Failed to send message');
    });
  });

  describe("uploadFileToChat", () => {
    it("should upload file and send file message", async () => {
      const mockFile = { originalname: "test.txt" } as Express.Multer.File;
      const body = { userId: "u1", groupId: "g1" };

      // Type-safe mock results
      const uploadResult: { data?: { id: string }; error?: any } = { data: { id: "file1" } };
      const messageResult: { success: boolean; message: string; error?: any } = { success: true, message: "file message" };

      jest.spyOn(filesService, 'upload').mockResolvedValue(uploadResult);
      jest.spyOn(chatsService, 'sendFileMessage').mockResolvedValue(messageResult);

      const result = await controller.uploadFileToChat(mockFile, body);

      expect(result).toEqual({
        success: true,
        file: uploadResult.data,
        message: messageResult.message
      });
    });

    it("should throw error if file upload fails", async () => {
      const mockFile = { originalname: "fail.txt" } as Express.Multer.File;
      const body = { userId: "u1", groupId: "g1" };

      // Use data undefined to match optional type
      jest.spyOn(filesService, 'upload').mockResolvedValue({ data: undefined, error: 'Upload failed' });

      await expect(controller.uploadFileToChat(mockFile, body))
        .rejects
        .toThrow('Failed to upload file');
    });
  });

  describe("getGroupMessages", () => {
    it("should return group messages", async () => {
      const mockMessages: { success: boolean; messages: any[] } = { success: true, messages: [] };
      jest.spyOn(chatsService, 'getGroupMessages').mockResolvedValue(mockMessages);

      const result = await controller.getGroupMessages("g1");
      expect(result).toEqual(mockMessages);
    });

    it("should throw error if fetching fails", async () => {
      jest.spyOn(chatsService, 'getGroupMessages').mockResolvedValue({ success: false, messages: [] });

      await expect(controller.getGroupMessages("g1"))
        .rejects
        .toThrow('Failed to load messages');
    });
  });

  describe("editMessage", () => {
    it("should edit a message", async () => {
      const mockResult: { success: boolean; message?: any } = { success: true, message: "edited" };
      jest.spyOn(chatsService, 'editMessage').mockResolvedValue(mockResult);

      const result = await controller.editMessage("m1", "u1", "new text");
      expect(result).toEqual(mockResult);
    });

    it("should throw error if edit fails", async () => {
      jest.spyOn(chatsService, 'editMessage').mockResolvedValue({ success: false });

      await expect(controller.editMessage("m1", "u1", "new text"))
        .rejects
        .toThrow('Failed to edit message');
    });
  });

  describe("deleteMessage", () => {
    it("should delete a message", async () => {
      const mockResult: { success: boolean } = { success: true };
      jest.spyOn(chatsService, 'deleteMessage').mockResolvedValue(mockResult);

      const result = await controller.deleteMessage("m1", "u1");
      expect(result).toEqual(mockResult);
    });

    it("should throw error if delete fails", async () => {
      jest.spyOn(chatsService, 'deleteMessage').mockResolvedValue({ success: false });

      await expect(controller.deleteMessage("m1", "u1"))
        .rejects
        .toThrow('Failed to delete message');
    });
  });
});

