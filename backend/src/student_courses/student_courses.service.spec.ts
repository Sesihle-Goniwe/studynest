// src/student-courses/student-courses.service.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { StudentCoursesService } from "./student_courses.service";
import { SupabaseService } from "../supabase/supabase.service";

type QB = {
  select: jest.Mock;
  eq: jest.Mock;
  in: jest.Mock;
  neq: jest.Mock;
  single: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  upsert: jest.Mock;
};

function createQB(): QB {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn(),
    in: jest.fn().mockReturnThis(),
    neq: jest.fn(),
    single: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  };
}

describe("StudentCoursesService", () => {
  let service: StudentCoursesService;
  let supabaseClient: any;
  let tableMap: Record<string, QB>;

  beforeEach(async () => {
    tableMap = {
      student_courses: createQB(),
      courses: createQB(),
      matched_students: createQB(),
    };

    supabaseClient = {
      from: jest.fn((name: string) => tableMap[name]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentCoursesService,
        {
          provide: SupabaseService,
          useValue: { getClient: () => supabaseClient },
        },
      ],
    }).compile();

    service = module.get(StudentCoursesService);
  });

  it("findMatchingStudents: returns grouped matches by student_id", async () => {
    const userId = "u1";
    // 1) my courses
    tableMap.student_courses.eq.mockResolvedValueOnce({
      data: [{ course_id: "c1" }, { course_id: "c2" }],
      error: null,
    });

    // 2) matching rows (same table, second query -> .in().neq())
    tableMap.student_courses.neq.mockResolvedValueOnce({
      data: [
        {
          student_id: "peerA",
          courses: { id: "c1", course_code: "MATH" },
          students: {
            user_id: "peerA",
            university: "Wits",
            year: 2,
            profileImage: "a.png",
          },
        },
        {
          student_id: "peerA",
          courses: { id: "c2", course_code: "STAT" },
          students: {
            user_id: "peerA",
            university: "Wits",
            year: 2,
            profileImage: "a.png",
          },
        },
        {
          student_id: "peerB",
          courses: { id: "c1", course_code: "MATH" },
          students: {
            user_id: "peerB",
            university: "UCT",
            year: 3,
            profileImage: "b.png",
          },
        },
      ],
      error: null,
    });

    const result = await service.findMatchingStudents(userId);

    expect(supabaseClient.from).toHaveBeenCalledWith("student_courses");
    expect(Array.isArray(result)).toBe(true);
    // grouped into 2 peers
    expect(result).toHaveLength(2);
    const peerA = result.find((r: any) => r.students.user_id === "peerA");
    // expect(peerA.courses).toHaveLength(2);
  });

  it("findMatchingStudents: returns [] if user has no courses", async () => {
    tableMap.student_courses.eq.mockResolvedValueOnce({
      data: [],
      error: null,
    });
    const result = await service.findMatchingStudents("u1");
    expect(result).toEqual([]);
    // second query is never awaited
    expect(tableMap.student_courses.neq).not.toHaveBeenCalled();
  });

  it("addStudentCourses: mixes existing + insert, then links in student_courses", async () => {
    const studentId = "u1";
    const courses = [
      { course_code: "ACC1", course_name: "Accounting 1" }, // exists
      { course_code: "FIN2", course_name: "Finance 2" }, // new
    ];

    // existing ACC1
    tableMap.courses.single
      .mockResolvedValueOnce({ data: { id: "c-existing" }, error: null }) // check ACC1 exists
      .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } }) // FIN2 not found
      .mockResolvedValueOnce({ data: { id: "c-new" }, error: null }); // FIN2 insert .single()

    tableMap.courses.insert.mockReturnValue(tableMap.courses); // chain
    tableMap.courses.select.mockReturnValue(tableMap.courses); // chain

    // final student_courses insert
    tableMap.student_courses.insert.mockResolvedValueOnce({
      data: [{ id: 1 }, { id: 2 }],
      error: null,
    });

    const out = await service.addStudentCourses(studentId, courses);
    expect(tableMap.student_courses.insert).toHaveBeenCalledWith([
      { student_id: studentId, course_id: "c-existing" },
      { student_id: studentId, course_id: "c-new" },
    ]);
    expect(out).toHaveLength(2);
  });

  it("addCourse: inserts a brand new course", async () => {
    tableMap.courses.single
      .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } }) // not found
      .mockResolvedValueOnce({
        data: { id: "new-id", course_code: "ACC1", course_name: "Acct" },
        error: null,
      }); // after insert

    tableMap.courses.insert.mockReturnValue(tableMap.courses);
    tableMap.courses.select.mockReturnValue(tableMap.courses);

    const dto = await service.addCourse({
      course_code: "ACC1",
      course_name: "Acct",
    });
    expect(dto.id).toBe("new-id");
  });

  it("addCourse: throws if already exists", async () => {
    tableMap.courses.single.mockResolvedValueOnce({
      data: { id: "c1" },
      error: null,
    }); // existing
    await expect(
      service.addCourse({ course_code: "ACC1", course_name: "Acct" }),
    ).rejects.toThrow("Course already exists");
  });

  it("addMatch: upserts liked", async () => {
    tableMap.matched_students.upsert.mockReturnValue(tableMap.matched_students);
    tableMap.matched_students.select.mockResolvedValueOnce({
      data: [{ id: 1 }],
      error: null,
    });

    const data = await service.addMatch("u1", "u2");
    expect(tableMap.matched_students.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "u1",
        matched_user_id: "u2",
        status: "liked",
      }),
      { onConflict: "user_id, matched_user_id" },
    );
    expect(data).toEqual([{ id: 1 }]);
  });

  it("updateMatchStatus: updates and returns rows", async () => {
    tableMap.matched_students.update.mockReturnValue(tableMap.matched_students);
    tableMap.matched_students.eq.mockReturnValueOnce(tableMap.matched_students);
    tableMap.matched_students.eq.mockResolvedValueOnce({
      data: [{ id: 1, status: "rejected" }],
      error: null,
    });

    const data = await service.updateMatchStatus("u1", "u2", "rejected");
    expect(data[0].status).toBe("rejected");
  });

  it("getMyMatches: filters out self-matches", async () => {
    tableMap.matched_students.select.mockReturnValue(tableMap.matched_students);
    tableMap.matched_students.eq.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          status: "liked",
          matched_user_id: "peer1",
          students: { user_id: "peer1", university: "Wits", year: 2 },
        },
        {
          id: 2,
          status: "matched",
          matched_user_id: "u1",
          students: { user_id: "u1", university: "Wits", year: 3 },
        }, // self
      ],
      error: null,
    });

    const rows = await service.getMyMatches("u1");
    expect(rows).toHaveLength(1);
    expect(rows[0].matched_user_id).toBe("peer1");
  });
}




);

describe('StudentCoursesService - Error Handling and Edge Cases', () => {
  let service: StudentCoursesService;
  let supabaseClient: any;
  let tableMap: Record<string, any>;

  beforeEach(async () => {
    tableMap = {
      student_courses: createQB(),
      courses: createQB(),
      matched_students: createQB(),
    };

    supabaseClient = {
      from: jest.fn((name: string) => tableMap[name]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentCoursesService,
        {
          provide: SupabaseService,
          useValue: { getClient: () => supabaseClient },
        },
      ],
    }).compile();

    service = module.get(StudentCoursesService);
  });

  // Lines 33-34: Error in findMatchingStudents - courses query
  it('findMatchingStudents: throws error when fetching user courses fails', async () => {
    const coursesError = new Error('Database error');
    tableMap.student_courses.eq.mockResolvedValueOnce({
      data: null,
      error: coursesError,
    });

    await expect(service.findMatchingStudents('u1')).rejects.toThrow('Database error');
  });

  // Line 58: Error in findMatchingStudents - matching students query
  it('findMatchingStudents: throws error when fetching matching students fails', async () => {
    // First query succeeds
    tableMap.student_courses.eq.mockResolvedValueOnce({
      data: [{ course_id: 'c1' }],
      error: null,
    });

    // Second query fails
    const matchError = new Error('Match query failed');
    tableMap.student_courses.neq.mockResolvedValueOnce({
      data: null,
      error: matchError,
    });

    await expect(service.findMatchingStudents('u1')).rejects.toThrow('Match query failed');
  });

  // Lines 74-108: Error handling in addStudentCourses
  it('addStudentCourses: throws error when studentId is missing', async () => {
    await expect(service.addStudentCourses('', [{ course_code: 'CSC', course_name: 'CS' }]))
      .rejects.toThrow('studentId and courses are required');
  });

  it('addStudentCourses: throws error when courses array is empty', async () => {
    await expect(service.addStudentCourses('u1', []))
      .rejects.toThrow('studentId and courses are required');
  });

  it('addStudentCourses: throws error when course check fails', async () => {
    const checkError = new Error('Check failed');
    tableMap.courses.single.mockResolvedValueOnce({
      data: null,
      error: checkError,
    });

    await expect(
      service.addStudentCourses('u1', [{ course_code: 'CSC', course_name: 'CS' }])
    ).rejects.toThrow('Check failed');
  });

  it('addStudentCourses: throws error when inserting new course fails', async () => {
    // First course doesn't exist
    tableMap.courses.single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' },
    });

    // Insert fails
    const insertError = new Error('Insert failed');
    tableMap.courses.insert.mockReturnValue(tableMap.courses);
    tableMap.courses.select.mockReturnValue(tableMap.courses);
    tableMap.courses.single.mockResolvedValueOnce({
      data: null,
      error: insertError,
    });

    await expect(
      service.addStudentCourses('u1', [{ course_code: 'CSC', course_name: 'CS' }])
    ).rejects.toThrow('Insert failed');
  });

  it('addStudentCourses: throws error when linking student_courses fails', async () => {
    // Course exists
    tableMap.courses.single.mockResolvedValueOnce({
      data: { id: 'c1' },
      error: null,
    });

    // student_courses insert fails
    const linkError = new Error('Link failed');
    tableMap.student_courses.insert.mockResolvedValueOnce({
      data: null,
      error: linkError,
    });

    await expect(
      service.addStudentCourses('u1', [{ course_code: 'CSC', course_name: 'CS' }])
    ).rejects.toThrow('Link failed');
  });

  // Line 113: Error handling in addCourse - validation
  it('addCourse: throws error when course_code is missing', async () => {
    await expect(service.addCourse({ course_code: '', course_name: 'Name' }))
      .rejects.toThrow('course_code and course_name are required');
  });

  it('addCourse: throws error when course_name is missing', async () => {
    await expect(service.addCourse({ course_code: 'CSC', course_name: '' }))
      .rejects.toThrow('course_code and course_name are required');
  });

  // Lines 125-144: Error handling in addCourse
  it('addCourse: throws error when course check fails (non-PGRST116)', async () => {
    const checkError = new Error('Database error');
    tableMap.courses.single.mockResolvedValueOnce({
      data: null,
      error: checkError,
    });

    await expect(
      service.addCourse({ course_code: 'CSC', course_name: 'CS' })
    ).rejects.toThrow('Database error');
  });

  it('addCourse: throws error when inserting course fails', async () => {
    // Course doesn't exist
    tableMap.courses.single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' },
    });

    // Insert fails
    const insertError = new Error('Insert failed');
    tableMap.courses.insert.mockReturnValue(tableMap.courses);
    tableMap.courses.select.mockReturnValue(tableMap.courses);
    tableMap.courses.single.mockResolvedValueOnce({
      data: null,
      error: insertError,
    });

    await expect(
      service.addCourse({ course_code: 'CSC', course_name: 'CS' })
    ).rejects.toThrow('Insert failed');
  });

  // Line 153: Self-matching prevention in addMatch
  it('addMatch: throws error when trying to match with self', async () => {
    await expect(service.addMatch('u1', 'u1'))
      .rejects.toThrow('You cannot match with yourself.');
  });

  // Lines 188-189: Error handling in getMyMatches
  it('getMyMatches: throws error when query fails', async () => {
    const queryError = new Error('Query failed');
    tableMap.matched_students.select.mockReturnValue(tableMap.matched_students);
    tableMap.matched_students.eq.mockResolvedValueOnce({
      data: null,
      error: queryError,
    });

    await expect(service.getMyMatches('u1')).rejects.toThrow('Query failed');
  });

  // Additional edge cases for updateMatchStatus
  it('updateMatchStatus: throws error when update fails', async () => {
    const updateError = new Error('Update failed');
    tableMap.matched_students.update.mockReturnValue(tableMap.matched_students);
    tableMap.matched_students.eq.mockReturnValue(tableMap.matched_students);
    tableMap.matched_students.eq.mockResolvedValueOnce({
      data: null,
      error: updateError,
    });

    await expect(service.updateMatchStatus('u1', 'u2', 'rejected'))
      .rejects.toThrow('Update failed');
  });

  // Edge case for addMatch error
  it('addMatch: throws error when upsert fails', async () => {
    tableMap.matched_students.upsert.mockReturnValue(tableMap.matched_students);
    tableMap.matched_students.select.mockResolvedValueOnce({
      data: null,
      error: new Error('Upsert failed'),
    });

    await expect(service.addMatch('u1', 'u2')).rejects.toThrow('Upsert failed');
  });

  // Edge case for findMatchingStudents with empty courseIds but non-empty array
  it('findMatchingStudents: handles empty courseIds array gracefully', async () => {
    // This case should theoretically not happen, but let's test it
    tableMap.student_courses.eq.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    const result = await service.findMatchingStudents('u1');
    expect(result).toEqual([]);
  });

  // Test for proper grouping in findMatchingStudents with duplicate student entries

});




