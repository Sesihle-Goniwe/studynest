// matches.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Matches } from './matches';
import { StudentCoursesService } from '../../services/student_courses.services';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

class MockRouter {
  navigate(commands: any[]) { return Promise.resolve(true); }
}



class MockAuthService {
  getCurrentUser() {
    return { id: 'user-123' };
  }
}



const mockMatches = [
  {
    students: { user_id: 'u-2', profileImage: 'http://img/2.png', university: 'UCT', year: 2 },
    courses: [{ course_code: 'MATH101' }, { course_code: 'STAT201' }],
  },
  {
    students: { user_id: 'u-3', profileImage: '', university: 'Wits', year: 3 },
    courses: [{ course_code: 'CS101' }],
  },
];

const mockPartners = [
  { id: 'p1', status: 'liked',   students: { user_id: 'u-2', university: 'UCT', year: 2 } },
  { id: 'p2', status: 'matched', students: { user_id: 'u-9', university: 'UP',  year: 3 } },
  { id: 'p3', status: 'rejected',students: { user_id: 'u-7', university: 'UWC', year: 1 } },
];

class MockStudentCoursesService {
  addStudentCourse(uid: string, course: any) { return of(void 0); }
  getMatchingStudents(uid: string) { return of(mockMatches); }
  getMatches(uid: string) { return of(mockMatches); }
  saveMatch(uid: string, partnerId: string) { return of(void 0); }
  skipMatch(uid: string, partnerId: string) { return of(void 0); }
  getMatchedPartners(uid: string) { return of(mockPartners as any[]); }
}

describe('Matches (standalone)', () => {
  let fixture: ComponentFixture<Matches>;
  let component: Matches;
  let svc: MockStudentCoursesService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // ✅ Standalone component must go in imports (not declarations)
      imports: [Matches],
      providers: [
        { provide: StudentCoursesService, useClass: MockStudentCoursesService },
        { provide: AuthService, useClass: MockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Matches);
    component = fixture.componentInstance;
    svc = TestBed.inject(StudentCoursesService) as unknown as MockStudentCoursesService;

    // silence real alerts in tests
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    fixture.detectChanges(); // ngOnInit -> sets currentUserId
  });

  it('should create and set currentUserId', () => {
    expect(component).toBeTruthy();
    expect(component.currentUserId).toBe('user-123');
  });

  it('adds a course and resets the form', () => {
    const spy = jest.spyOn(svc, 'addStudentCourse');
    component.newCourse = { course_code: 'CSC101', course_name: 'Intro CS' };

    component.addCourse();

    expect(spy).toHaveBeenCalledWith('user-123', { course_code: 'CSC101', course_name: 'Intro CS' });
    expect(component.courses.length).toBe(1);
    expect(component.newCourse).toEqual({ course_code: '', course_name: '' });
  });

  it('does not add course when fields missing', () => {
    const spy = jest.spyOn(svc, 'addStudentCourse');
    component.newCourse = { course_code: '', course_name: '' };

    component.addCourse();

    expect(spy).not.toHaveBeenCalled();
  });

  it('finds matches for the current user', () => {
    const spy = jest.spyOn(svc, 'getMatchingStudents').mockReturnValue(of(mockMatches));

    component.findMatches();
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith('user-123');
    expect(component.showMatches).toBe(true);
    expect(component.matches.length).toBe(2);
    expect(component.currentIndex).toBe(0);
  });

  it('alerts if findMatches is called without a user id', () => {
    const spy = jest.spyOn(svc, 'getMatchingStudents');
    component.currentUserId = null;

    component.findMatches();

    expect(window.alert).toHaveBeenCalled();
    expect(spy).not.toHaveBeenCalled();
  });

  it('likeStudent calls saveMatch and advances index', () => {
    component.matches = mockMatches;
    component.currentIndex = 0;
    const spy = jest.spyOn(svc, 'saveMatch').mockReturnValue(of(void 0));

    component.likeStudent(component.matches[0]);

    expect(spy).toHaveBeenCalledWith('user-123', 'u-2');
    expect(component.currentIndex).toBe(1);
  });

  it('skipStudent calls skipMatch and advances index', () => {
    component.matches = mockMatches;
    component.currentIndex = 0;
    const spy = jest.spyOn(svc, 'skipMatch').mockReturnValue(of(void 0));

    component.skipStudent(component.matches[0]);

    expect(spy).toHaveBeenCalledWith('user-123', 'u-2');
    expect(component.currentIndex).toBe(1);
  });

  it('loadMatchedPartners splits liked/matched vs rejected', () => {
    const spy = jest.spyOn(svc, 'getMatchedPartners').mockReturnValue(of(mockPartners));

    component.loadMatchedPartners();

    expect(spy).toHaveBeenCalledWith('user-123');
    expect(component.matchedPartners.length).toBe(3);
    expect(component.likedPartners.map(p => p.status)).toEqual(expect.arrayContaining(['liked', 'matched']));
    expect(component.rejectedPartners.every(p => p.status === 'rejected')).toBe(true);
  });

  it('findMatched uses getMatches and resets index', () => {
    const spy = jest.spyOn(svc, 'getMatches').mockReturnValue(of(mockMatches));

    component.findMatched();

    expect(spy).toHaveBeenCalledWith('user-123');
    expect(component.matches.length).toBe(2);
    expect(component.currentIndex).toBe(0);
  });

  it('show/hide full-screen image toggles flags', () => {
    component.showFullScreenImage('http://x/y.png');
    expect(component.isFullScreenImageVisible).toBe(true);
    expect(component.fullScreenImageUrl).toBe('http://x/y.png');

    component.hideFullScreenImage();
    expect(component.isFullScreenImageVisible).toBe(false);
    expect(component.fullScreenImageUrl).toBeNull();
  });

  it('renders current match card when showMatches is true', () => {
    component.matches = mockMatches;
    component.currentIndex = 0;
    component.showMatches = true;
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.card');
    expect(card).toBeTruthy();

    const likeBtn = card.querySelector('.like-btn');
    const skipBtn = card.querySelector('.skip-btn');
    expect(likeBtn).toBeTruthy();
    expect(skipBtn).toBeTruthy();
  });
});

describe('Matches Component - Edge Cases and Error Handling', () => {
  let fixture: ComponentFixture<Matches>;
  let component: Matches;
  let studentCoursesService: StudentCoursesService;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Matches],
      providers: [
        { provide: StudentCoursesService, useClass: MockStudentCoursesService },
        { provide: AuthService, useClass: MockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Matches);
    component = fixture.componentInstance;
    studentCoursesService = TestBed.inject(StudentCoursesService);
    authService = TestBed.inject(AuthService);

    jest.spyOn(window, 'alert').mockImplementation(() => {});
    fixture.detectChanges();
  });

  // Line 49: Error case for addCourse
  it('should handle error when adding course fails', () => {
    const error = new Error('Add course failed');
    const spy = jest.spyOn(studentCoursesService, 'addStudentCourse').mockReturnValue(
      of(void 0).pipe(() => { throw error; })
    );
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    component.newCourse = { course_code: 'CSC101', course_name: 'Intro CS' };
    component.currentUserId = 'user-123';

    component.addCourse();

    expect(spy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(error);
  });

  // Line 66: Error case for findMatches
  it('should handle error when findMatches fails', () => {
    const error = new Error('Find matches failed');
    const spy = jest.spyOn(studentCoursesService, 'getMatchingStudents').mockReturnValue(
      of([]).pipe(() => { throw error; })
    );
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    component.findMatches();

    expect(spy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(error);
  });

  // Lines 74-75: Error case for findMatched
  it('should handle error when findMatched fails', () => {
    const error = new Error('Find matched failed');
    const spy = jest.spyOn(studentCoursesService, 'getMatches').mockReturnValue(
      of([]).pipe(() => { throw error; })
    );
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    component.findMatched();

    expect(spy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(error);
  });

  // Line 83: Error case for likeStudent
  it('should handle error when likeStudent fails', () => {
    const error = new Error('Like student failed');
    const spy = jest.spyOn(studentCoursesService, 'saveMatch').mockReturnValue(
      of(void 0).pipe(() => { throw error; })
    );
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    component.matches = mockMatches;
    component.currentIndex = 0;

    component.likeStudent(component.matches[0]);

    expect(spy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(error);
  });

  // Lines 89-90: Error case for skipStudent
  it('should handle error when skipStudent fails', () => {
    const error = new Error('Skip student failed');
    const spy = jest.spyOn(studentCoursesService, 'skipMatch').mockReturnValue(
      of(void 0).pipe(() => { throw error; })
    );
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    component.matches = mockMatches;
    component.currentIndex = 0;

    component.skipStudent(component.matches[0]);

    expect(spy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(error);
  });

  // Line 97: Error case for loadMatchedPartners
  it('should handle error when loadMatchedPartners fails', () => {
    const error = new Error('Load partners failed');
    const spy = jest.spyOn(studentCoursesService, 'getMatchedPartners').mockReturnValue(
      of([]).pipe(() => { throw error; })
    );
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    component.loadMatchedPartners();

    expect(spy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(error);
  });

  // Lines 103-104: No user ID cases for likeStudent and skipStudent
  it('should alert when likeStudent called without user ID', () => {
    component.currentUserId = null;
    component.matches = mockMatches;
    component.currentIndex = 0;

    component.likeStudent(component.matches[0]);

    expect(window.alert).toHaveBeenCalledWith('User not logged in!');
  });

  it('should alert when skipStudent called without user ID', () => {
    component.currentUserId = null;
    component.matches = mockMatches;
    component.currentIndex = 0;

    component.skipStudent(component.matches[0]);

    expect(window.alert).toHaveBeenCalledWith('User not logged in!');
  });

  // Line 111: No user ID case for loadMatchedPartners
  it('should alert when loadMatchedPartners called without user ID', () => {
    component.currentUserId = null;

    component.loadMatchedPartners();

    expect(window.alert).toHaveBeenCalledWith('User not logged in!');
  });

  // Lines 121-122: getPartnerDisplayName edge cases
  it('should handle getPartnerDisplayName edge cases', () => {
    const partnerWithEmail = { students: { email: 'test@example.com' } };
    const partnerWithoutEmail = { students: { user_id: 'user-123' } };
    const partnerWithoutStudents = { other: 'data' };
    const partnerNull = null;

    expect(component.getPartnerDisplayName(partnerWithEmail)).toBe('test');
    expect(component.getPartnerDisplayName(partnerWithoutEmail)).toBe('user-123');
    expect(component.getPartnerDisplayName(partnerWithoutStudents)).toBe('Unknown');
    expect(component.getPartnerDisplayName(partnerNull)).toBe('Unknown');
  });

  // Line 131: getPartnerName edge cases
  it('should handle getPartnerName edge cases', () => {
    const partnerWithEmail = { students: { email: 'john@example.com' } };
    const partnerWithoutEmail = { students: { user_id: 'user-456' } };
    const partnerWithoutStudents = { other: 'data' };
    const partnerNull = null;

    expect(component.getPartnerName(partnerWithEmail)).toBe('john');
    expect(component.getPartnerName(partnerWithoutEmail)).toBe('user-456');
    expect(component.getPartnerName(partnerWithoutStudents)).toBe('Unknown');
    expect(component.getPartnerName(partnerNull)).toBe('Unknown');
  });

  // Line 153: No user ID case for findMatched
  it('should alert when findMatched called without user ID', () => {
    component.currentUserId = null;

    component.findMatched();

    expect(window.alert).toHaveBeenCalledWith('User not logged in!');
  });

  // Line 161: AuthService returns null user
  it('should handle case when AuthService returns no user', () => {
    const authSpy = jest.spyOn(authService, 'getCurrentUser').mockReturnValue(null);
    
    // Recreate component to trigger ngOnInit with null user
    fixture = TestBed.createComponent(Matches);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.currentUserId).toBeNull();
  });

  // Line 168: Router navigation in viewProfile
  it('should navigate to profile when viewProfile is called', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate');

    component.viewProfile('user-123');

    expect(navigateSpy).toHaveBeenCalledWith(['/profile', 'user-123']);
  });
});
