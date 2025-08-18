import { Controller, Get, Query } from '@nestjs/common';
import { StudentCoursesService } from './student_courses.service';

@Controller('student-courses')
export class StudentCoursesController {
  constructor(private studentCoursesService: StudentCoursesService) {}//

  @Get('matches')
  async getMatches(@Query('userId') userId: string) {
    return this.studentCoursesService.findMatchingStudents(userId);
  }
}
