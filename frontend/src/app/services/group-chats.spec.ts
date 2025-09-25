import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { GroupChatsService, GroupMessage } from './group-chats.service';

describe('GroupChatsService', () => {
  let service: GroupChatsService;
  let http: HttpTestingController;

  const BASE = 'https://studynester.onrender.com/chats';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GroupChatsService],
    });
    service = TestBed.inject(GroupChatsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sendMessage() should POST to /send with {text, groupId, userId}', () => {
    const payload = { text: 'Hello!', groupId: 'g1', userId: 'user-123' };
    const resp = {
      success: true,
      message: {
        id: 'm1',
        group_id: 'g1',
        user_id: 'user-123',
        message: 'Hello!',
        created_at: '2025-09-25T10:00:00Z',
      } as GroupMessage,
    };

    service.sendMessage('g1', 'user-123', 'Hello!').subscribe((r) => {
      expect(r).toEqual(resp);
      expect(r.success).toBe(true);
      expect(r.message.message).toBe('Hello!');
    });

    const req = http.expectOne(`${BASE}/send`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(resp);
  });

  it('sendMessage() should propagate errors via catchError', () => {
    service.sendMessage('g1', 'user-123', 'Hello!').subscribe({
      next: () => fail('expected error'),
      error: (err) => {
        expect(err.status).toBe(500);
      },
    });

    const req = http.expectOne(`${BASE}/send`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
  });

  it('getMessages() should GET /group/:groupId', () => {
    const resp = {
      success: true,
      messages: [
        { id: 'm1', group_id: 'g1', user_id: 'u1', message: 'hi' },
        { id: 'm2', group_id: 'g1', user_id: 'u2', message: 'yo' },
      ] as GroupMessage[],
    };

    service.getMessages('g1').subscribe((r) => {
      expect(r).toEqual(resp);
      expect(r.messages.length).toBe(2);
      expect(r.success).toBe(true);
    });

    const req = http.expectOne(`${BASE}/group/g1`);
    expect(req.request.method).toBe('GET');
    req.flush(resp);
  });
});
