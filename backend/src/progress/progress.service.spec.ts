import { Test, TestingModule } from '@nestjs/testing';
import { ProgressService } from './progress.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { CreateStudyLogDto } from './dto/create-study-log.dto';
import { InternalServerErrorException } from '@nestjs/common';

describe('ProgressService', () => {
  let service: ProgressService;
  let supabaseService: SupabaseService;

  const mockSupabaseClient = {
    from: jest.fn(),
    rpc: jest.fn(),
  };

  const mockSupabaseService = {
    getClient: jest.fn().mockReturnValue(mockSupabaseClient),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTopic', () => {
    it('should create a topic successfully', async () => {
      const createTopicDto: CreateTopicDto = {
        name: 'Test Topic',
        file_id: 'file123',
        userId: 'user123',
      };
      const expectedData = { id: '1', name: 'Test Topic', file_id: 'file123', user_id: 'user123' };

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedData, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await service.createTopic(createTopicDto);

      expect(result).toEqual(expectedData);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('topics');
      expect(mockChain.insert).toHaveBeenCalledWith({
        name: createTopicDto.name,
        file_id: createTopicDto.file_id,
        user_id: createTopicDto.userId,
      });
    });

    it('should throw InternalServerErrorException on error', async () => {
      const createTopicDto: CreateTopicDto = {
        name: 'Test Topic',
        userId: 'user123',
      };

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
      };

      mockSupabaseClient.from.mockReturnValue(mockChain);

      await expect(service.createTopic(createTopicDto)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe('findAllTopicsForUser', () => {
    it('should return all topics for a user', async () => {
      const userId = 'user123';
      const expectedData = [
        { id: '1', name: 'Topic 1', status: 'In Progress' },
        { id: '2', name: 'Topic 2', status: 'Completed' },
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: expectedData, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await service.findAllTopicsForUser(userId);

      expect(result).toEqual(expectedData);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('topics');
      expect(mockChain.select).toHaveBeenCalledWith(
        'id, name, status, created_at, file_id, date_completed'
      );
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', userId);
    });
  });

  describe('addStudyLog', () => {
    it('should add a study log successfully', async () => {
      const createStudyLogDto: CreateStudyLogDto = {
        userId: 'user123',
        topicId: 'topic123',
        date: '2024-01-01',
        hours: 2.5,
      };
      const expectedData = { id: '1', ...createStudyLogDto };

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedData, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await service.addStudyLog(createStudyLogDto);

      expect(result).toEqual(expectedData);
      expect(mockChain.insert).toHaveBeenCalledWith({
        user_id: createStudyLogDto.userId,
        topic_id: createStudyLogDto.topicId,
        date: createStudyLogDto.date,
        hours: createStudyLogDto.hours,
      });
    });
  });

  describe('getStudyLogs', () => {
    it('should get study logs without topicId filter', async () => {
      const userId = 'user123';
      const expectedData = [
        { id: '1', date: '2024-01-01', hours: 2, topic_id: 'topic1', topic: { name: 'Topic 1' } },
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: expectedData, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await service.getStudyLogs(userId);

      expect(result).toEqual(expectedData);
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', userId);
    });

    it('should get study logs with topicId filter', async () => {
      const userId = 'user123';
      const topicId = 'topic123';
      const expectedData = [
        { id: '1', date: '2024-01-01', hours: 2, topic_id: topicId, topic: { name: 'Topic 1' } },
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      // Setup the chain to handle multiple eq calls
      mockChain.eq.mockImplementation((field, value) => {
        if (field === 'topic_id' && value === topicId) {
          return Promise.resolve({ data: expectedData, error: null });
        }
        return mockChain;
      });

      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await service.getStudyLogs(userId, topicId);

      expect(result).toEqual(expectedData);
      // ... continuing from where I left off

      expect(mockChain.eq).toHaveBeenCalledWith('user_id', userId);
      expect(mockChain.eq).toHaveBeenCalledWith('topic_id', topicId);
    });
  });

  describe('updateStatus', () => {
    it('should update status to In Progress', async () => {
      const id = 'topic123';
      const status = 'In Progress';
      const expectedData = [{ id, status, date_completed: null }];

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: expectedData, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await service.updateStatus(id, status);

      expect(result).toEqual(expectedData);
      expect(mockChain.update).toHaveBeenCalledWith({ status });
      expect(mockChain.eq).toHaveBeenCalledWith('id', id);
    });

    it('should update status to Completed with date', async () => {
      const id = 'topic123';
      const status = 'Completed';
      const mockDate = '2024-01-15T10:00:00.000Z';
      jest.spyOn(global, 'Date').mockImplementation(() => ({
        toISOString: () => mockDate,
      } as any));

      const expectedData = [{ id, status, date_completed: mockDate }];

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: expectedData, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await service.updateStatus(id, status);

      expect(result).toEqual(expectedData);
      expect(mockChain.update).toHaveBeenCalledWith({
        status,
        date_completed: mockDate,
      });
    });

    it('should throw InternalServerErrorException on error', async () => {
      const id = 'topic123';
      const status = 'In Progress';

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
      };

      mockSupabaseClient.from.mockReturnValue(mockChain);

      await expect(service.updateStatus(id, status)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe('remove', () => {
    it('should remove topic and associated study logs', async () => {
      const id = 'topic123';

      const mockStudyLogsChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      const mockTopicsChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'study_logs') return mockStudyLogsChain;
        if (table === 'topics') return mockTopicsChain;
      });

      const result = await service.remove(id);

      expect(result).toEqual({ message: `Topic with id ${id} deleted successfully.` });
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('study_logs');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('topics');
      expect(mockStudyLogsChain.eq).toHaveBeenCalledWith('topic_id', id);
      expect(mockTopicsChain.eq).toHaveBeenCalledWith('id', id);
    });

    it('should throw error if study logs deletion fails', async () => {
      const id = 'topic123';

      const mockStudyLogsChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      };

      mockSupabaseClient.from.mockReturnValue(mockStudyLogsChain);

      await expect(service.remove(id)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw error if topic deletion fails', async () => {
      const id = 'topic123';

      const mockStudyLogsChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      const mockTopicsChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      };

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'study_logs') return mockStudyLogsChain;
        if (table === 'topics') return mockTopicsChain;
      });

      await expect(service.remove(id)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findUserGroups', () => {
    it('should find user groups successfully', async () => {
      const userId = 'user123';
      const rawData = [
        { group: { id: 'group1', name: 'Study Group 1' } },
        { group: { id: 'group2', name: 'Study Group 2' } },
      ];
      const expectedData = [
        { id: 'group1', name: 'Study Group 1' },
        { id: 'group2', name: 'Study Group 2' },
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: rawData, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await service.findUserGroups(userId);

      expect(result).toEqual(expectedData);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('group_members');
      expect(mockChain.select).toHaveBeenCalledWith('group:study_groups(id, name)');
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', userId);
    });

    it('should throw InternalServerErrorException on error', async () => {
      const userId = 'user123';

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'Query failed' } }),
      };

      mockSupabaseClient.from.mockReturnValue(mockChain);

      await expect(service.findUserGroups(userId)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe('getRankingsForGroup', () => {
    it('should get rankings for group successfully', async () => {
      const groupId = 'group123';
      const expectedData = [
        { user_id: 'user1', total_hours: 10, rank: 1 },
        { user_id: 'user2', total_hours: 8, rank: 2 },
      ];

      mockSupabaseClient.rpc.mockResolvedValue({ data: expectedData, error: null });

      const result = await service.getRankingsForGroup(groupId);

      expect(result).toEqual(expectedData);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_group_rankings', {
        group_id_param: groupId,
      });
    });

    it('should throw InternalServerErrorException on error', async () => {
      const groupId = 'group123';

      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' },
      });

      await expect(service.getRankingsForGroup(groupId)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });
});