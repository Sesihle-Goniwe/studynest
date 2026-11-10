import { Controller, Get, Patch, Param, Post, Body } from "@nestjs/common";
import { StudentCoursesService } from "./student_courses.service";
import { CurrentUser } from "../decorators/current-user.decorator";

@Controller("student-courses")
export class StudentCoursesController {
  constructor(private studentCoursesService: StudentCoursesService) {}

  @Get("matches/:userId")
  async findMatches(
    @Param("userId") userId: string,
    @CurrentUser("id") callerId?: string,
  ) {
    const targetId = userId === "me" ? callerId : callerId || userId;
    return this.studentCoursesService.findMatchingStudents(targetId!);
  }

  @Post("add-course")
  async addCourse(
    @Body() course: { course_code: string; course_name: string },
  ) {
    return this.studentCoursesService.addCourse(course);
  }

  @Post("add-student-courses")
  async addStudentCourses(
    @Body()
    body: {
      studentId?: string;
      courses: { course_code: string; course_name: string }[];
    },
    @CurrentUser("id") callerId?: string,
  ) {
    const studentId = callerId || body?.studentId;
    return this.studentCoursesService.addStudentCourses(
      studentId!,
      body.courses,
    );
  }

  @Post("match")
  async addMatch(
    @Body() body: { userId?: string; matchedUserId: string },
    @CurrentUser("id") callerId?: string,
  ) {
    const userId = callerId || body?.userId;
    return this.studentCoursesService.addMatch(userId!, body.matchedUserId);
  }

  @Post("unmatch")
  async unMatch(
    @Body() body: { userId?: string; matchedUserId: string },
    @CurrentUser("id") callerId?: string,
  ) {
    const userId = callerId || body?.userId;
    return this.studentCoursesService.unMatch(userId!, body.matchedUserId);
  }

  @Patch("match-status")
  async updateMatchStatus(
    @Body()
    body: {
      userId?: string;
      matchedUserId: string;
      status: "pending" | "liked" | "matched" | "rejected";
    },
    @CurrentUser("id") callerId?: string,
  ) {
    const userId = callerId || body?.userId;
    return this.studentCoursesService.updateMatchStatus(
      userId!,
      body.matchedUserId,
      body.status,
    );
  }

  @Get("matched/:userId")
  async getMyMatches(
    @Param("userId") userId: string,
    @CurrentUser("id") callerId?: string,
  ) {
    const targetId = userId === "me" ? callerId : callerId || userId;
    return this.studentCoursesService.getMyMatches(targetId!);
  }
}
