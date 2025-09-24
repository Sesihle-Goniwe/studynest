import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProgressApiService } from './progress-api.service';

describe('ProgressApiService', () => {
  let service: ProgressApiService;
  let httpMock: HttpTestingController;
  const mockApiUrl = 'https://studynester.onrender.com/progress';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProgressApiService]
    });
    service = TestBed.inject(ProgressApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify that no unmatched requests are outstanding
  });

  describe('getTopics', () => {
    it('should fetch topics for a user', () => {
      const mockUserId = 'user123';
      const mockTopics = [
        { id: '1', name: 'Mathematics', userId: mockUserId, status: 'active' },
        { id: '2', name: 'Science', userId: mockUserId, status: 'completed' }
      ];

      service.getTopics(mockUserId).subscribe(topics => {
        expect(topics).toEqual(mockTopics);
      });

      const req = httpMock.expectOne(`${mockApiUrl}/topics?userId=${mockUserId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTopics);
    });

    it('should handle empty response', () => {
      const mockUserId = 'user123';

      service.getTopics(mockUserId).subscribe(topics => {
        expect(topics).toEqual([]);
      });

      const req = httpMock.expectOne(`${mockApiUrl}/topics?userId=${mockUserId}`);
      req.flush([]);
    });
  });

  describe('createTopic', () => {
    it('should create a new topic', () => {
      const mockTopicData = {
        name: 'History',
        file_id: 'file123',
        userId: 'user123'
      };
      const mockResponse = { id: '3', ...mockTopicData, status: 'active' };

      service.createTopic(mockTopicData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${mockApiUrl}/topics`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockTopicData);
      req.flush(mockResponse);
    });

    it('should create topic without file_id', () => {
      const mockTopicData = {
        name: 'Geography',
        userId: 'user123'
      };

      service.createTopic(mockTopicData).subscribe();

      const req = httpMock.expectOne(`${mockApiUrl}/topics`);
      expect(req.request.body).toEqual(mockTopicData);
      req.flush({ id: '4', ...mockTopicData });
    });
  });

  describe('getStudyLogs', () => {
    it('should fetch study logs for a user', () => {
      const mockUserId = 'user123';
      const mockStudyLogs = [
        { id: '1', userId: mockUserId, topicId: '1', date: '2024-01-01', hours: 2 },
        { id: '2', userId: mockUserId, topicId: '2', date: '2024-01-02', hours: 3 }
      ];

      service.getStudyLogs(mockUserId).subscribe(logs => {
        expect(logs).toEqual(mockStudyLogs);
      });

      const req = httpMock.expectOne(`${mockApiUrl}/study-logs?userId=${mockUserId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStudyLogs);
    });
  });

  describe('addStudyLog', () => {
    it('should add a new study log', () => {
      const mockStudyLogData = {
        userId: 'user123',
        topicId: '1',
        date: '2024-01-01',
        hours: 2
      };
      const mockResponse = { id: '3', ...mockStudyLogData };

      service.addStudyLog(mockStudyLogData.userId, mockStudyLogData.topicId, mockStudyLogData.date, mockStudyLogData.hours)
        .subscribe(response => {
          expect(response).toEqual(mockResponse);
        });

      const req = httpMock.expectOne(`${mockApiUrl}/study-logs`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockStudyLogData);
      req.flush(mockResponse);
    });
  });

  describe('updateTopicStatus', () => {
    it('should update topic status', () => {
      const mockTopicId = '1';
      const mockStatus = 'completed';
      const mockResponse = { id: mockTopicId, status: mockStatus };

      service.updateTopicStatus(mockTopicId, mockStatus).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${mockApiUrl}/topics/${mockTopicId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: mockStatus });
      req.flush(mockResponse);
    });
  });

  describe('deleteTopic', () => {
    it('should delete a topic', () => {
      const mockTopicId = '1';
      const mockResponse = { message: 'Topic deleted successfully' };

      service.deleteTopic(mockTopicId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${mockApiUrl}/topics/${mockTopicId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('getUserGroups', () => {
    it('should fetch user groups', () => {
      const mockUserId = 'user123';
      const mockGroups = [
        { id: '1', name: 'Study Group A', userId: mockUserId },
        { id: '2', name: 'Study Group B', userId: mockUserId }
      ];

      service.getUserGroups(mockUserId).subscribe(groups => {
        expect(groups).toEqual(mockGroups);
      });

      const req = httpMock.expectOne(`${mockApiUrl}/user-groups?userId=${mockUserId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockGroups);
    });
  });

  describe('getGroupRankings', () => {
    it('should fetch group rankings', () => {
      const mockGroupId = 'group123';
      const mockRankings = [
        { userId: 'user1', username: 'John', totalHours: 10, rank: 1 },
        { userId: 'user2', username: 'Jane', totalHours: 8, rank: 2 }
      ];

      service.getGroupRankings(mockGroupId).subscribe(rankings => {
        expect(rankings).toEqual(mockRankings);
      });

      const req = httpMock.expectOne(`${mockApiUrl}/rankings/${mockGroupId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRankings);
    });
  });

  describe('Error handling', () => {
    it('should handle HTTP errors for getTopics', () => {
      const mockUserId = 'user123';
      const mockError = { status: 404, statusText: 'Not Found' };

      service.getTopics(mockUserId).subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${mockApiUrl}/topics?userId=${mockUserId}`);
      req.flush('Error', mockError);
    });

    it('should handle HTTP errors for createTopic', () => {
      const mockTopicData = { name: 'Test', userId: 'user123' };
      const mockError = { status: 400, statusText: 'Bad Request' };

      service.createTopic(mockTopicData).subscribe({
        next: () => fail('should have failed with 400 error'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${mockApiUrl}/topics`);
      req.flush('Invalid data', mockError);
    });
  });
});