import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { StudentsList } from './students';
import { Students, _Student } from '../../services/students';

class MockStudentsService {
  getStudents() {
    const data: _Student[] = [
      { id: '1', full_name: 'Ayanda M', email: 'ayanda@example.com', created_at: '2025-01-01T10:00:00Z' } as _Student,
      { id: '2', full_name: 'Kea N',    email: 'kea@example.com',    created_at: '2025-01-02T10:00:00Z' } as _Student,
    ];
    return of(data);
  }
}

describe('StudentsList', () => {
  let fixture: ComponentFixture<StudentsList>;
  let component: StudentsList;
  let studentsSvc: Students;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentsList], // standalone component only
      providers: [{ provide: Students, useClass: MockStudentsService }],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentsList);
    component = fixture.componentInstance;
    studentsSvc = TestBed.inject(Students);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load students on init', () => {
    const spy = jest.spyOn(studentsSvc, 'getStudents'); // call-through by default
    fixture.detectChanges(); // triggers ngOnInit
    expect(spy).toHaveBeenCalledTimes(1);
    expect(component.students.length).toBe(2);
  });

  it('should render each student in the template', () => {
    fixture.detectChanges();
    const li = fixture.nativeElement.querySelectorAll('ul li');
    expect(li.length).toBe(2);
    expect(li[0].textContent).toContain('Ayanda M');
    expect(li[1].textContent).toContain('Kea N');
  });

  it('should handle empty list gracefully', () => {
    jest.spyOn(studentsSvc, 'getStudents').mockReturnValue(of([] as _Student[]));
    fixture = TestBed.createComponent(StudentsList); // new instance so ngOnInit uses mocked return
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.students).toEqual([]);
    const li = fixture.nativeElement.querySelectorAll('ul li');
    expect(li.length).toBe(0);
  });
});
