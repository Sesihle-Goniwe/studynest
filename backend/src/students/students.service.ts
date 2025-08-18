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

  async getStudentsbyUid(uid : string)
  {
    try{
    const {data,error}=  await this.supabaseService
    .getClient()
    .from('students')
    .select('*')
    .eq('user_id',uid)
    .single();

    return data;
    }
    catch (error){
        
    } 
  }

  async updateStudentP(uid: string, updateDto:any)
  {
      const {data,error}  = await this.supabaseService
      .getClient()
      .from('students')
      .update(updateDto)
      .eq('user_id',uid)
      .select()
      .single();

      if(error)
      {
          throw new Error (error.message);
      }

      return data;
  }

}
