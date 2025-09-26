import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Dashboard } from './dashboard';
import { _Student } from '../services/students';

describe('Dashboard Service', () => {
  let service: Dashboard;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Dashboard]
    });

    service = TestBed.inject(Dashboard);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send PUT request to update user name', () => {
    const uid = '123';
    const newName = 'Jane Doe';

    // ✅ Mock what your backend actually returns (only full_name)
    const mockResponse: _Student = {
      full_name: newName
    } as _Student;

    service.updateUserName(uid, newName).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`https://studynester.onrender.com/students/${uid}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ full_name: newName });

    req.flush(mockResponse);
  });
});
