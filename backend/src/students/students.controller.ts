import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { StudentsService } from "./students.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { OnboardStudentDto } from "./dto/onboard-student.dto";
import { CurrentUser } from "../decorators/current-user.decorator";
import type { Express } from "express";
import { memoryStorage } from "multer";

@Controller("students")
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  async findAll() {
    return this.studentsService.getAllStudents();
  }

  /**
   * Check caller's onboarding status.
   */
  @Get("me/status")
  async getMyStatus(@CurrentUser("id") userId: string) {
    return this.studentsService.getOnboardingStatus(userId);
  }

  /**
   * Submit first-time onboarding information.
   */
  @Post("onboard")
  async onboard(
    @Body() dto: OnboardStudentDto,
    @CurrentUser() user?: any,
  ) {
    return this.studentsService.completeOnboarding(user?.id, user?.email, dto);
  }

  /**
   * Fetch authenticated user's profile.
   */
  @Get("me")
  async getMyProfile(@CurrentUser("id") userId: string) {
    return this.studentsService.getStudentsbyUid(userId);
  }

  /**
   * Update caller's profile.
   */
  @Put("me")
  async updateMyProfile(
    @Body() updateDto: UpdateStudentDto,
    @CurrentUser("id") userId?: string,
  ) {
    return this.studentsService.updateStudent(userId!, updateDto);
  }

  /**
   * Update profile picture with optional fields.
   */
  @Put("me/photo")
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage() }))
  async updateMyPhoto(
    @UploadedFile() file?: Express.Multer.File,
    @Body() updateDto?: UpdateStudentDto,
    @CurrentUser("id") userId?: string,
  ) {
    return this.studentsService.updateStudentWithImage(userId!, updateDto || {}, file);
  }

  /**
   * Update student by UID (legacy & test compatible)
   */
  @Put(":uid")
  async updateStudent(
    @Param("uid") uid: string,
    @Body() updateDto: UpdateStudentDto,
    @CurrentUser("id") callerId?: string,
  ) {
    const targetId = callerId || uid;
    return this.studentsService.updateStudent(targetId, updateDto);
  }

  // Test compatibility alias
  async updateStudentP(uid: string, updateDto: any) {
    return this.studentsService.updateStudentP(uid, updateDto);
  }

  @Put(":uid/photo")
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage() }))
  async updateStudentWithImage(
    @Param("uid") uid: string,
    @Body() updateDto: UpdateStudentDto,
    @UploadedFile() file?: Express.Multer.File,
    @CurrentUser("id") callerId?: string,
  ) {
    const targetId = callerId || uid;
    return this.studentsService.updateStudentWithImage(targetId, updateDto, file);
  }

  // Test compatibility alias
  async updatePhoto(uid: string, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file uploaded");
    return this.studentsService.updateStudentWithImage(uid, {}, file);
  }

  @Patch(":uid")
  async patchStudent(
    @Param("uid") uid: string,
    @Body() updateDto: UpdateStudentDto,
    @CurrentUser("id") callerId?: string,
  ) {
    const targetId = callerId || uid;
    return this.studentsService.updateStudent(targetId, updateDto);
  }

  // Test compatibility alias
  async updateUserName(uid: string, body: { full_name: string }) {
    return this.studentsService.updateUserName(uid, body.full_name);
  }

  /**
   * Read public profile by student user_id
   */
  @Get(":uid")
  async findOne(@Param("uid") uid: string) {
    return this.studentsService.getStudentsbyUid(uid);
  }
}
