// src/students/students.controller.ts
import { Body, Controller, Get,Param ,Put, UseInterceptors,UploadedFile} from '@nestjs/common';
import { StudentsService } from './students.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateStudentDto } from './dto/update-student.dto';
import type { Express } from 'express';
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
  
    @Put(':uid')
    @UseInterceptors(FileInterceptor('profileImage'))
    async updateStudent(
      @Param('uid') uid: string,
      @UploadedFile() file: Express.Multer.File,
      @Body() body: UpdateStudentDto,
    )
    {
      return this.studentsService.updateStudentWithImage(uid, body, file);
    }
}
