import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { SupabaseService } from '../supabase/supabase.service';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { Express } from 'express';

// Mock pdf-parse properly
const mockPdfParse = jest.fn();
jest.mock('pdf-parse', () => mockPdfParse);

// Mock the Google Generative AI module
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn(),
    }),
  })),
}));

describe('FilesService', () => {
  let service: FilesService;
  let supabaseService: SupabaseService;

  const mockSupabaseClient = {
    storage: {
      from: jest.fn(),
    },
    from: jest.fn(),
  };

  const mockSupabaseService = {
    getClient: jest.fn().mockReturnValue(mockSupabaseClient),
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('test file content'),
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
  };

  beforeEach(async () => {
    // Set the environment variable for the test
    process.env.GEMINI_API_KEY = 'test-api-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should throw error if GEMINI_API_KEY is not defined', () => {
      delete process.env.GEMINI_API_KEY;
      
      expect(() => {
        new FilesService(mockSupabaseService as any);
      }).toThrow('GEMINI_API_KEY is not defined in the environment variables.');
    });
  });

  describe('upload', () => {
    it('should upload file successfully', async () => {
      const userId = 'user123';
      const uploadPath = `public/${userId}/123456789-test.pdf`;
      
      const mockStorageChain = {
        upload: jest.fn().mockResolvedValue({
          data: { path: uploadPath },
          error: null,
        }),
        remove: jest.fn(),
      };

      const mockDbChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'file123',
            user_id: userId,
            file_name: 'test.pdf',
            file_path: uploadPath,
            file_size: 1024,
            mime_type: 'application/pdf',
          },
          error: null,
        }),
      };

      mockSupabaseClient.storage.from.mockReturnValue(mockStorageChain);
      mockSupabaseClient.from.mockReturnValue(mockDbChain);

      const result = await service.upload(mockFile, userId);

      expect(result.message).toBe('File uploaded successfully');
      expect(result.data).toBeDefined();
      expect(mockStorageChain.upload).toHaveBeenCalledWith(
        expect.stringContaining(`public/${userId}/`),
        mockFile.buffer,
        { contentType: mockFile.mimetype }
      );
      expect(mockDbChain.insert).toHaveBeenCalledWith({
        user_id: userId,
        file_name: mockFile.originalname,
        file_path: uploadPath,
        file_size: mockFile.size,
        mime_type: mockFile.mimetype,
      });
    });

    it('should throw error if file is undefined', async () => {
      await expect(service.upload(undefined as any, 'user123')).rejects.toThrow(
        InternalServerErrorException
      );
    });

    it('should handle storage upload error', async () => {
      const userId = 'user123';
      
      const mockStorageChain = {
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Storage error' },
        }),
      };

      mockSupabaseClient.storage.from.mockReturnValue(mockStorageChain);

      await expect(service.upload(mockFile, userId)).rejects.toThrow(
        InternalServerErrorException
      );
    });

    it('should rollback storage upload on database error', async () => {
      const userId = 'user123';
      const uploadPath = `public/${userId}/123456789-test.pdf`;
      
      const mockStorageChain = {
        upload: jest.fn().mockResolvedValue({
          data: { path: uploadPath },
          error: null,
        }),
        remove: jest.fn().mockResolvedValue({ error: null }),
      };

      const mockDbChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      mockSupabaseClient.storage.from.mockReturnValue(mockStorageChain);
      mockSupabaseClient.from.mockReturnValue(mockDbChain);

      await expect(service.upload(mockFile, userId)).rejects.toThrow(
        InternalServerErrorException
      );
      
      expect(mockStorageChain.remove).toHaveBeenCalledWith([expect.stringContaining(`public/${userId}/`)]);
    });
  });

  describe('getSignedUrl', () => {
    it('should generate signed URL successfully', async () => {
      const fileId = 'file123';
      const userId = 'user123';
      const filePath = `public/${userId}/123456789-test.pdf`;
      const signedUrl = 'https://example.com/signed-url';

      const mockDbChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { file_path: filePath },
          error: null,
        }),
      };

      const mockStorageChain = {
        createSignedUrl: jest.fn().mockResolvedValue({
          data: { signedUrl },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockDbChain);
      mockSupabaseClient.storage.from.mockReturnValue(mockStorageChain);

      const result = await service.getSignedUrl(fileId, userId);

      expect(result).toEqual({ signedUrl });
      expect(mockDbChain.eq).toHaveBeenCalledWith('id', fileId);
      expect(mockDbChain.eq).toHaveBeenCalledWith('user_id', userId);
      expect(mockStorageChain.createSignedUrl).toHaveBeenCalledWith(filePath, 3600);
    });

    it('should throw NotFoundException if file not found', async () => {
      const fileId = 'nonexistent';
      const userId = 'user123';

      const mockDbChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockDbChain);

      await expect(service.getSignedUrl(fileId, userId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should handle storage signed URL error', async () => {
      const fileId = 'file123';
      const userId = 'user123';
      const filePath = `public/${userId}/123456789-test.pdf`;

      const mockDbChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { file_path: filePath },
          error: null,
        }),
      };

      const mockStorageChain = {
        createSignedUrl: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Storage error' },
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockDbChain);
      mockSupabaseClient.storage.from.mockReturnValue(mockStorageChain);

      await expect(service.getSignedUrl(fileId, userId)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe('summarize', () => {
    it('should summarize file successfully', async () => {
      const fileId = 'file123';
      const userId = 'user123';
      const filePath = `public/${userId}/123456789-test.pdf`;
      const pdfText = 'This is the content of the PDF file.';
      const summary = 'This is a summary of the PDF content.';

      const mockDbChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { file_path: filePath },
          error: null,
        }),
      };

      const mockBlob = {
        arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('pdf content')),
      };

      const mockStorageChain = {
        download: jest.fn().mockResolvedValue({
          data: mockBlob,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockDbChain);
      mockSupabaseClient.storage.from.mockReturnValue(mockStorageChain);

      // Mock pdf-parse
      mockPdfParse.mockResolvedValue({
        text: pdfText,
      });

      // Mock the Gemini AI response
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => summary,
        },
      });

      const mockModel = {
        generateContent: mockGenerateContent,
      };

      // Access the private genAI property to mock it
      (service as any).genAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel),
      };

      const result = await service.summarize(fileId, userId);

      expect(result).toEqual({ summary });
      expect(mockDbChain.eq).toHaveBeenCalledWith('id', fileId);
      expect(mockDbChain.eq).toHaveBeenCalledWith('user_id', userId);
      expect(mockStorageChain.download).toHaveBeenCalledWith(filePath);
      expect(mockPdfParse).toHaveBeenCalledWith(expect.any(Buffer));
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('Summarize the following study notes')
      );
    });

    it('should throw InternalServerErrorException if file data is not found (no db error)', async () => {
      const fileId = 'file123';
      const userId = 'user123';

      // Mock the database to return null for both data and error
      const mockDbChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null, // Simulate file not being found
          error: null, // Simulate no database error occurring
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockDbChain);

      // Expect the service to catch the resulting TypeError and throw a standard internal error
      await expect(service.summarize(fileId, userId)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.summarize(fileId, userId)).rejects.toThrow(
        'An unexpected error occurred during summarization.',
      );
    });

    it('should handle download error', async () => {
      const fileId = 'file123';
      const userId = 'user123';
      const filePath = `public/${userId}/123456789-test.pdf`;

      const mockDbChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { file_path: filePath },
          error: null,
        }),
      };

      const mockStorageChain = {
        download: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Download failed' },
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockDbChain);
      mockSupabaseClient.storage.from.mockReturnValue(mockStorageChain);

      await expect(service.summarize(fileId, userId)).rejects.toThrow(
        InternalServerErrorException
      );
    });

    it('should handle PDF parsing error', async () => {
      const fileId = 'file123';
      const userId = 'user123';
      const filePath = `public/${userId}/123456789-test.pdf`;

      const mockDbChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { file_path: filePath },
          error: null,
        }),
      };

      const mockBlob = {
        arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('pdf content')),
      };

      const mockStorageChain = {
        download: jest.fn().mockResolvedValue({
          data: mockBlob,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockDbChain);
      mockSupabaseClient.storage.from.mockReturnValue(mockStorageChain);

      // Mock pdf-parse to throw error
      mockPdfParse.mockRejectedValue(new Error('PDF parsing failed'));

      await expect(service.summarize(fileId, userId)).rejects.toThrow(
        InternalServerErrorException
      );
    });

    it('should handle Gemini AI error', async () => {
      const fileId = 'file123';
      const userId = 'user123';
      const filePath = `public/${userId}/123456789-test.pdf`;
      const pdfText = 'This is the content of the PDF file.';

      const mockDbChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { file_path: filePath },
          error: null,
        }),
      };

      const mockBlob = {
        arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('pdf content')),
      };

      const mockStorageChain = {
        download: jest.fn().mockResolvedValue({
          data: mockBlob,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockDbChain);
      mockSupabaseClient.storage.from.mockReturnValue(mockStorageChain);

            // Mock pdf-parse
      mockPdfParse.mockResolvedValue({
        text: pdfText,
      });

      // Mock the Gemini AI to throw error
      const mockGenerateContent = jest.fn().mockRejectedValue(
        new Error('AI generation failed')
      );

      const mockModel = {
        generateContent: mockGenerateContent,
      };

      (service as any).genAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel),
      };

      await expect(service.summarize(fileId, userId)).rejects.toThrow(
        InternalServerErrorException
      );
    });

    it('should handle unexpected errors gracefully', async () => {
      const fileId = 'file123';
      const userId = 'user123';

      // Mock the database call to throw an unexpected error
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Unexpected database error');
      });

      await expect(service.summarize(fileId, userId)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });
});
