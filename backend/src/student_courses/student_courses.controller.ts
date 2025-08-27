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


  // POST /student-courses/decision
  @Post('decision')
  async matchDecision(
    @Body() body: { userId: string; targetId: string; match: boolean },
  ) {
    // eventually you'll insert into a "student_matches" table
    // for now just echo back the decision
    return {
      message: 'Decision recorded',
      ...body,
    };
  }

}
