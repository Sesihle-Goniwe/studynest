import { Test, TestingModule } from "@nestjs/testing";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";
import {
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import type { Express } from "express";

describe("FilesController", () => {
  let controller: FilesController;
  let service: FilesService;

  const mockFilesService = {
    upload: jest.fn(),
    getSignedUrl: jest.fn(),
    summarize: jest.fn(),
  };

  const mockFile: Express.Multer.File = {
    fieldname: "file",
    originalname: "test.pdf",
    encoding: "7bit",
    mimetype: "application/pdf",
    size: 1024,
    buffer: Buffer.from("test file content"),
    stream: null as any,
    destination: "",
    filename: "",
    path: "",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    service = module.get<FilesService>(FilesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("uploadFile", () => {
    it("should upload a file successfully", async () => {
      const userId = "user123";
      const body = { userId };
      const expectedResult = {
        message: "File uploaded successfully",
        data: {
          id: "file123",
          user_id: userId,
          file_name: "test.pdf",
          file_path: `public/${userId}/123456789-test.pdf`,
          file_size: 1024,
          mime_type: "application/pdf",
        },
      };

      mockFilesService.upload.mockResolvedValue(expectedResult);

      const result = await controller.uploadFile(mockFile, body);

      expect(result).toEqual(expectedResult);
      expect(service.upload).toHaveBeenCalledWith(mockFile, userId);
    });

    it("should handle upload errors", async () => {
      const userId = "user123";
      const body = { userId };

      mockFilesService.upload.mockRejectedValue(
        new InternalServerErrorException("Failed to upload file to storage."),
      );

      await expect(controller.uploadFile(mockFile, body)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it("should handle missing file", async () => {
      const userId = "user123";
      const body = { userId };

      mockFilesService.upload.mockRejectedValue(
        new InternalServerErrorException("File is undefined."),
      );

      await expect(
        controller.uploadFile(undefined as any, body),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("getFileUrl", () => {
    it("should get signed URL successfully", async () => {
      const fileId = "file123";
      const userId = "user123";
      const expectedResult = {
        signedUrl: "https://example.com/signed-url",
      };

      mockFilesService.getSignedUrl.mockResolvedValue(expectedResult);

      const result = await controller.getFileUrl(fileId, userId);

      expect(result).toEqual(expectedResult);
      expect(service.getSignedUrl).toHaveBeenCalledWith(fileId, userId);
    });

    it("should handle file not found", async () => {
      const fileId = "nonexistent";
      const userId = "user123";

      mockFilesService.getSignedUrl.mockRejectedValue(
        new NotFoundException("File not found or access denied."),
      );

      await expect(controller.getFileUrl(fileId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should handle unauthorized access", async () => {
      const fileId = "file123";
      const userId = "wronguser";

      mockFilesService.getSignedUrl.mockRejectedValue(
        new NotFoundException("File not found or access denied."),
      );

      await expect(controller.getFileUrl(fileId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("summarizeNote", () => {
    it("should summarize file successfully", async () => {
      const fileId = "file123";
      const body = { userId: "user123" };
      const expectedResult = {
        summary: "This is a summary of the PDF content...",
      };

      mockFilesService.summarize.mockResolvedValue(expectedResult);

      const result = await controller.summarizeNote(fileId, body);

      expect(result).toEqual(expectedResult);
      expect(service.summarize).toHaveBeenCalledWith(fileId, body.userId);
    });

    it("should handle summarization errors", async () => {
      const fileId = "file123";
      const body = { userId: "user123" };

      mockFilesService.summarize.mockRejectedValue(
        new InternalServerErrorException(
          "An unexpected error occurred during summarization.",
        ),
      );

      await expect(controller.summarizeNote(fileId, body)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it("should handle file not found during summarization", async () => {
      const fileId = "nonexistent";
      const body = { userId: "user123" };

      mockFilesService.summarize.mockRejectedValue(
        new NotFoundException("File not found or access denied."),
      );

      await expect(controller.summarizeNote(fileId, body)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
