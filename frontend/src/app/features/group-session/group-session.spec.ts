// group-session.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { GroupSession } from './group-session';
import { AuthService } from '../auth/auth.service';
import { Sessions, _Session } from '../../services/sessions';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { convertToParamMap } from '@angular/router';

class MockAuthService {
  getCurrentUser() { return { id: 'user-123' }; }
}

const seedSessions: _Session[] = [
  { id: 's1', title: 'Intro', description: 'Basics', start_time: '2025-09-20T10:00', end_time: '2025-09-20T11:00', location: 'Room 1', group_id: 'g1', created_by: 'user-123' } as any,
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
      imports: [
        GroupSession,
        RouterTestingModule.withRoutes([]), // ✅ real router providers
      ],
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        { provide: Sessions, useClass: MockSessionsService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ groupId: 'g1' }) },
          },
        },
        // ❌ DO NOT provide Router manually; RouterTestingModule handles it
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupSession);
    component = fixture.componentInstance;

    spyOn(window, 'confirm').and.returnValue(true); // control destructive prompts
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ...keep the rest of your tests the same...
});
