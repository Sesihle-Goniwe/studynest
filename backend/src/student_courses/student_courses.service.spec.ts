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
});
