import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { NotesApiService } from './notes-api.service';

describe('NotesApiService', () => {
  let service: NotesApiService;
  let http: HttpTestingController;

  const BASE = 'https://studynester.onrender.com/files';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotesApiService],
    });
    service = TestBed.inject(NotesApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uploadNote() should POST FormData with file and userId', () => {
    const file = new File(['hello'], 'notes.pdf', { type: 'application/pdf' });

    service.uploadNote(file, 'user-123').subscribe((res) => {
      expect(res).toEqual({ ok: true });
    });

    const req = http.expectOne(`${BASE}/upload`);
    expect(req.request.method).toBe('POST');

    // Body should be FormData with both fields
    const body = req.request.body as FormData;
    expect(body instanceof FormData).toBe(true);
    expect(body.get('userId')).toBe('user-123');

    const sentFile = body.get('file') as File;
    expect(sentFile).toBeTruthy();
    expect(sentFile.name).toBe('notes.pdf');

    // Let the browser set Content-Type (multipart boundary)
    expect(req.request.headers.has('Content-Type')).toBe(false);

    req.flush({ ok: true });
  });

  it('getNoteUrl() should GET /:fileId/url with userId as query param', () => {
    service.getNoteUrl('file-1', 'user-123').subscribe((res) => {
      expect(res.signedUrl).toBe('https://cdn.example.com/file-1.pdf');
    });

    const req = http.expectOne(
      r => r.url === `${BASE}/file-1/url` && r.params.get('userId') === 'user-123'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ signedUrl: 'https://cdn.example.com/file-1.pdf' });
  });

  it('getSummary() should POST /:fileId/summarize with userId in body', () => {
    service.getSummary('file-2', 'user-999').subscribe((res) => {
      expect(res.summary).toContain('Summary for file-2');
    });

    const req = http.expectOne(`${BASE}/file-2/summarize`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ userId: 'user-999' });
    req.flush({ summary: 'Summary for file-2 ...' });
  });
});
