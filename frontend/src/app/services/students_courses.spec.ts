import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { StudentCoursesService } from './student_courses.services';

describe('StudentCoursesService', () => {
  let service: StudentCoursesService;
  let http: HttpTestingController;

  const BASE = 'https://studynester.onrender.com/student-courses';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StudentCoursesService],
    });
    service = TestBed.inject(StudentCoursesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getMatchingStudents() should GET /matches/:userId', () => {
    const resp = [{ id: 'u2' }];
    service.getMatchingStudents('user-123').subscribe(r => {
      expect(r).toEqual(resp);
    });

    const req = http.expectOne(`${BASE}/matches/user-123`);
    expect(req.request.method).toBe('GET');
    req.flush(resp);
  });

  it('addCourse() should POST /add-course with course payload', () => {
    const course = { course_code: 'CSC101', course_name: 'Intro CS' };
    const resp = { ok: true };

    service.addCourse(course).subscribe(r => {
      expect(r).toEqual(resp);
    });

    const req = http.expectOne(`${BASE}/add-course`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(course);
    req.flush(resp);
  });

  it('addStudentCourse() should POST /add-student-courses with studentId + courses[]', () => {
    const course = { course_code: 'MATH101', course_name: 'Calculus I' };
    const payload = { studentId: 'user-123', courses: [course] };
    const resp = { ok: true };

    service.addStudentCourse('user-123', course).subscribe(r => {
      expect(r).toEqual(resp);
    });

    const req = http.expectOne(`${BASE}/add-student-courses`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(resp);
  });

  it('getMatches() should GET /find/:studentId', () => {
    const resp = [{ id: 'u9' }];
    service.getMatches('user-123').subscribe(r => {
      expect(r).toEqual(resp);
    });

    const req = http.expectOne(`${BASE}/find/user-123`);
    expect(req.request.method).toBe('GET');
    req.flush(resp);
  });

  it('saveMatch() should POST /match with userId and matchedUserId', () => {
    const payload = { userId: 'user-123', matchedUserId: 'u-2' };
    const resp = { status: 'liked' };

    service.saveMatch('user-123', 'u-2').subscribe(r => {
      expect(r).toEqual(resp);
    });

    const req = http.expectOne(`${BASE}/match`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(resp);
  });

  it('skipMatch() should PATCH /match-status with rejected status', () => {
    const payload = { userId: 'user-123', matchedUserId: 'u-2', status: 'rejected' };
    const resp = { status: 'rejected' };

    service.skipMatch('user-123', 'u-2').subscribe(r => {
      expect(r).toEqual(resp);
    });

    const req = http.expectOne(`${BASE}/match-status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);
    req.flush(resp);
  });

  it('getMatchedPartners() should GET /matched/:userId', () => {
    const resp = [{ id: 'p1', status: 'matched' }];
    service.getMatchedPartners('user-123').subscribe(r => {
      expect(r).toEqual(resp);
    });

    const req = http.expectOne(`${BASE}/matched/user-123`);
    expect(req.request.method).toBe('GET');
    req.flush(resp);
  });
});
