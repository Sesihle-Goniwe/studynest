import { Test, TestingModule } from "@nestjs/testing";
import { StudentsService } from "./students.service";
import { SupabaseService } from "../supabase/supabase.service";
import { Readable } from "stream";
import { Express } from "express";
describe("StudentsService", () => {
  let service: StudentsService;
  let supabaseMock: any;

  beforeEach(async () => {
    // Mock Supabase client
    supabaseMock = {
      getClient: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { user_id: "123", name: "Test" },
          error: null,
        }),
        storage: {
          from: jest.fn().mockReturnThis(),
          upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
          getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl: "http://mock-url.com/avatar.png" },
          }),
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: SupabaseService, useValue: supabaseMock },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should get all students", async () => {
    const mockData = [{ user_id: "123", name: "Test" }];
    supabaseMock
      .getClient()
      .from()
      .select.mockResolvedValue({ data: mockData, error: null });
    const result = await service.getAllStudents();
    expect(result).toEqual(mockData);
  });

  it("should get student by UID", async () => {
    const result = await service.getStudentsbyUid("123");
    expect(result).toEqual({ user_id: "123", name: "Test" });
  });

  it("should update student without image", async () => {
    const updateDto = { name: "Updated" };
    const result = await service.updateStudentP("123", updateDto);
    expect(result).toEqual({ user_id: "123", name: "Test" });
  });

  it("should upload profile image and update student", async () => {
    const file: Express.Multer.File = {
      fieldname: "profileImage",
      originalname: "photo.png",
      encoding: "7bit",
      mimetype: "image/png",
      size: 1024,
      buffer: Buffer.from([]),
      destination: "",
      filename: "photo.png",
      path: "",
      stream: Readable.from([]),
    };

    const result = await service.updateStudentWithImage(
      "123",
      { name: "Updated" },
      file,
    );
    expect(result).toEqual({ user_id: "123", name: "Test" });
  });
});
