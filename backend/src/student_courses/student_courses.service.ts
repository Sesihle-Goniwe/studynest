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
      .select('student_id, courses(id, course_code), students(user_id, email, university, year, profileImage)')
      .in('course_id', courseIds)// Find students with matching courses
      .neq('student_id', currentUserId); // exclude current user

    if (matchError)
    {
      console.log("Failed to fetch matching students)");
      throw matchError;    ///console.log('Fetched raw matching students data:', matchingStudents);
    }


  // Step 3: Group by student_id and collect common courses
  const grouped = matchingStudents.reduce((acc, row) => {
    const sid = row.student_id;
    if (!acc[sid]) {
      acc[sid] = {
        students: row.students,
        courses: []
      };
    }
    acc[sid].courses.push(row.courses);
    return acc;
  }, {});


  return Object.values(grouped);
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


async addCourse(course: { course_code: string, course_name: string }) {
  if (!course.course_code || !course.course_name) {
    throw new Error('course_code and course_name are required');
  }

  const supabase = this.supabaseService.getClient();

  // Check if course already exists
  const { data: existingCourse, error: checkError } = await supabase
    .from('courses')
    .select('id')
    .eq('course_code', course.course_code)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    throw checkError;
  }

  if (existingCourse) {
    throw new Error('Course already exists');
  }

  // Insert new course
  const { data: newCourse, error: insertError } = await supabase
    .from('courses')
    .insert({ course_code: course.course_code, course_name: course.course_name })
    .select('*')
    .single();

  if (insertError) throw insertError;
  return newCourse;
}

//For getting matched students
async addMatch(userId: string, matchedUserId: string) {
  const supabase = this.supabaseService.getClient();

  // Prevent self-matching
  if (userId === matchedUserId) {
    throw new Error("You cannot match with yourself.");
  }

  // Insert or update the match
  const { data, error } = await supabase
    .from('matched_students')
    .upsert(
      {
        user_id: userId,
        matched_user_id: matchedUserId,
        status: 'liked',
        updated_at: new Date()
      },
      { onConflict: 'user_id, matched_user_id' }
    )
    .select();

  if (error) throw error;
  return data;
}

async updateMatchStatus(userId: string, matchedUserId: string, status: 'pending' | 'liked' | 'matched' | 'rejected') {
  const supabase = this.supabaseService.getClient();

  const { data, error } = await supabase
    .from('matched_students')
    .update({ status, updated_at: new Date() })
    .eq('user_id', userId)
    .eq('matched_user_id', matchedUserId)
    .select();

  if (error) throw error;
  return data;
}

async getMyMatches(userId: string) {
  const supabase = this.supabaseService.getClient();

   // Fetch matched students for this user
  // This correctly fetches matches where the user initiated the 'like'
  const { data, error } = await supabase
    .from('matched_students')
    .select(`
      id,
      status,
      created_at,
      matched_user_id,
      students!matched_students_matched_user_id_fkey(user_id, university, year, email)
    `)
    .eq('user_id', userId);

  if (error) throw error;

  // Filter out any accidental matches where the user matched with themselves
  const filteredData = data.filter(match => match.matched_user_id !== userId);

  return filteredData;
}





}
