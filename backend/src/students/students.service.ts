// src/students/students.service.ts
import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { Express } from "express";
@Injectable()
export class StudentsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getAllStudents() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from("students")
      .select("*");

    if (error) {
      throw new Error(error.message);
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

      return data;
    } catch (error) {}
  }

  async updateStudentP(uid: string, updateDto: any) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from("students")
      .update(updateDto)
      .eq("user_id", uid)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async updatestudentbyUid(uid: string, updateDto: UpdateStudentDto) {
    const { data } = await this.supabaseService
      .getClient()
      .from("students")
      .update(updateDto)
      .eq("user_id", uid)
      .select()
      .single();

    return data;
  }

  async uploadProfileImage(file: Express.Multer.File, uid: string) {
    if (!file.buffer) throw new Error("File buffer is empty");
    const filePath = `profiles/${uid}-${Date.now()}-${file.originalname}`;
    const { data, error } = await this.supabaseService
      .getClient()
      .storage.from("student-avatars")
      .upload(filePath, file.buffer, { upsert: true });
    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: publicUrl } = this.supabaseService
      .getClient()
      .storage.from("student-avatars")
      .getPublicUrl(filePath);
    if (!publicUrl?.publicUrl) throw new Error("Failed to get public URL");
    return publicUrl.publicUrl;
  }

  async updateStudentWithImage(
    uid: string,
    updateDto: UpdateStudentDto,
    file?: Express.Multer.File,
  ) {
    const dtoToSave: any = { ...updateDto };
    if (file) {
      const imageUrl = await this.uploadProfileImage(file, uid);
      dtoToSave.profileImage = imageUrl;
    }
    return this.updateStudentP(uid, dtoToSave);
  }
}
