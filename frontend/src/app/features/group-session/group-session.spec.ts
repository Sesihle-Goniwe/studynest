import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { GroupSession } from './group-session';
import { AuthService } from '../auth/auth.service';
import { Sessions, _Session } from '../../services/sessions';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

class MockAuthService {
  getCurrentUser() { return { id: 'user-123' }; }
}

const seedSessions: _Session[] = [
  { id: 's1', title: 'Intro',     description: 'Basics',   start_time: '2025-09-20T10:00', end_time: '2025-09-20T11:00', location: 'Room 1', group_id: 'g1', created_by: 'user-123' } as any,
  { id: 's2', title: 'Deep Dive', description: 'Advanced', start_time: '2025-09-21T10:00', end_time: '2025-09-21T11:30', location: 'Room 2', group_id: 'g1', created_by: 'user-456' } as any,
];

class MockSessionsService {
  getUserRole(groupId: string, uid: string) { return of({ role: 'member' }); }
  getSessionbyGroupID(groupId: string) { return of(seedSessions); }
  createSession(dto: any) { return of({ id: 's3', ...dto } as any); }
  deleteSession(sessionid: string) { return of(void 0); }
  leaveGroup(groupId: string, uid: string) { return of(void 0); }
}

describe('GroupSession (standalone)', () => {
  let fixture: ComponentFixture<GroupSession>;
  let component: GroupSession;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupSession, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        { provide: Sessions, useClass: MockSessionsService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ groupId: 'g1' }) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupSession);
    component = fixture.componentInstance;

    // default confirm = true for destructive actions
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    fixture.detectChanges(); // ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads sessions on init', () => {
    expect(component.groupId).toBe('g1');
    expect(component.sessionsArr.length).toBe(2);
    expect(component.sessionsArr[0].title).toBe('Intro');
  });

  it('sets currentUserRole from service', () => {
    expect(component.currentUserRole).toBe('member');
  });

  it('creates a session and resets form', () => {
    component.newSession.title = 'New';
    component.newSession.description = 'Desc';
    component.newSession.start_time = '2025-09-22T09:00';
    component.newSession.end_time = '2025-09-22T10:00';
    component.newSession.location = 'Lab';

    component.createSession();
    fixture.detectChanges();

    const last = component.sessionsArr[component.sessionsArr.length - 1];
    expect(last.title).toBe('New');
    // form reset
    expect(component.newSession.title).toBe('');
    expect(component.newSession.group_id).toBe('g1');
  });

  it('deletes a session (optimistic update + service call)', () => {
    const svc = TestBed.inject(Sessions) as unknown as MockSessionsService;
    const delSpy = jest.spyOn(svc, 'deleteSession');

    component.deleteSession('s1');
    fixture.detectChanges();

    expect(delSpy).toHaveBeenCalledWith('s1');
    expect(component.sessionsArr.find(s => s.id === 's1')).toBeUndefined();
  });

  it('leaveGroup navigates to /studygroup when confirmed', () => {
    const router = TestBed.inject(Router);
    const navSpy = jest.spyOn(router, 'navigate');

    component.leaveGroup();

    expect(navSpy).toHaveBeenCalledWith(['/studygroup']);
  });

  it('Leave Group button disabled when role is admin', () => {
    // Override role for this test
    const svc = TestBed.inject(Sessions) as unknown as MockSessionsService;
    jest.spyOn(svc, 'getUserRole').mockReturnValue(of({ role: 'admin' }));

    // Recreate component so ngOnInit runs again with the mocked role
    fixture = TestBed.createComponent(GroupSession);
    component = fixture.componentInstance;
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('section button');
    expect(component.currentUserRole).toBe('admin');
    expect(btn.disabled).toBe(true);
  });

  it('cancels delete when confirm is false', () => {
    (window.confirm as jest.Mock).mockReturnValue(false);
    const svc = TestBed.inject(Sessions) as unknown as MockSessionsService;
    const delSpy = jest.spyOn(svc, 'deleteSession');

    // Start with 2
    expect(component.sessionsArr.length).toBe(2);
    component.deleteSession('s2');

    expect(delSpy).not.toHaveBeenCalled();
    expect(component.sessionsArr.length).toBe(2);
  });
});
