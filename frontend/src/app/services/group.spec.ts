import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { GroupService } from './group.service';
import { StudyGroup } from '../models/study-group.model';

describe('GroupService', () => {
  let service: GroupService;
  let http: HttpTestingController;

  const BASE = 'https://studynester.onrender.com/groups';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GroupService],
    });
    service = TestBed.inject(GroupService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAllGroups() should GET /groups', () => {
    const resp: StudyGroup[] = [
      { id: 'g1', name: 'Math Group', description: 'Algebra lovers' },
      { id: 'g2', name: 'CS Group', description: 'Coding practice' },
    ];

    service.getAllGroups().subscribe((groups) => {
      expect(groups).toEqual(resp);
      expect(groups.length).toBe(2);
    });

    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('GET');
    req.flush(resp);
  });

  it('getMyGroups() should GET /groups/:userId', () => {
    const resp = [{ group_id: 'g1', role: 'member' }];

    service.getMyGroups('u1').subscribe((groups) => {
      expect(groups).toEqual(resp);
    });

    const req = http.expectOne(`${BASE}/u1`);
    expect(req.request.method).toBe('GET');
    req.flush(resp);
  });

  it('createGroup() should POST to /groups/create', () => {
    const resp: StudyGroup[] = [
      { id: 'g1', name: 'Math Group', description: 'Algebra lovers' },
    ];

    service.createGroup('Math Group', 'Algebra lovers', 'u1').subscribe((r) => {
      expect(r).toEqual(resp);
      expect(r[0].name).toBe('Math Group');
    });

    const req = http.expectOne(`${BASE}/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Math Group',
      description: 'Algebra lovers',
      userId: 'u1',
    });
    req.flush(resp);
  });

  it('joinGroup() should POST to /groups/join', () => {
    const resp = { success: true };

    service.joinGroup('g1', 'u1').subscribe((r) => {
      expect(r).toEqual(resp);
    });

    const req = http.expectOne(`${BASE}/join`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      groupId: 'g1',
      userId: 'u1',
      role: 'member',
    });
    req.flush(resp);
  });

  it('deleteGroup() should DELETE to /groups/:userId', () => {
    const resp = { success: true };

    service.deleteGroup('u1').subscribe((r) => {
      expect(r).toEqual(resp);
    });

    const req = http.expectOne(`${BASE}/u1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(resp);
  });

  it('updateGroup() should PATCH to /groups/:groupId', () => {
    const resp = { success: true };

    service.updateGroup('g1', 'New Name', 'New Desc').subscribe((r) => {
      expect(r).toEqual(resp);
    });

    const req = http.expectOne(`${BASE}/g1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      name: 'New Name',
      description: 'New Desc',
    });
    req.flush(resp);
  });

  it('setGroupGoal() should POST to /groups/set', () => {
    const resp = { success: true };

    service.setGroupGoal('g1', 'Finish Project', 'u1').subscribe((r) => {
      expect(r).toEqual(resp);
    });

    const req = http.expectOne(`${BASE}/set`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      groupId: 'g1',
      title: 'Finish Project',
      createdBy: 'u1',
    });
    req.flush(resp);
  });

  it('getGroupGoals() should GET /groups/goals/:groupId', () => {
    const resp = [{ id: 'goal1', title: 'Finish Project' }];

    service.getGroupGoals('g1').subscribe((r) => {
      expect(r).toEqual(resp);
    });

    const req = http.expectOne(`${BASE}/goals/g1`);
    expect(req.request.method).toBe('GET');
    req.flush(resp);
  });
});
