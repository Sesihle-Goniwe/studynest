import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';


describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  // Create a mock service
  const mockNotificationsService = {
    getAllNotifications: jest.fn(),
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    clearNotifications: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all notifications', async () => {
      const result = [{ id: '1', message: 'Hello' }];
      jest.spyOn(service, 'getAllNotifications').mockResolvedValue(result);

      expect(await controller.getAll()).toEqual(result);
      expect(service.getAllNotifications).toHaveBeenCalled();
    });
  });

  describe('getNotifications', () => {
    it('should return notifications for a user', async () => {
      const userId = 'user1';
      const result = [{ id: '1', userId, message: 'Hi' }];
      jest.spyOn(service, 'getNotifications').mockResolvedValue(result);

      expect(await controller.getNotifications(userId)).toEqual(result);
      expect(service.getNotifications).toHaveBeenCalledWith(userId);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const id = 'notif1';
      const result = { success: true };
      jest.spyOn(service, 'markAsRead').mockResolvedValue(result);

      expect(await controller.markAsRead(id)).toEqual(result);
      expect(service.markAsRead).toHaveBeenCalledWith(id);
    });
  });

 describe('clearNotifications', () => {
  it('should clear notifications for a user', async () => {
    const userId = 'user1';
    const result = null; // service is typed to return null
    jest.spyOn(service, 'clearNotifications').mockResolvedValue(result);

    expect(await controller.clearNotifications(userId)).toEqual(result);
    expect(service.clearNotifications).toHaveBeenCalledWith(userId);
  });
});

});
