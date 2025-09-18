import { Controller, Get, Param, Post, Body } from '@nestjs/common';
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

}
