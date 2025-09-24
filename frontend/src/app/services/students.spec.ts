import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Students, _Student } from './students';

describe('Students service', () => {
  let service: Students;
  let http: HttpTestingController;

  const BASE = 'https://studynester.onrender.com/students';

  const mockStudent: _Student = {
    id: 'u1',
    full_name: 'Test User',
    email: 'test@example.com',
    created_at: '2025-09-01T10:00:00Z',
    university: 'Wits',
    course: 'CS',
    year: '3',
    profileImage: 'http://example.com/p.png',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Students],
    });
    service = TestBed.inject(Students);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getStudents() should GET a list', () => {
    const list: _Student[] = [mockStudent];

    service.getStudents().subscribe((res) => {
      expect(res).toEqual(list);
    });

    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('GET');
    req.flush(list);
  });

  it('getStudentByUid() should GET one by uid', () => {
    service.getStudentByUid('u1').subscribe((res) => {
      expect(res).toEqual(mockStudent);
    });

    const req = http.expectOne(`${BASE}/u1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockStudent);
  });

  it('updatestudentbyUid() should PUT dto and return updated', () => {
    const dto = { course: 'SE', year: '4' };
    const updated = { ...mockStudent, ...dto };

    service.updatestudentbyUid('u1', dto).subscribe((res) => {
      expect(res).toEqual(updated);
    });

    const req = http.expectOne(`${BASE}/u1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(updated);
  });

  it('updatestudentPhoto() should PUT FormData to /photo', () => {
    const file = new File(['img'], 'pic.png', { type: 'image/png' });
    const fd = new FormData();
    fd.append('profileImage', file);

    const resp = { ...mockStudent, profileImage: 'http://example.com/new.png' };

    service.updatestudentPhoto('u1', fd).subscribe((res) => {
      expect(res.profileImage).toBe('http://example.com/new.png');
    });

    const req = http.expectOne(`${BASE}/u1/photo`);
    expect(req.request.method).toBe('PUT');

    // body is FormData; headers should let browser set boundary
    expect(req.request.body instanceof FormData).toBe(true);
    expect(req.request.headers.has('Content-Type')).toBe(false);

    req.flush(resp);
  });
});
