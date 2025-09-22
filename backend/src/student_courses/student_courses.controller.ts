import { Controller, Get, Patch, Param, Post, Body } from '@nestjs/common';
import { StudentCoursesService } from './student_courses.service';

@Controller('student-courses')
export class StudentCoursesController {
  constructor(private studentCoursesService: StudentCoursesService) {}//

  // Change your route to accept userId as a path param
  @Get('matches/:userId')
    async findMatches(@Param('userId') userId: string) {
    return this.studentCoursesService.findMatchingStudents(userId);
  }

  @Post('add-course')
  async addCourse(@Body() course: { course_code: string; course_name: string }) {
    return this.studentCoursesService.addCourse(course);
  }

  @Post('add-student-courses')
  async addStudentCourses(
    @Body() body: { studentId: string; courses: { course_code: string; course_name: string }[] }
  ) {
    return this.studentCoursesService.addStudentCourses(body.studentId, body.courses);
  }

  // ✅ Create a match
  @Post('match')
  async addMatch(
    @Body() body: { userId: string; matchedUserId: string }
  ) {
    return this.studentCoursesService.addMatch(body.userId, body.matchedUserId);
  }

  // 🔄 Update match status (like, reject, matched, etc.)
  @Patch('match-status')
  async updateMatchStatus(
    @Body() body: { userId: string; matchedUserId: string; status: 'pending' | 'liked' | 'matched' | 'rejected' }
  ) {
    return this.studentCoursesService.updateMatchStatus(body.userId, body.matchedUserId, body.status);
  }

  // 👀 Get my matched partners
  @Get('matched/:userId')
  async getMyMatches(@Param('userId') userId: string) {
    return this.studentCoursesService.getMyMatches(userId);
  }

}
