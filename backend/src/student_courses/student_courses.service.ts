import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class StudentCoursesService {
  constructor(private supabaseService: SupabaseService) {}

  async findMatchingStudents(currentUserId: string) {
    const supabase = this.supabaseService.getClient();

    // Step 1: Get all courses for the current user
    const { data: myCourses, error: coursesError } = await supabase
      .from('student_courses')
      .select('course_id')
      .eq('student_id', currentUserId);

    if (coursesError) throw coursesError;

    const courseIds = myCourses.map((c) => c.course_id);// Extract course IDs

    if (courseIds.length === 0) {
      return [];
    }

    // Step 2: Find students with overlapping courses
    const { data: matchingStudents, error: matchError } = await supabase
      .from('student_courses')
      .select('student_id, courses!inner(id, course_code), students!inner(user_id, university, year)')
      .in('course_id', courseIds)// Find students with matching courses
      //.neq('student_id', currentUserId); // exclude current user

    if (matchError) throw matchError;

    return matchingStudents;
  }
}
