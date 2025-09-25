// ---- Mocks must come before importing the component under test ----

// Mock Chart.js in both forms, since some files import 'chart.js' and others 'chart.js/auto'
jest.mock('chart.js', () => ({
  Chart: jest.fn().mockImplementation(() => ({ destroy: jest.fn(), update: jest.fn() })),
}));
jest.mock('chart.js/auto', () => ({
  Chart: jest.fn().mockImplementation(() => ({ destroy: jest.fn(), update: jest.fn() })),
}));

// Stub out dialog components so the test doesn't evaluate their templates/deps
jest.mock('../stats-dialog/stats-dialog', () => ({
  StatsDialogComponent: class {},
}));
jest.mock('../summary-dialog/summary-dialog', () => ({
  SummaryDialogComponent: class {},
}));
jest.mock('../log-hours-dialog/log-hours-dialog', () => ({
  LogHoursDialogComponent: class {},
}));

// JSDOM: ensure <canvas>.getContext exists for Chart usage
(HTMLCanvasElement.prototype as any).getContext =
  (HTMLCanvasElement.prototype as any).getContext ?? jest.fn(() => ({}));


import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { ProgressTracker } from './progress';
import { NotesApiService } from '../../services/notes-api.service';
import { AuthService } from '../auth/auth.service';
import { ProgressApiService } from '../../services/progress-api.service';
import { MatDialog } from '@angular/material/dialog';

// ---- Chart.js mock (must be top-level) ---------------------------------------
jest.mock('chart.js', () => {
  return {
    Chart: jest.fn().mockImplementation(() => ({
      destroy: jest.fn(),
    })),
  };
});
import { Chart } from 'chart.js';

// ---- Helpers & seed data -----------------------------------------------------
class MockAuthService {
  getCurrentUser() {
    return { id: 'user-123', email: 'me@example.com' };
  }
}

const seedTopics = [
  { id: 't1', name: 'A.pdf', status: 'Active', created_at: '2025-09-01T10:00:00Z', file_id: 'f1' },
  { id: 't2', name: 'B.pdf', status: 'Completed', created_at: '2025-09-02T10:00:00Z', date_completed: '2025-09-03T11:00:00Z', file_id: 'f2' },
];

const seedLogs = [
  { id: 'l1', hours: 2 },
  { id: 'l2', hours: 3 },
];

const seedGroups = [
  { id: 'g1', name: 'Alpha' },
  { id: 'g2', name: 'Beta' },
];

const seedRank = [
  { user_id: 'user-123', email: 'me@example.com', total_hours: 10 },
  { user_id: 'u2',       email: 'other@example.com', total_hours: 8 },
];

class MockNotesApiService {
  uploadNote(file: File, userId: string) {
    return of({ data: { file_name: file.name, id: 'file-123' } });
  }
  getNoteUrl(fileId: string, userId: string) {
    return of({ signedUrl: 'https://example.com/doc.pdf' });
  }
  getSummary(fileId: string, userId: string) {
    return of('This is a summary');
  }
}

class MockProgressApiService {
  // Defaults used by most tests
  getTopics(userId: string) {
    return of(seedTopics);
  }
  createTopic(dto: any) {
    return of({});
  }
  getStudyLogs(userId: string) {
    return of(seedLogs);
  }
  addStudyLog(userId: string, topicId: string, date: string, hours: number) {
    return of({});
  }
  updateTopicStatus(topicId: string, status: string) {
    return of({});
  }
  deleteTopic(topicId: string) {
    return of({});
  }
  // Important: return EMPTY groups by default to avoid early chart creation
  getUserGroups(userId: string) {
    return of([] as any[]);
  }
  getGroupRankings(groupId: string) {
    return of(seedRank);
  }
}

class MockMatDialog {
  open(_component?: any, _config?: any) {
    // default: dialog closes with a valid payload for log-hours
    return {
      afterClosed: () => of({
        topicId: 't1',
        date: new Date('2025-09-10'),
        hours: 1.5,
      }),
    };
  }
}

describe('ProgressTracker (standalone)', () => {
  let fixture: ComponentFixture<ProgressTracker>;
  let component: ProgressTracker;
  let notesSvc: MockNotesApiService;
  let progSvc: MockProgressApiService;
  let router: Router;

  beforeEach(async () => {
    // canvas.getContext stub for Chart.js
    (HTMLCanvasElement.prototype as any).getContext = (HTMLCanvasElement.prototype as any).getContext ?? jest.fn(() => ({}));

    await TestBed.configureTestingModule({
      imports: [ProgressTracker, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: NotesApiService, useClass: MockNotesApiService },
        { provide: ProgressApiService, useClass: MockProgressApiService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: MatDialog, useClass: MockMatDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressTracker);
    component = fixture.componentInstance;

    notesSvc = TestBed.inject(NotesApiService) as unknown as MockNotesApiService;
    progSvc  = TestBed.inject(ProgressApiService) as unknown as MockProgressApiService;
    router   = TestBed.inject(Router);

    // steady the confirm/alert cousins
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    jest.spyOn(window, 'alert').mockImplementation(() => {});

    fixture.detectChanges(); // ngOnInit -> loads topics + logs (groups empty by default)
  });

  it('creates and loads topics + study logs', () => {
    expect(component).toBeTruthy();

    // topics split
    expect(component.activeTopics.length).toBe(1);
    expect(component.completedTopics.length).toBe(1);

    // logs summed
    expect(component.totalHoursStudied).toBe(5);
  });

  it('selects a file via input and uploads, creating a topic', fakeAsync(() => {
    const file = new File(['hello'], 'Notes.pdf', { type: 'application/pdf' });
    const uploadSpy = jest.spyOn(notesSvc, 'uploadNote');
    const createSpy = jest.spyOn(progSvc, 'createTopic');

    // simulate file input event
    const input = document.createElement('input');
    const event = { target: { files: [file] } } as unknown as Event;
    component.onFileSelected(event);

    expect(component.selectedFile?.name).toBe('Notes.pdf');

    component.onUpload();
    tick(); // upload + createTopic

    expect(uploadSpy).toHaveBeenCalledWith(file, 'user-123');
    expect(createSpy).toHaveBeenCalledWith({ name: 'Notes.pdf', file_id: 'file-123', userId: 'user-123' });

    // optional: simulate 3s clear timeout
    jest.useFakeTimers();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  }));

  it('views a topic PDF and closes viewer', fakeAsync(() => {
    const noteSpy = jest.spyOn(notesSvc, 'getNoteUrl');

    component.viewTopicPdf(seedTopics[0]);
    tick();
    fixture.detectChanges();

    expect(noteSpy).toHaveBeenCalledWith('f1', 'user-123');
    expect(component.showPdfViewer).toBe(true);
    expect(component.pdfSrc).toBe('https://example.com/doc.pdf');

    component.closePdfViewer();
    expect(component.showPdfViewer).toBe(false);
    expect(component.pdfSrc).toBeNull();
  }));

  it('opens Log Hours dialog and posts the study log', fakeAsync(() => {
    const addSpy = jest.spyOn(progSvc, 'addStudyLog');

    // ensure there’s at least one active topic (already from ngOnInit)
    expect(component.activeTopics.length).toBeGreaterThan(0);

    component.openLogHoursDialog(); // will use MockMatDialog result
    tick();

    expect(addSpy).toHaveBeenCalledWith('user-123', 't1', '2025-09-10', 1.5);
  }));

  it('marks a topic completed', fakeAsync(() => {
    const upd = jest.spyOn(progSvc, 'updateTopicStatus');
    const reload = jest.spyOn(component, 'loadTopics');

    component.markAsComplete(seedTopics[0]);
    tick();

    expect(upd).toHaveBeenCalledWith('t1', 'Completed');
    expect(reload).toHaveBeenCalled();
  }));

  it('deletes a topic when confirmed', fakeAsync(() => {
    const del = jest.spyOn(progSvc, 'deleteTopic');
    const reload = jest.spyOn(component, 'loadTopics');

    component.deleteTopic(seedTopics[0]);
    tick();

    expect(del).toHaveBeenCalledWith('t1');
    expect(reload).toHaveBeenCalled();
  }));

  it('does not delete when user cancels confirm', () => {
    (window.confirm as jest.Mock).mockReturnValueOnce(false);

    const del = jest.spyOn(progSvc, 'deleteTopic');
    component.deleteTopic(seedTopics[0]);

    expect(del).not.toHaveBeenCalled();
  });

  it('loads user groups and renders rankings chart on demand (after canvas exists)', fakeAsync(() => {
    // Make service return groups
    jest.spyOn(progSvc, 'getUserGroups').mockReturnValue(of(seedGroups));
    jest.spyOn(progSvc, 'getGroupRankings').mockReturnValue(of(seedRank));

    // Trigger loadUserGroups manually (we avoided it on init by default)
    component.loadUserGroups();
    tick();
    fixture.detectChanges();

    // The canvas is created only when userGroups.length > 0
    const canvas: HTMLCanvasElement | null = fixture.nativeElement.querySelector('canvas');
    expect(canvas).toBeTruthy();

    // Now call onGroupTabChange to build chart
    component.onGroupTabChange(seedGroups[0]);
    tick();
    fixture.detectChanges();

    expect(Chart).toHaveBeenCalledTimes(1); // chart constructed
    expect(component.selectedGroup.id).toBe('g1');
  }));

  it('opens summary dialog with summary$ stream', () => {
    const dialog = TestBed.inject(MatDialog) as unknown as MockMatDialog;
    const openSpy = jest.spyOn(dialog, 'open');

    component.summarizeTopic(seedTopics[0]);

    expect(openSpy).toHaveBeenCalled();
    const call = openSpy.mock.calls[0];
    const cfg = call[1];
    expect(cfg.width).toBe('1000px');
    expect(cfg.data?.summary$).toBeDefined();
  });

  it('navigates via header links', () => {
    const nav = jest.spyOn(router, 'navigate');
    component.goToNotification();
    component.goToProfile();
    component.goToDashboard();

    expect(nav).toHaveBeenCalledWith(['/notifications']);
    expect(nav).toHaveBeenCalledWith(['/profile']);
    expect(nav).toHaveBeenCalledWith(['/dashboard']);
  });
});
