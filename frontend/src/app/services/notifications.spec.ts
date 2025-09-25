import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Notifications, _Notifications } from './notifications';

describe('Notifications Service', () => {
  let service: Notifications;
  let httpMock: HttpTestingController;

  const baseUrl = 'https://studynester.onrender.com/notifications';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Notifications]
    });
    service = TestBed.inject(Notifications);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // ensures no unmatched requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all notifications', () => {
    const mockNotifications: _Notifications[] = [
      { id: '1', user_id: '123', message: 'Hello', read: false },
      { id: '2', user_id: '456', message: 'Hi there', read: true }
    ];

    service.getNotifications().subscribe(res => {
      expect(res.length).toBe(2);
      expect(res).toEqual(mockNotifications);
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockNotifications);
  });

  it('should fetch notifications by user', () => {
    const mockUserId = '123';
    const mockData = [{ id: '1', user_id: '123', message: 'Test', read: false }];

    service.getNotificationsByUser(mockUserId).subscribe(res => {
      expect(res).toEqual(mockData);
    });

    const req = httpMock.expectOne(`${baseUrl}/${mockUserId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('should mark notification as read', () => {
    const mockNotificationId = '1';
    const updated = { id: '1', user_id: '123', message: 'Hello', read: true };

    service.markAsRead(mockNotificationId).subscribe(res => {
      expect(res).toEqual(updated);
    });

    const req = httpMock.expectOne(`${baseUrl}/${mockNotificationId}`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ read: true });
    req.flush(updated);
  });

  it('should clear notifications for a user', () => {
    const mockUserId = '123';

    service.clearNotifications(mockUserId).subscribe(res => {
      expect(res).toEqual({ success: true });
    });

    const req = httpMock.expectOne(`${baseUrl}/${mockUserId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });
});
