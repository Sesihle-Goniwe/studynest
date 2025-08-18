// src/students/students.controller.ts
import { Body, Controller, Get,Param ,Put} from '@nestjs/common';
import { StudentsService } from './students.service';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  async findAll() {
    return await this.studentsService.getAllStudents();
  }

  @Get(':uid')
  
    async findOne(@Param('uid') uid:string)
    {
      return await this.studentsService.getStudentsbyUid(uid);
    }


  @Put(':uid')
  
    updateStudentP(@Param('uid') uid:string, @Body() updateDto :any)
    {
      return this.studentsService.updateStudentP(uid,updateDto);
    }
  
}
