// src/students/students.service.ts
import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class StudentsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getAllStudents() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('students')
      .select('*');

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}
