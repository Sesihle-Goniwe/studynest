// src/students/students.controller.ts
<<<<<<< HEAD
import { Body, Controller, Get,Param ,Put, UseInterceptors,UploadedFile, Patch} from '@nestjs/common';
import { StudentsService } from './students.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateStudentDto } from './dto/update-student.dto';
import type { Express } from 'express';
import { memoryStorage } from 'multer';
=======
import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { StudentsService } from "./students.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { UpdateStudentDto } from "./dto/update-student.dto";
import type { Express } from "express";
import { memoryStorage } from "multer";
>>>>>>> 7b4881f9fd0fdea27798a51af31ab4df9e205efd

@Controller("students")
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  async findAll() {
    return await this.studentsService.getAllStudents();
  }

  @Get(":uid")
  async findOne(@Param("uid") uid: string) {
    return await this.studentsService.getStudentsbyUid(uid);
  }

  @Put(":uid")
  updateStudentP(@Param("uid") uid: string, @Body() updateDto: any) {
    return this.studentsService.updateStudentP(uid, updateDto);
  }

  @Put(":uid/photo")
  @UseInterceptors(
    FileInterceptor("profileImage", { storage: memoryStorage() }),
  )
  async updatePhoto(
    @Param("uid") uid: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new Error("No file uploaded");
    return this.studentsService.updateStudentWithImage(uid, {}, file);
  }

  @Put(':uid')
  async updateUserName(@Param('uid') uid: string, @Body() body: { full_name: string }) 
  {
    return this.studentsService.updateUserName(uid, body.full_name);
  }

}
