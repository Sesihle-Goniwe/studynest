import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotesApiService } from './notes-api.service';

describe('NotesApiService', () => {
  let service: NotesApiService;
  let httpMock: HttpTestingController;
  // Access the private property for testing purposes to avoid magic strings
  let backendUrl: string;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotesApiService]
    });
    service = TestBed.inject(NotesApiService);
    httpMock = TestBed.inject(HttpTestingController);
    backendUrl = (service as any).backendUrl; // Cast to any to access private member
  });

  afterEach(() => {
    // After every test, verify that there are no more pending requests.
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('uploadNote', () => {
    it('should send a POST request with FormData containing the file and userId', () => {
      const mockFile = new File(['dummy content'], 'test-file.pdf', { type: 'application/pdf' });
      const mockUserId = 'user-123';
      const mockResponse = { message: 'Upload successful', data: { id: 'file-abc' } };

      service.uploadNote(mockFile, mockUserId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${backendUrl}/upload`);
      expect(req.request.method).toBe('POST');

      // FormData is not a plain object, so we inspect its contents.
      const formData = req.request.body as FormData;
      expect(formData.get('file')).toEqual(mockFile);
      expect(formData.get('userId')).toBe(mockUserId);

      req.flush(mockResponse);
    });
  });

  describe('getPersonalNoteUrl', () => {
    it('should send a GET request with userId as a query parameter', () => {
      const mockFileId = 'file-abc';
      const mockUserId = 'user-123';
      const mockResponse = { signedUrl: 'https://example.com/personal-signed-url' };

      service.getPersonalNoteUrl(mockFileId, mockUserId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });
      
      const expectedUrl = `${backendUrl}/personal/${mockFileId}/url?userId=${mockUserId}`;
      const req = httpMock.expectOne(expectedUrl);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getGroupNoteUrl', () => {
    it('should send a GET request with userId as a query parameter', () => {
      const mockFileId = 'file-group-xyz';
      const mockUserId = 'user-456';
      const mockResponse = { signedUrl: 'https://example.com/group-signed-url' };

      service.getGroupNoteUrl(mockFileId, mockUserId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const expectedUrl = `${backendUrl}/group/${mockFileId}/url?userId=${mockUserId}`;
      const req = httpMock.expectOne(expectedUrl);
      
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getSummary', () => {
    it('should send a POST request with userId in the body', () => {
      const mockFileId = 'file-abc';
      const mockUserId = 'user-123';
      const mockResponse = { summary: 'This is a summary of the document.' };

      service.getSummary(mockFileId, mockUserId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${backendUrl}/${mockFileId}/summarize`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ userId: mockUserId });

      req.flush(mockResponse);
    });
  });
});

