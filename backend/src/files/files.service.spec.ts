// src/files/files.service.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { FilesService } from "./files.service";
import { SupabaseService } from "../supabase/supabase.service";
import { InternalServerErrorException } from "@nestjs/common";

// ---- Mocks ----
const pdfParseMock = jest.fn().mockResolvedValue({ text: "PDF TEXT CONTENT" });
jest.mock("pdf-parse", () => pdfParseMock);

// Mock Google Generative AI
const genModel = {
  generateContent: jest
    .fn()
    .mockResolvedValue({ response: { text: () => "SUMMARIZED TEXT" } }),
};
const genAIInstance = {
  getGenerativeModel: jest.fn().mockReturnValue(genModel),
};
const GoogleGenerativeAI = jest.fn().mockImplementation(() => genAIInstance);
jest.mock("@google/generative-ai", () => ({ GoogleGenerativeAI }));

// Helper fake blob for storage.download()
function makeBlob(buffer: Buffer) {
  return {
    arrayBuffer: async () =>
      buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ),
  } as any;
}

describe("FilesService", () => {
  let service: FilesService;
  let supabaseClient: any;
  let storageBucket: any;
  let studyNotesQB: any;

  beforeEach(async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";

    storageBucket = {
      upload: jest.fn(),
      remove: jest.fn(),
      createSignedUrl: jest.fn(),
      download: jest.fn(),
    };

    studyNotesQB = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn(),
      single: jest.fn(),
      insert: jest.fn(),
    };

    supabaseClient = {
      from: jest.fn((name: string) => {
        if (name === "study_notes") return studyNotesQB;
        return { select: jest.fn().mockReturnThis() };
      }),
      storage: {
        from: jest.fn((bucket: string) => {
          if (bucket === "study-notes") return storageBucket;
          return storageBucket;
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: SupabaseService,
          useValue: { getClient: () => supabaseClient },
        },
      ],
    }).compile();

    service = module.get(FilesService);
    jest.clearAllMocks();
  });

  it("upload: uploads to storage and writes metadata", async () => {
    storageBucket.upload.mockResolvedValueOnce({
      data: { path: "public/u1/123-file.pdf" },
      error: null,
    });
    // insert(...).select().single()
    studyNotesQB.insert.mockReturnValue(studyNotesQB);
    studyNotesQB.select.mockReturnValue(studyNotesQB);
    studyNotesQB.single.mockResolvedValueOnce({
      data: { id: "f1", file_path: "public/u1/123-file.pdf" },
      error: null,
    });

    const file: any = {
      originalname: "file.pdf",
      buffer: Buffer.from("pdf"),
      size: 3,
      mimetype: "application/pdf",
    };

    const res = await service.upload(file, "u1");
    expect(storageBucket.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^public\/u1\/\d+-file\.pdf$/),
      file.buffer,
      { contentType: "application/pdf" },
    );
    expect(res.data.id).toBe("f1");
  });

  it("upload: cleans up storage if DB insert fails", async () => {
    storageBucket.upload.mockResolvedValueOnce({
      data: { path: "public/u1/123-file.pdf" },
      error: null,
    });
    studyNotesQB.insert.mockReturnValue(studyNotesQB);
    studyNotesQB.select.mockReturnValue(studyNotesQB);
    studyNotesQB.single.mockResolvedValueOnce({
      data: null,
      error: { message: "DB fail" },
    });

    const file: any = {
      originalname: "file.pdf",
      buffer: Buffer.from("pdf"),
      size: 3,
      mimetype: "application/pdf",
    };

    await expect(service.upload(file, "u1")).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    expect(storageBucket.remove).toHaveBeenCalledWith([
      expect.stringMatching(/^public\/u1\/\d+-file\.pdf$/),
    ]);
  });

  it("getSignedUrl: returns URL when user owns file", async () => {
    studyNotesQB.eq.mockReturnValueOnce(studyNotesQB); // id
    studyNotesQB.eq.mockReturnValueOnce(studyNotesQB); // user_id
    studyNotesQB.single.mockResolvedValueOnce({
      data: { file_path: "public/u1/123-file.pdf" },
      error: null,
    });

    storageBucket.createSignedUrl.mockResolvedValueOnce({
      data: { signedUrl: "https://signed/url" },
      error: null,
    });

    const out = await service.getSignedUrl("f1", "u1");
    expect(out.signedUrl).toBe("https://signed/url");
  });

  it("getSignedUrl: throws when DB lookup fails (masked as 500 by catch)", async () => {
    studyNotesQB.eq.mockReturnValueOnce(studyNotesQB);
    studyNotesQB.eq.mockReturnValueOnce(studyNotesQB);
    studyNotesQB.single.mockResolvedValueOnce({
      data: null,
      error: { message: "not found" },
    });

    await expect(service.getSignedUrl("f1", "u1")).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it("summarize: downloads, parses PDF, calls Gemini and returns summary", async () => {
    // DB: find file path
    studyNotesQB.eq.mockReturnValueOnce(studyNotesQB);
    studyNotesQB.eq.mockReturnValueOnce(studyNotesQB);
    studyNotesQB.single.mockResolvedValueOnce({
      data: { file_path: "public/u1/123-file.pdf" },
      error: null,
    });

    // storage download -> blob
    storageBucket.download.mockResolvedValueOnce({
      data: makeBlob(Buffer.from("PDF BYTES")),
      error: null,
    });

    const res = await service.summarize("f1", "u1");
    expect(pdfParseMock).toHaveBeenCalled();
    expect(GoogleGenerativeAI).toHaveBeenCalledWith("test-gemini-key");
    expect(genModel.generateContent).toHaveBeenCalled();
    expect(res.summary).toBe("SUMMARIZED TEXT");
  });

  it("summarize: handles download error (re-thrown as 500)", async () => {
    studyNotesQB.eq.mockReturnValueOnce(studyNotesQB);
    studyNotesQB.eq.mockReturnValueOnce(studyNotesQB);
    studyNotesQB.single.mockResolvedValueOnce({
      data: { file_path: "public/u1/123-file.pdf" },
      error: null,
    });

    storageBucket.download.mockResolvedValueOnce({
      data: null,
      error: { message: "nope" },
    });

    await expect(service.summarize("f1", "u1")).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
