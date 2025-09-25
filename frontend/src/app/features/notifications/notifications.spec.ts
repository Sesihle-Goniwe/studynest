import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NotificationsList } from './notifications';
import { Notifications, _Notifications } from '../../services/notifications';
import { AuthService } from '../auth/auth.service';
import { MatDialog } from '@angular/material/dialog';

class MockAuthService {
  getCurrentUser() {
    return { id: 'user-123' };
  }
}

class MockNotificationsService {
  getNotificationsByUser(uid: string) {
    const list: _Notifications[] = [
      { id: 'n1', read: false, created_at: '2025-09-01', message: 'Hi' } as any,
      { id: 'n2', read: true,  created_at: '2025-09-02', message: 'Yo' } as any,
    ];
    return of(list);
  }

  clearNotifications(uid: string) {
    return of(void 0);
  }
}

class MockMatDialog {
  open() {
    return { afterClosed: () => of(true) };
  }
}

describe('NotificationsList', () => {
  let fixture: ComponentFixture<NotificationsList>;
  let component: NotificationsList;
  let notSvc: Notifications;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsList], // standalone component
      providers: [
        { provide: Notifications, useClass: MockNotificationsService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: MatDialog, useClass: MockMatDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsList);
    component = fixture.componentInstance;
    notSvc = TestBed.inject(Notifications);
  });

  it('should create', () => {
    fixture.detectChanges(); // triggers ngOnInit
    expect(component).toBeTruthy();
  });

  it('should load notifications for current user on init', () => {
    const spy = jest.spyOn(notSvc, 'getNotificationsByUser' as any);
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('user-123');
    expect(component.notifications.length).toBe(2);
  });

  it('should render unread class on unread items', () => {
    fixture.detectChanges();
    const items: NodeListOf<HTMLElement> =
      fixture.nativeElement.querySelectorAll('.notification-item');
    // If your template uses a different selector, tweak it here.
    expect(items.length).toBe(2);
    expect(items[0].classList.contains('unread')).toBe(true);
    expect(items[1].classList.contains('unread')).toBe(false);
  });

  it('should clear notifications when clear button is clicked', () => {
    const spy = jest.spyOn(notSvc, 'clearNotifications' as any);
    fixture.detectChanges();

    const btn: HTMLButtonElement =
      fixture.nativeElement.querySelector('.clear-btn');
    btn.click();
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('user-123');
    expect(component.notifications).toEqual([]);
  });

  it('should open dialog when a notification item is clicked', () => {
    const dlg = TestBed.inject(MatDialog) as unknown as MockMatDialog;
    const openSpy = jest.spyOn(dlg, 'open');

    fixture.detectChanges();
    const firstItem: HTMLElement =
      fixture.nativeElement.querySelector('.notification-item');
    firstItem.click();

    expect(openSpy).toHaveBeenCalledTimes(1);
  });
});
