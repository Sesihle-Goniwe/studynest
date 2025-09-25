import { Test, TestingModule } from "@nestjs/testing";
import { StudentsController } from "./students.controller";
import { StudentsService } from "./students.service";
import { Readable } from "stream";
import { Express } from "express";
describe("StudentsController", () => {
  let controller: StudentsController;
  let service: StudentsService;

  const mockStudentsService = {
    getAllStudents: jest.fn().mockResolvedValue([{ uid: "123", name: "John" }]),
    getStudentsbyUid: jest.fn().mockResolvedValue({ uid: "123", name: "John" }),
    updateStudentP: jest
      .fn()
      .mockResolvedValue({ uid: "123", name: "John Updated" }),
    updateStudentWithImage: jest
      .fn()
      .mockResolvedValue({ uid: "123", name: "John", photoUrl: "photo.png" }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [{ provide: StudentsService, useValue: mockStudentsService }],
    }).compile();

    controller = module.get<StudentsController>(StudentsController);
    service = module.get<StudentsService>(StudentsService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should return all students", async () => {
      const result = await controller.findAll();
      expect(result).toEqual([{ uid: "123", name: "John" }]);
      expect(service.getAllStudents).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return a student by uid", async () => {
      const result = await controller.findOne("123");
      expect(result).toEqual({ uid: "123", name: "John" });
      expect(service.getStudentsbyUid).toHaveBeenCalledWith("123");
    });
  });

  describe("updateStudentP", () => {
    it("should update a student", async () => {
      const updateDto = { name: "John Updated" };
      const result = await controller.updateStudentP("123", updateDto);
      expect(result).toEqual({ uid: "123", name: "John Updated" });
      expect(service.updateStudentP).toHaveBeenCalledWith("123", updateDto);
    });
  });

  describe("updatePhoto", () => {
    it("should update student photo", async () => {
      const mockFile: Express.Multer.File = {
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

      const result = await controller.updatePhoto("123", mockFile);
      expect(result).toEqual({
        uid: "123",
        name: "John",
        photoUrl: "photo.png",
      });
      expect(service.updateStudentWithImage).toHaveBeenCalledWith(
        "123",
        {},
        mockFile,
      );
    });

    it("should throw error if no file uploaded", async () => {
      await expect(controller.updatePhoto("123", undefined)).rejects.toThrow(
        "No file uploaded",
      );
    });
  });
});
