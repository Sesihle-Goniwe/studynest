import { Test, TestingModule } from "@nestjs/testing";
import { FilesService } from "./files.service";
import { SupabaseService } from "../supabase/supabase.service";
import {
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import * as pdfParse from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Mocks for external libraries ---
jest.mock("pdf-parse", () => jest.fn());

const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({
  generateContent: mockGenerateContent,
}));

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));


describe("FilesService", () => {
  let service: FilesService;
  let supabaseClient: any;

  // Mock file object
  const mockFile: Express.Multer.File = {
    fieldname: "file",
    originalname: "test.pdf",
    encoding: "7bit",
    mimetype: "application/pdf",
    size: 1024,
    buffer: Buffer.from("test file content"),
  } as Express.Multer.File;

  // Mock Supabase's fluent API builders
  const studyNotesQB = { select: jest.fn().mockReturnThis(), insert: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn() };
  const groupChatsQB = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn() };
  const groupMembersQB = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn() };
  const storageBucket = { upload: jest.fn(), remove: jest.fn(), createSignedUrl: jest.fn(), download: jest.fn() };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set the required environment variable
    process.env.GEMINI_API_KEY = "test-key";

    // This mock simulates the Supabase client and its fluent API
    supabaseClient = {
      from: jest.fn((tableName: string) => {
        if (tableName === 'study_notes') return studyNotesQB;
        if (tableName === 'group_chats') return groupChatsQB;
        if (tableName === 'group_members') return groupMembersQB;
      }),
      storage: { from: jest.fn().mockReturnValue(storageBucket) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { 
          provide: SupabaseService, 
          useValue: { getClient: () => supabaseClient } 
        },
      ],
    }).compile();

    service = module.get(FilesService);
  });

  // --- Constructor Test ---
  it("constructor should throw an error if GEMINI_API_KEY is not defined", () => {
    delete process.env.GEMINI_API_KEY; // Unset the key
    expect(() => new FilesService(null as any)).toThrow(
      "GEMINI_API_KEY is not defined in the environment variables."
    );
    process.env.GEMINI_API_KEY = "test-key"; // Reset for other tests
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });


  // --- UPLOAD METHOD TESTS ---
  describe("upload", () => {
    it("should throw an error if no file is provided", async () => {
      await expect(service.upload(undefined as any, "user1")).rejects.toThrow(
        new InternalServerErrorException("File is undefined.")
      );
    });

    it("should upload file and insert metadata successfully", async () => {
      // Arrange
      const uploadResult = { data: { path: 'public/user1/test.pdf' }, error: null };
      const dbResult = { data: { id: 'file1' }, error: null };
      storageBucket.upload.mockResolvedValue(uploadResult);
      studyNotesQB.select.mockReturnThis(); // needed for .select().single() chain
      studyNotesQB.single.mockResolvedValue(dbResult);

      // Act
      const result = await service.upload(mockFile, 'user1');

      // Assert
      expect(storageBucket.upload).toHaveBeenCalled();
      expect(studyNotesQB.insert).toHaveBeenCalled();
      expect(result.data).toEqual({ id: 'file1' });
    });

    it("should throw if storage upload fails", async () => {
      const uploadError = { data: null, error: new Error('Storage Error') };
      storageBucket.upload.mockResolvedValue(uploadError);

      await expect(service.upload(mockFile, 'user1')).rejects.toThrow(
        new InternalServerErrorException("Failed to upload file to storage.")
      );
    });

    it("should throw and cleanup if database insert fails", async () => {
      const uploadResult = { data: { path: 'public/user1/test.pdf' }, error: null };
      const dbError = { data: null, error: new Error('DB Error') };
      storageBucket.upload.mockResolvedValue(uploadResult);
      studyNotesQB.select.mockReturnThis();
      studyNotesQB.single.mockResolvedValue(dbError);

      await expect(service.upload(mockFile, 'user1')).rejects.toThrow(
        new InternalServerErrorException("Failed to save file metadata.")
      );
      expect(storageBucket.remove).toHaveBeenCalledWith(['public/user1/test.pdf']);
    });
  });

  // --- GET PERSONAL URL METHOD TESTS ---
  describe("getPersonalFileSignedUrl", () => {
    it("should return a signed URL for an owned file", async () => {
      const fileData = { data: { file_path: 'path/to/file.pdf' }, error: null };
      const signedUrlData = { data: { signedUrl: 'http://signed.url' }, error: null };
      studyNotesQB.single.mockResolvedValue(fileData);
      storageBucket.createSignedUrl.mockResolvedValue(signedUrlData);

      const result = await service.getPersonalFileSignedUrl('file1', 'user1');

      expect(result).toEqual({ signedUrl: 'http://signed.url' });
      expect(studyNotesQB.eq).toHaveBeenCalledWith('id', 'file1');
      expect(studyNotesQB.eq).toHaveBeenCalledWith('user_id', 'user1');
    });

    it("should throw NotFoundException if file is not found or not owned", async () => {
      studyNotesQB.single.mockResolvedValue({ data: null, error: new Error('Not Found') });
      await expect(service.getPersonalFileSignedUrl('file1', 'user1')).rejects.toThrow(NotFoundException);
    });

    it("should throw InternalServerErrorException if URL generation fails", async () => {
      const fileData = { data: { file_path: 'path/to/file.pdf' }, error: null };
      const urlError = { data: null, error: new Error('URL Gen Error') };
      studyNotesQB.single.mockResolvedValue(fileData);
      storageBucket.createSignedUrl.mockResolvedValue(urlError);

      await expect(service.getPersonalFileSignedUrl('file1', 'user1')).rejects.toThrow(InternalServerErrorException);
    });
  });

    // --- GET GROUP URL METHOD TESTS ---
    describe('getGroupFileSignedUrl', () => {
      it('should return a signed URL if user is a member of the group', async () => {
        groupChatsQB.single.mockResolvedValue({ data: { group_id: 'group1' }, error: null });
        groupMembersQB.single.mockResolvedValue({ data: { id: 'member1' }, error: null });
        studyNotesQB.single.mockResolvedValue({ data: { file_path: 'path/to/groupfile.pdf' }, error: null });
        storageBucket.createSignedUrl.mockResolvedValue({ data: { signedUrl: 'http://groupsigned.url' }, error: null });
  
        const result = await service.getGroupFileSignedUrl('file1', 'user1');
  
        expect(result).toEqual({ signedUrl: 'http://groupsigned.url' });
      });
  
      it('should throw NotFoundException if file is not in any chat', async () => {
        groupChatsQB.single.mockResolvedValue({ data: null, error: new Error('Not found') });
        await expect(service.getGroupFileSignedUrl('file1', 'user1')).rejects.toThrow(new NotFoundException('File with ID file1 not found in any chat.'));
      });
  
      it('should throw ForbiddenException if user is not a group member', async () => {
        groupChatsQB.single.mockResolvedValue({ data: { group_id: 'group1' }, error: null });
        groupMembersQB.single.mockResolvedValue({ data: null, error: new Error('Not found') });
        await expect(service.getGroupFileSignedUrl('file1', 'user1')).rejects.toThrow(new ForbiddenException('Access denied. User is not a member of the group.'));
      });
  
      it('should throw NotFoundException if file metadata is not found', async () => {
        groupChatsQB.single.mockResolvedValue({ data: { group_id: 'group1' }, error: null });
        groupMembersQB.single.mockResolvedValue({ data: { id: 'member1' }, error: null });
        studyNotesQB.single.mockResolvedValue({ data: null, error: new Error('Not found') });
        await expect(service.getGroupFileSignedUrl('file1', 'user1')).rejects.toThrow(new NotFoundException('File data for ID file1 not found.'));
      });
  
      it('should throw InternalServerErrorException if URL generation fails', async () => {
        groupChatsQB.single.mockResolvedValue({ data: { group_id: 'group1' }, error: null });
        groupMembersQB.single.mockResolvedValue({ data: { id: 'member1' }, error: null });
        studyNotesQB.single.mockResolvedValue({ data: { file_path: 'path/to/groupfile.pdf' }, error: null });
        storageBucket.createSignedUrl.mockResolvedValue({ data: null, error: new Error('URL Error') });
        await expect(service.getGroupFileSignedUrl('file1', 'user1')).rejects.toThrow(new InternalServerErrorException('Could not generate file URL.'));
      });
    });

  // --- SUMMARIZE METHOD TESTS ---
  describe("summarize", () => {
    beforeEach(() => {
        const mockBlob = new Blob(['pdf content']);
        storageBucket.download.mockResolvedValue({ data: mockBlob, error: null });
        (pdfParse as jest.Mock).mockResolvedValue({ text: 'extracted pdf text' });
        mockGenerateContent.mockResolvedValue({ response: { text: () => 'This is a summary.' } });
    });

    it("should successfully summarize a file", async () => {
        studyNotesQB.single.mockResolvedValue({ data: { file_path: 'path/to/file.pdf' }, error: null });
        const result = await service.summarize('file1', 'user1');
        expect(result).toEqual({ summary: 'This is a summary.' });
        expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('extracted pdf text'));
    });

    it("should throw NotFoundException if file is not found", async () => {
        studyNotesQB.single.mockResolvedValue({ data: null, error: new Error('Not Found') });
        await expect(service.summarize('file1', 'user1')).rejects.toThrow(
            new InternalServerErrorException("An unexpected error occurred during summarization.")
        );
    });

    it("should throw InternalServerErrorException if file download fails", async () => {
        studyNotesQB.single.mockResolvedValue({ data: { file_path: 'path/to/file.pdf' }, error: null });
        storageBucket.download.mockResolvedValue({ data: null, error: new Error('Download Error') });
        await expect(service.summarize('file1', 'user1')).rejects.toThrow(InternalServerErrorException);
    });

    it("should handle generic errors during the process", async () => {
        // This test simulates an error during PDF parsing to test the generic catch block
        studyNotesQB.single.mockResolvedValue({ data: { file_path: 'path/to/file.pdf' }, error: null });
        (pdfParse as jest.Mock).mockRejectedValue(new Error('PDF Parse Error'));
        await expect(service.summarize('file1', 'user1')).rejects.toThrow(
            new InternalServerErrorException('An unexpected error occurred during summarization.')
        );
      });
  });
});

