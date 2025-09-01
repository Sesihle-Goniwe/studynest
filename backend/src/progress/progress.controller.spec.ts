import { Test, TestingModule } from '@nestjs/testing';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { CreateStudyLogDto } from './dto/create-study-log.dto';
import { InternalServerErrorException } from '@nestjs/common';

describe('ProgressController', () => {
  let controller: ProgressController;
  let service: ProgressService;

  const mockProgressService = {
    createTopic: jest.fn(),
    findAllTopicsForUser: jest.fn(),
    addStudyLog: jest.fn(),
    getStudyLogs: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
    findUserGroups: jest.fn(),
    getRankingsForGroup: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgressController],
      providers: [
        {
          provide: ProgressService,
          useValue: mockProgressService,
        },
      ],
    }).compile();

    controller = module.get<ProgressController>(ProgressController);
    service = module.get<ProgressService>(ProgressService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a topic', async () => {
      const createTopicDto: CreateTopicDto = {
        name: 'Test Topic',
        file_id: 'file123',
        userId: 'user123',
      };
      const mockRequest = { user: { id: 'user123' } };
      const expectedResult = { id: '1', ...createTopicDto };

      mockProgressService.createTopic.mockResolvedValue(expectedResult);

      const result = await controller.create(createTopicDto, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(service.createTopic).toHaveBeenCalledWith(createTopicDto);
    });

    it('should handle errors when creating topic', async () => {
      const createTopicDto: CreateTopicDto = {
        name: 'Test Topic',
        userId: 'user123',
      };
      const mockRequest = { user: { id: 'user123' } };

      mockProgressService.createTopic.mockRejectedValue(
        new InternalServerErrorException('Failed to create topic.')
      );

      await expect(controller.create(createTopicDto, mockRequest)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe('findAll', () => {
    it('should return all topics for a user', async () => {
      const userId = 'user123';
      const expectedTopics = [
        {
          id: '1',
          name: 'Topic 1',
          status: 'In Progress',
          created_at: '2024-01-01',
          file_id: null,
          date_completed: null,
        },
        {
          id: '2',
          name: 'Topic 2',
          status: 'Completed',
          created_at: '2024-01-02',
          file_id: 'file123',
          date_completed: '2024-01-15',
        },
      ];

      mockProgressService.findAllTopicsForUser.mockResolvedValue(expectedTopics);

      const result = await controller.findAll(userId);

      expect(result).toEqual(expectedTopics);
      expect(service.findAllTopicsForUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('addStudyLog', () => {
    it('should add a study log', async () => {
      const createStudyLogDto: CreateStudyLogDto = {
        userId: 'user123',
        topicId: 'topic123',
        date: '2024-01-01',
        hours: 2.5,
      };
      const expectedResult = { id: '1', ...createStudyLogDto };

      mockProgressService.addStudyLog.mockResolvedValue(expectedResult);

      const result = await controller.addStudyLog(createStudyLogDto);

      expect(result).toEqual(expectedResult);
      expect(service.addStudyLog).toHaveBeenCalledWith(createStudyLogDto);
    });
  });

  describe('getStudyLogs', () => {
    it('should get study logs for a user', async () => {
      const userId = 'user123';
      const expectedLogs = [
        {
          id: '1',
          date: '2024-01-01',
          hours: 2,
          topic_id: 'topic1',
          topic: { name: 'Topic 1' },
        },
      ];

      mockProgressService.getStudyLogs.mockResolvedValue(expectedLogs);

      const result = await controller.getStudyLogs(userId);

      expect(result).toEqual(expectedLogs);
      expect(service.getStudyLogs).toHaveBeenCalledWith(userId, undefined);
    });

    it('should get study logs for a specific topic', async () => {
      const userId = 'user123';
      const topicId = 'topic123';
      const expectedLogs = [
        {
          id: '1',
          date: '2024-01-01',
          hours: 2,
          topic_id: topicId,
          topic: { name: 'Specific Topic' },
        },
      ];

      mockProgressService.getStudyLogs.mockResolvedValue(expectedLogs);

      const result = await controller.getStudyLogs(userId, topicId);

      expect(result).toEqual(expectedLogs);
      expect(service.getStudyLogs).toHaveBeenCalledWith(userId, topicId);
    });
  });

  describe('update', () => {
    it('should update topic status', async () => {
      const id = 'topic123';
      const body = { status: 'Completed' };
      const expectedResult = [{ id, status: 'Completed', date_completed: '2024-01-15' }];

      mockProgressService.updateStatus.mockResolvedValue(expectedResult);

      const result = await controller.update(id, body);

      expect(result).toEqual(expectedResult);
      expect(service.updateStatus).toHaveBeenCalledWith(id, body.status);
    });
  });

  describe('remove', () => {
    it('should remove a topic', async () => {
      const id = 'topic123';
      const expectedResult = { message: `Topic with id ${id} deleted successfully.` };

      mockProgressService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });

  describe('findUserGroups', () => {
    it('should find user groups', async () => {
      const userId = 'user123';
      const expectedGroups = [
        { id: 'group1', name: 'Study Group 1' },
        { id: 'group2', name: 'Study Group 2' },
      ];

      mockProgressService.findUserGroups.mockResolvedValue(expectedGroups);

      const result = await controller.findUserGroups(userId);

      expect(result).toEqual(expectedGroups);
      expect(service.findUserGroups).toHaveBeenCalledWith(userId);
    });
  });

  describe('getRankings', () => {
    it('should get rankings for a group', async () => {
      const groupId = 'group123';
      const expectedRankings = [
        { user_id: 'user1', total_hours: 10, rank: 1 },
        { user_id: 'user2', total_hours: 8, rank: 2 },
      ];

      mockProgressService.getRankingsForGroup.mockResolvedValue(expectedRankings);

      const result = await controller.getRankings(groupId);

      expect(result).toEqual(expectedRankings);
      expect(service.getRankingsForGroup).toHaveBeenCalledWith(groupId);
    });
  });
});