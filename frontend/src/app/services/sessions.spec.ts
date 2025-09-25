import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Sessions, _Session } from './sessions';

describe('Sessions service', () => {
  let service: Sessions;
  let http: HttpTestingController;

  const BASE = 'https://studynester.onrender.com/sessions';

  const seedSessions: _Session[] = [
    {
      id: 's1',
      group_id: 'g1',
      title: 'Intro',
      description: 'Basics',
      start_time: '2025-09-20T10:00',
      end_time: '2025-09-20T11:00',
      location: 'Room 1',
    },
    {
      id: 's2',
      group_id: 'g1',
      title: 'Deep Dive',
      description: 'Advanced',
      start_time: '2025-09-21T10:00',
      end_time: '2025-09-21T11:30',
      location: 'Room 2',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Sessions],
    });

    service = TestBed.inject(Sessions);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('createSession() should POST to /create and return created session', () => {
    const dto = {
      title: 'New',
      description: 'Desc',
      start_time: '2025-10-01T09:00',
      end_time: '2025-10-01T10:00',
      location: 'Lab',
      group_id: 'g1',
      created_by: 'user-123',
    };

    const created = { id: 's3', ...dto };

    service.createSession(dto).subscribe(res => {
      expect(res).toEqual(created);
    });

    const req = http.expectOne(`${BASE}/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(created);
  });

  it('getSessionbyGroupID() should GET sessions for a group', () => {
    service.getSessionbyGroupID('g1').subscribe(res => {
      expect(res).toEqual(seedSessions);
      expect(res.length).toBe(2);
    });

    const req = http.expectOne(`${BASE}/g1`);
    expect(req.request.method).toBe('GET');
    req.flush(seedSessions);
  });

  it('deleteSession() should DELETE by sessionId', () => {
    service.deleteSession('s1').subscribe(res => {
      // API typically returns 200/204 with empty body
      expect(res).toEqual({});
    });

    const req = http.expectOne(`${BASE}/s1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('leaveGroup() should DELETE /:groupId/:uid', () => {
    service.leaveGroup('g1', 'user-123').subscribe(res => {
      expect(res).toEqual({});
    });

    const req = http.expectOne(`${BASE}/g1/user-123`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('getUserRole() should GET /:groupId/:userId', () => {
    const roleResp = { role: 'member' };

    service.getUserRole('g1', 'user-123').subscribe(res => {
      expect(res).toEqual(roleResp);
      expect(res.role).toBe('member');
    });

    const req = http.expectOne(`${BASE}/g1/user-123`);
    expect(req.request.method).toBe('GET');
    req.flush(roleResp);
  });
});
