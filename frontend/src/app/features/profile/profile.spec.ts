import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { Profile } from './profile';
import { AuthService } from '../auth/auth.service';
import { Students } from '../../services/students';
import { HttpClientTestingModule } from '@angular/common/http/testing'; // ✅ add

class MockAuthService {
  getCurrentUser() {
    return { id: 'user-123', email: 'test@uni.ac.za' };
  }
  getUserDisplayName() {
    return 'Test Student';
  }
}

const mockStudentRecord = {
  id: 'stu-1',
  email: 'test@uni.ac.za',
  university: 'Wits',
  year: 3,
  course: 'BCom Finance',
  skills: 'Excel, R, Python',
  studyPreference: 'Night',
  profileImage: 'http://example.com/img.png'
};

class MockStudentsService {
  private getStudent$ = new Subject<any>();

  getStudentByUid(uid: string) {
    setTimeout(() => this.getStudent$.next({ ...mockStudentRecord }), 0);
    return this.getStudent$.asObservable();
  }
  updatestudentbyUid(uid: string, dto: any) {
    return of({ ...mockStudentRecord, ...dto });
  }
  updatestudentPhoto(uid: string, form: FormData) {
    return of({ profileImage: 'http://example.com/new.png' });
  }
}

describe('Profile (standalone)', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let studentsSvc: MockStudentsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Profile,
        HttpClientTestingModule,                 // ✅ provide HttpClient
      ],
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        { provide: Students, useClass: MockStudentsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    studentsSvc = TestBed.inject(Students) as unknown as MockStudentsService;
  });

  it('should create', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  }));

  it('loads student data on init and preloads editable fields', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(component.students?.email).toBe('test@uni.ac.za');
    expect(component.displayName).toBe('Test Student');
    expect(component.university!).toBe('Wits');
    expect(component.course!).toBe('BCom Finance');
    expect(component.year!).toBe(3);
    expect(component.skills!).toBe('Excel, R, Python');
    expect(component.studyPreference!).toBe('Night');

    const h2 = fixture.nativeElement.querySelector('h2');
    expect(h2.textContent).toContain('Test Student');
    const uni = fixture.nativeElement.querySelector('.university');
    expect(uni.textContent).toContain('Wits');
  }));

  it('toggles edit mode when button clicked', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.edit-btn');
    expect(component.isEditMode).toBe(false);
    btn.click();
    fixture.detectChanges();
    expect(component.isEditMode).toBe(true);
    btn.click();
    fixture.detectChanges();
    expect(component.isEditMode).toBe(false);
  }));

  it('saves profile via service and exits edit mode', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    component.isEditMode = true;
    component.course = 'BCom Hons Finance';
    fixture.detectChanges();

    const spy = jest.spyOn(studentsSvc, 'updatestudentbyUid');

    component.saveProfile();
    tick();
    fixture.detectChanges();

    expect(spy).toHaveBeenCalled();
    expect(component.isEditMode).toBe(false);
  }));

  it('uploads photo and updates preview', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const uploadSpy = jest.spyOn(studentsSvc, 'updatestudentPhoto');

    const fakeFile = new File(['abc'], 'pic.png', { type: 'image/png' });
    component.uploadPhoto(fakeFile);
    tick();
    fixture.detectChanges();

    expect(uploadSpy).toHaveBeenCalled();
    expect(component.profileImage).toBe('http://example.com/new.png');
  }));
});
