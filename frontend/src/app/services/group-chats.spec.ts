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
        groupId: 'g1',
        userId: 'user-123',
        message: 'Hello!',
        createdAt: '2025-09-25T10:00:00Z',
      } as GroupMessage,
    };

    service.sendMessage('g1', 'user-123', 'Hello!').subscribe((r) => {
      expect(r).toEqual(resp);
      expect(r.success).toBeTrue();
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
        {
          id: 'm1',
          groupId: 'g1',
          userId: 'u1',
          message: 'hi',
          messageType: 'text',
          createdAt: '2025-09-25T10:00:00Z',
        },
        {
          id: 'm2',
          groupId: 'g1',
          userId: 'u2',
          message: 'yo',
          messageType: 'text',
          createdAt: '2025-09-25T10:05:00Z',
        },
      ] as GroupMessage[],
    };

    service.getMessages('g1').subscribe((r) => {
      expect(r).toEqual(resp);
      expect(r.messages.length).toBe(2);
      expect(r.success).toBeTrue();
    });

    const req = http.expectOne(`${BASE}/group/g1`);
    expect(req.request.method).toBe('GET');
    req.flush(resp);
  });

  it('uploadFileToChat() should POST to /upload with FormData', () => {
    const file = new File(['dummy'], 'test.txt', { type: 'text/plain' });

    service.uploadFileToChat(file, 'u1', 'g1', 'optional msg').subscribe((resp) => {
      expect(resp.success).toBeTrue();
    });

    const req = http.expectOne(`${BASE}/upload`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();

    const body = req.request.body as FormData;
    expect(body.get('file')).toBeTruthy();
    expect(body.get('userId')).toBe('u1');
    expect(body.get('groupId')).toBe('g1');
    expect(body.get('message')).toBe('optional msg');

    req.flush({ success: true });
  });

  it('editMessage() should PATCH to /edit/:id', () => {
    const resp = {
      success: true,
      message: {
        id: 'm1',
        groupId: 'g1',
        userId: 'u1',
        message: 'updated',
        messageType: 'text',
        createdAt: '2025-09-25T10:10:00Z',
      } as GroupMessage,
    };

    service.editMessage('m1', 'u1', 'updated').subscribe((r) => {
      expect(r).toEqual(resp);
      expect(r.message?.message).toBe('updated');
    });

    const req = http.expectOne(`${BASE}/edit/m1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ userId: 'u1', text: 'updated' });
    req.flush(resp);
  });

  it('deleteMessage() should DELETE to /delete/:id?userId', () => {
    const resp = { success: true };

    service.deleteMessage('m1', 'u1').subscribe((r) => {
      expect(r).toEqual(resp);
      expect(r.success).toBeTrue();
    });

    const req = http.expectOne(`${BASE}/delete/m1?userId=u1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(resp);
  });
});
