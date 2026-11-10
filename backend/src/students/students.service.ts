import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { OnboardStudentDto } from "./dto/onboard-student.dto";
import type { Express } from "express";

@Injectable()
export class StudentsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getAllStudents() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from("students")
      .select("*");

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async getStudentsbyUid(uid: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from("students")
        .select("*")
        .eq("user_id", uid)
        .single();

      if (error) {
        throw new InternalServerErrorException(error.message);
      }
      return data;
    } catch (error: any) {
      if (error instanceof InternalServerErrorException) throw error;
      throw new NotFoundException(`Student with uid ${uid} not found`);
    }
  }

  async getOnboardingStatus(uid: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from("students")
      .select("university, course, year, full_name, profileImage")
      .eq("user_id", uid)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    const isOnboarded =
      Boolean(data?.university) &&
      Boolean(data?.course) &&
      Boolean(data?.year);

    return {
      isOnboarded,
      profile: data || null,
    };
  }

  async completeOnboarding(
    uid: string,
    email: string | undefined,
    dto: OnboardStudentDto,
  ) {
    const payload: Record<string, any> = {
      user_id: uid,
      email: email || null,
      university: dto.university,
      course: dto.course,
      year: dto.year,
      updated_at: new Date().toISOString(),
    };

    if (dto.fullName) {
      payload.full_name = dto.fullName;
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .from("students")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to complete onboarding: ${error.message}`,
      );
    }

    return {
      success: true,
      student: data,
    };
  }

  // Unified single update method (replaces updateUserName, updateStudentP, updatestudentbyUid)
  async updateStudent(uid: string, updateDto: UpdateStudentDto) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from("students")
      .update({
        ...updateDto,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", uid)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  // Compatibility aliases for legacy calls and tests
  async updateUserName(uid: string, userName: string) {
    const { data } = await this.supabaseService
      .getClient()
      .from("students")
      .update({ full_name: userName })
      .eq("user_id", uid)
      .select();
    return data;
  }

  async updateStudentP(uid: string, updateDto: any) {
    return this.updateStudent(uid, updateDto);
  }

  async updatestudentbyUid(uid: string, updateDto: UpdateStudentDto) {
    return this.updateStudent(uid, updateDto);
  }

  async uploadProfileImage(file: Express.Multer.File, uid: string) {
    if (!file.buffer) throw new InternalServerErrorException("File buffer is empty");
    const filePath = `profiles/${uid}-${Date.now()}-${file.originalname}`;
    const { error } = await this.supabaseService
      .getClient()
      .storage.from("student-avatars")
      .upload(filePath, file.buffer, { upsert: true });

    if (error) throw new InternalServerErrorException(`Upload failed: ${error.message}`);

    const { data: publicUrl } = this.supabaseService
      .getClient()
      .storage.from("student-avatars")
      .getPublicUrl(filePath);

    if (!publicUrl?.publicUrl) throw new InternalServerErrorException("Failed to get public URL");
    return publicUrl.publicUrl;
  }

  async updateStudentWithImage(
    uid: string,
    updateDto: UpdateStudentDto,
    file?: Express.Multer.File,
  ) {
    const dtoToSave: UpdateStudentDto = { ...updateDto };
    if (file) {
      const imageUrl = await this.uploadProfileImage(file, uid);
      dtoToSave.profileImage = imageUrl;
    }
    return this.updateStudent(uid, dtoToSave);
  }
}
