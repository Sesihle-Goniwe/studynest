import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

// Create a mock EventsService
const mockEventsService = {
  getUpcomingEvents: jest.fn(),
};

describe('EventsController', () => {
  let controller: EventsController;
  let service: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: mockEventsService, // Use the mock service
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get<EventsService>(EventsService);
  });

  // Reset mocks before each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUpcomingEvents', () => {
    it('should call the service to get upcoming events and return them', async () => {
      // Arrange: Define the mock data the service should return
      const mockResult = [{ id: 1, name: 'NestJS Conf', date: '2024-10-26' }];
      mockEventsService.getUpcomingEvents.mockResolvedValue(mockResult);

      // Act: Call the controller method
      const result = await controller.getUpcomingEvents();

      // Assert: Verify the outcome
      // 1. Check if the service method was called
      expect(service.getUpcomingEvents).toHaveBeenCalled();
      // 2. Check if the controller returned the data from the service
      expect(result).toEqual(mockResult);
    });

    it('should forward errors from the service', async () => {
        // Arrange: Mock the service to throw an error
        const mockError = new Error('Service failed');
        mockEventsService.getUpcomingEvents.mockRejectedValue(mockError);
  
        // Act & Assert: Expect the controller method to reject with the same error
        await expect(controller.getUpcomingEvents()).rejects.toThrow('Service failed');
        expect(service.getUpcomingEvents).toHaveBeenCalled();
      });
  });
});

