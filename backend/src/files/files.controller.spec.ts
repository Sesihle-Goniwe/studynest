import { Test, TestingModule } from "@nestjs/testing";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";
import {
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import type { Express } from "express";

describe("FilesController", () => {
  let controller: FilesController;
  let service: FilesService;

  // This mock will stand in for the real FilesService
  const mockFilesService = {
    upload: jest.fn(),
    getPersonalFileSignedUrl: jest.fn(),
    getGroupFileSignedUrl: jest.fn(),
    summarize: jest.fn(),
  };

  // A mock file object to use in tests
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
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // --- Tests for uploadFile ---
  describe("uploadFile", () => {
    it("should call service.upload and return the result on success", async () => {
      const userId = "user-abc";
      const body = { userId };
      const expectedResult = { message: "File uploaded successfully" };
      mockFilesService.upload.mockResolvedValue(expectedResult);

      const result = await controller.uploadFile(mockFile, body);

      expect(result).toEqual(expectedResult);
      expect(service.upload).toHaveBeenCalledWith(mockFile, userId);
      expect(service.upload).toHaveBeenCalledTimes(1);
    });

    it("should forward exceptions from service.upload", async () => {
      const userId = "user-abc";
      const body = { userId };
      const error = new InternalServerErrorException("Upload failed");
      mockFilesService.upload.mockRejectedValue(error);

      await expect(controller.uploadFile(mockFile, body)).rejects.toThrow(InternalServerErrorException);
    });
  });

  // --- Tests for getPersonalSignedUrl ---
  describe("getPersonalSignedUrl", () => {
    it("should call service.getPersonalFileSignedUrl and return the result", async () => {
      const fileId = "file-123";
      const userId = "user-abc";
      const expectedUrl = { signedUrl: "https://example.com/personal-url" };
      mockFilesService.getPersonalFileSignedUrl.mockResolvedValue(expectedUrl);

      const result = await controller.getPersonalSignedUrl(fileId, userId);

      expect(result).toEqual(expectedUrl);
      expect(service.getPersonalFileSignedUrl).toHaveBeenCalledWith(fileId, userId);
    });

    it("should forward NotFoundException from the service", async () => {
      const fileId = "file-404";
      const userId = "user-abc";
      const error = new NotFoundException("File not found");
      mockFilesService.getPersonalFileSignedUrl.mockRejectedValue(error);

      await expect(controller.getPersonalSignedUrl(fileId, userId)).rejects.toThrow(NotFoundException);
    });
  });

  // --- Tests for getGroupSignedUrl ---
  describe("getGroupSignedUrl", () => {
    it("should call service.getGroupFileSignedUrl and return the result", async () => {
        const fileId = "file-group-123";
        const userId = "user-group-abc";
        const expectedUrl = { signedUrl: "https://example.com/group-url" };
        mockFilesService.getGroupFileSignedUrl.mockResolvedValue(expectedUrl);
  
        const result = await controller.getGroupSignedUrl(fileId, userId);
  
        expect(result).toEqual(expectedUrl);
        expect(service.getGroupFileSignedUrl).toHaveBeenCalledWith(fileId, userId);
      });
  
      it("should forward ForbiddenException from the service", async () => {
        const fileId = "file-group-123";
        const userId = "user-not-in-group";
        const error = new ForbiddenException("Access denied");
        mockFilesService.getGroupFileSignedUrl.mockRejectedValue(error);
  
        await expect(controller.getGroupSignedUrl(fileId, userId)).rejects.toThrow(ForbiddenException);
      });
  });

  // --- Tests for summarizeNote ---
  describe("summarizeNote", () => {
    it("should call service.summarize and return the summary", async () => {
      const fileId = "file-123";
      const body = { userId: "user-abc" };
      const expectedSummary = { summary: "This is a summary." };
      mockFilesService.summarize.mockResolvedValue(expectedSummary);

      const result = await controller.summarizeNote(fileId, body);

      expect(result).toEqual(expectedSummary);
      expect(service.summarize).toHaveBeenCalledWith(fileId, body.userId);
    });

    it("should forward exceptions from service.summarize", async () => {
      const fileId = "file-123";
      const body = { userId: "user-abc" };
      const error = new InternalServerErrorException("Summarization failed");
      mockFilesService.summarize.mockRejectedValue(error);

      await expect(controller.summarizeNote(fileId, body)).rejects.toThrow(InternalServerErrorException);
    });
  });
});


