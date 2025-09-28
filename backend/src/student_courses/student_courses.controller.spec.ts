import { Test, TestingModule } from "@nestjs/testing";
import { StudentCoursesController } from "./student_courses.controller";
import { StudentCoursesService } from "./student_courses.service";

describe("StudentCoursesController", () => {
  let controller: StudentCoursesController;
  let service: StudentCoursesService;

  const mockStudentCoursesService = {
    findMatchingStudents: jest.fn(),
    addCourse: jest.fn(),
    addStudentCourses: jest.fn(),
    addMatch: jest.fn(),
    updateMatchStatus: jest.fn(),
    getMyMatches: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentCoursesController],
      providers: [
        {
          provide: StudentCoursesService,
          useValue: mockStudentCoursesService,
        },
      ],
    }).compile();

    controller = module.get<StudentCoursesController>(StudentCoursesController);
    service = module.get<StudentCoursesService>(StudentCoursesService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // Line 6: Constructor
  it("should initialize with StudentCoursesService", () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  // Line 11: findMatches method
  describe("findMatches", () => {
    it("should call findMatchingStudents with userId", async () => {
      const userId = "user123";
      const expectedResult = [{ student: "match1" }, { student: "match2" }];
      
      mockStudentCoursesService.findMatchingStudents.mockResolvedValue(expectedResult);

      const result = await controller.findMatches(userId);

      expect(mockStudentCoursesService.findMatchingStudents).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });

    it("should handle errors from findMatchingStudents", async () => {
      const userId = "user123";
      const error = new Error("Service error");
      
      mockStudentCoursesService.findMatchingStudents.mockRejectedValue(error);

      await expect(controller.findMatches(userId)).rejects.toThrow("Service error");
    });
  });

  // Line 18: addCourse method
  describe("addCourse", () => {
    it("should call addCourse with course data", async () => {
      const courseData = { course_code: "CSC101", course_name: "Computer Science" };
      const expectedResult = { id: "course123", ...courseData };
      
      mockStudentCoursesService.addCourse.mockResolvedValue(expectedResult);

      const result = await controller.addCourse(courseData);

      expect(mockStudentCoursesService.addCourse).toHaveBeenCalledWith(courseData);
      expect(result).toEqual(expectedResult);
    });

    it("should handle errors from addCourse", async () => {
      const courseData = { course_code: "CSC101", course_name: "Computer Science" };
      const error = new Error("Course creation failed");
      
      mockStudentCoursesService.addCourse.mockRejectedValue(error);

      await expect(controller.addCourse(courseData)).rejects.toThrow("Course creation failed");
    });
  });

  // Line 29: addStudentCourses method
  describe("addStudentCourses", () => {
    it("should call addStudentCourses with studentId and courses", async () => {
      const requestBody = {
        studentId: "student123",
        courses: [
          { course_code: "CSC101", course_name: "Computer Science" },
          { course_code: "MATH101", course_name: "Mathematics" }
        ]
      };
      const expectedResult = [{ id: 1 }, { id: 2 }];
      
      mockStudentCoursesService.addStudentCourses.mockResolvedValue(expectedResult);

      const result = await controller.addStudentCourses(requestBody);

      expect(mockStudentCoursesService.addStudentCourses).toHaveBeenCalledWith(
        requestBody.studentId,
        requestBody.courses
      );
      expect(result).toEqual(expectedResult);
    });

    it("should handle errors from addStudentCourses", async () => {
      const requestBody = {
        studentId: "student123",
        courses: [{ course_code: "CSC101", course_name: "Computer Science" }]
      };
      const error = new Error("Student courses addition failed");
      
      mockStudentCoursesService.addStudentCourses.mockRejectedValue(error);

      await expect(controller.addStudentCourses(requestBody)).rejects.toThrow("Student courses addition failed");
    });
  });

  // Line 38: addMatch method
  describe("addMatch", () => {
    it("should call addMatch with userId and matchedUserId", async () => {
      const requestBody = { userId: "user123", matchedUserId: "user456" };
      const expectedResult = { id: "match123", status: "liked" };
      
      mockStudentCoursesService.addMatch.mockResolvedValue(expectedResult);

      const result = await controller.addMatch(requestBody);

      expect(mockStudentCoursesService.addMatch).toHaveBeenCalledWith(
        requestBody.userId,
        requestBody.matchedUserId
      );
      expect(result).toEqual(expectedResult);
    });

    it("should handle errors from addMatch", async () => {
      const requestBody = { userId: "user123", matchedUserId: "user456" };
      const error = new Error("Match creation failed");
      
      mockStudentCoursesService.addMatch.mockRejectedValue(error);

      await expect(controller.addMatch(requestBody)).rejects.toThrow("Match creation failed");
    });
  });

  // Line 51: updateMatchStatus method
  describe("updateMatchStatus", () => {
    it("should call updateMatchStatus with userId, matchedUserId and status", async () => {
      const requestBody = {
        userId: "user123",
        matchedUserId: "user456",
        status: "liked" as const
      };
      const expectedResult = { id: "match123", status: "liked" };
      
      mockStudentCoursesService.updateMatchStatus.mockResolvedValue(expectedResult);

      const result = await controller.updateMatchStatus(requestBody);

      expect(mockStudentCoursesService.updateMatchStatus).toHaveBeenCalledWith(
        requestBody.userId,
        requestBody.matchedUserId,
        requestBody.status
      );
      expect(result).toEqual(expectedResult);
    });

 /*   it("should handle all status types", async () => {
      const statuses = ["pending", "liked", "matched", "rejected"] as const;
      
      for (const status of statuses) {
        const requestBody = {
          userId: "user123",
          matchedUserId: "user456",
          status
        };
        
        mockStudentCoursesService.updateMatchStatus.mockResolvedValue({ status });

        const result = await controller.updateMatchStatus(requestBody);

        expect(mockStudentCoursesService.updateMatchStatus).toHaveBeenCalledWith(
          requestBody.userId,
          requestBody.matchedUserId,
          status
        );
        expect(result.status).toBe(status);
      }
    });*/

    it("should handle errors from updateMatchStatus", async () => {
      const requestBody = {
        userId: "user123",
        matchedUserId: "user456",
        status: "rejected" as const
      };
      const error = new Error("Status update failed");
      
      mockStudentCoursesService.updateMatchStatus.mockRejectedValue(error);

      await expect(controller.updateMatchStatus(requestBody)).rejects.toThrow("Status update failed");
    });
  });

  // Line 61: getMyMatches method
  describe("getMyMatches", () => {
    it("should call getMyMatches with userId", async () => {
      const userId = "user123";
      const expectedResult = [
        { id: "match1", status: "liked" },
        { id: "match2", status: "matched" }
      ];
      
      mockStudentCoursesService.getMyMatches.mockResolvedValue(expectedResult);

      const result = await controller.getMyMatches(userId);

      expect(mockStudentCoursesService.getMyMatches).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });

    it("should handle errors from getMyMatches", async () => {
      const userId = "user123";
      const error = new Error("Matches fetch failed");
      
      mockStudentCoursesService.getMyMatches.mockRejectedValue(error);

      await expect(controller.getMyMatches(userId)).rejects.toThrow("Matches fetch failed");
    });

    it("should handle empty matches array", async () => {
      const userId = "user123";
      const expectedResult = [];
      
      mockStudentCoursesService.getMyMatches.mockResolvedValue(expectedResult);

      const result = await controller.getMyMatches(userId);

      expect(mockStudentCoursesService.getMyMatches).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });
  });
});