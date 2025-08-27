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

async addStudentCourses(studentId: string, courses: { course_code: string, course_name: string }[]) {
  if (!studentId || !courses || courses.length === 0) {
    throw new Error('studentId and courses are required');
  }

  const supabase = this.supabaseService.getClient();

  // Array to hold course IDs for student_courses
  const courseIds: string[] = [];

  for (const course of courses) {
    // Step 1: Check if course already exists
    const { data: existingCourse, error: checkError } = await supabase
      .from('courses')
      .select('id')
      .eq('course_code', course.course_code)
      .single(); // fetch one

    if (checkError && checkError.code !== 'PGRST116') { // ignore not found
      throw checkError;
    }

    let courseId: string;
    if (existingCourse) {
      courseId = existingCourse.id;
    } else {
      // Step 2: Insert new course
      const { data: newCourse, error: insertError } = await supabase
        .from('courses')
        .insert({ course_code: course.course_code, course_name: course.course_name })
        .select('id')
        .single();

      if (insertError) throw insertError;
      courseId = newCourse.id;
    }

    courseIds.push(courseId);
  }

  // Step 3: Insert into student_courses
  const { data, error } = await supabase
    .from('student_courses')
    .insert(courseIds.map(id => ({ student_id: studentId, course_id: id })));

  if (error) throw error;
  return data;
}

}
