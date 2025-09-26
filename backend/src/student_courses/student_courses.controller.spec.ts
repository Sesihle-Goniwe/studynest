import { Test, TestingModule } from "@nestjs/testing";
import { StudentCoursesController } from "./student_courses.controller";

describe("StudentCoursesController", () => {
  let controller: StudentCoursesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentCoursesController],
    }).compile();

    controller = module.get<StudentCoursesController>(StudentCoursesController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
