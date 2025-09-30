// ---- Mocks must come before importing the component under test ----

// Mock Chart.js. The implementation is not important, just its existence and destroy method.
jest.mock('chart.js/auto', () => ({
  Chart: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
    update: jest.fn()
  })),
}));

// Stub out dialog components. We only care that the dialog service's `open` method is called.
jest.mock('../stats-dialog/stats-dialog', () => ({ StatsDialogComponent: class {} }));
jest.mock('../summary-dialog/summary-dialog', () => ({ SummaryDialogComponent: class {} }));
jest.mock('../log-hours-dialog/log-hours-dialog', () => ({ LogHoursDialogComponent: class {} }));

// In a JSDOM environment (like Jest), the canvas getContext method doesn't exist, so we mock it.
(HTMLCanvasElement.prototype as any).getContext = jest.fn(() => ({}));


import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { ProgressTracker } from './progress';
import { NotesApiService } from '../../services/notes-api.service';
import { AuthService } from '../auth/auth.service';
import { ProgressApiService } from '../../services/progress-api.service';
import { MatDialog } from '@angular/material/dialog';
import { Chart } from 'chart.js/auto';

// ---- Test Data and Mocks ---------------------------------------------------

// FIX: Added missing properties to match the 'User' type from Supabase
const mockUser = {
  id: 'user-123',
  email: 'me@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

const seedTopics = [
  { id: 't1', name: 'A.pdf', status: 'Active', file_id: 'f1' },
  { id: 't2', name: 'B.pdf', status: 'Completed', file_id: 'f2' },
];
const seedLogs = [{ hours: 2 }, { hours: 3 }];
const seedGroups = [{ id: 'g1', name: 'Alpha' }];
const seedRank = [{ user_id: 'user-123', email: 'me@example.com', total_hours: 10 }];

describe('ProgressTracker', () => {
  let fixture: ComponentFixture<ProgressTracker>;
  let component: ProgressTracker;
  let notesApiService: NotesApiService;
  let progressApiService: ProgressApiService;
  let authService: AuthService;
  let dialog: MatDialog;
  let router: Router;

  beforeEach(async () => {
    // Configure the test module with mock providers for all dependencies
    await TestBed.configureTestingModule({
      imports: [ProgressTracker, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: NotesApiService, useValue: { uploadNote: jest.fn(), getPersonalNoteUrl: jest.fn(), getSummary: jest.fn() } },
        { provide: ProgressApiService, useValue: { getTopics: jest.fn(), createTopic: jest.fn(), getStudyLogs: jest.fn(), addStudyLog: jest.fn(), updateTopicStatus: jest.fn(), deleteTopic: jest.fn(), getUserGroups: jest.fn(), getGroupRankings: jest.fn() } },
        { provide: AuthService, useValue: { getCurrentUser: jest.fn() } },
        { provide: MatDialog, useValue: { open: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressTracker);
    component = fixture.componentInstance;

    // Inject the mock services to control their behavior in tests
    notesApiService = TestBed.inject(NotesApiService);
    progressApiService = TestBed.inject(ProgressApiService);
    authService = TestBed.inject(AuthService);
    dialog = TestBed.inject(MatDialog);
    router = TestBed.inject(Router);

    // Mock window methods to prevent them from executing in tests
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    jest.spyOn(window, 'alert').mockImplementation(() => {});

    // Default "happy path" setup for services
    jest.spyOn(authService, 'getCurrentUser').mockReturnValue(mockUser as any); // Use 'as any' to satisfy TS with our simplified mock
    jest.spyOn(progressApiService, 'getTopics').mockReturnValue(of(seedTopics));
    jest.spyOn(progressApiService, 'getStudyLogs').mockReturnValue(of(seedLogs));
    jest.spyOn(progressApiService, 'getUserGroups').mockReturnValue(of(seedGroups));
    jest.spyOn(progressApiService, 'getGroupRankings').mockReturnValue(of(seedRank));
  });

  // --- Main Test Suite ---

  it('should initialize and load topics and logs for a valid user', () => {
    fixture.detectChanges(); // Triggers ngOnInit
    expect(authService.getCurrentUser).toHaveBeenCalled();
    expect(progressApiService.getTopics).toHaveBeenCalledWith(mockUser.id);
    expect(progressApiService.getStudyLogs).toHaveBeenCalledWith(mockUser.id);
    expect(component.activeTopics.length).toBe(1);
    expect(component.completedTopics.length).toBe(1);
    expect(component.totalHoursStudied).toBe(5);
  });

  it('should not load data if no user is found on init', () => {
    jest.spyOn(authService, 'getCurrentUser').mockReturnValue(null);
    fixture.detectChanges();
    expect(progressApiService.getTopics).not.toHaveBeenCalled();
  });

  it('should handle errors when loading topics', () => {
    jest.spyOn(progressApiService, 'getTopics').mockReturnValue(throwError(() => new Error('API Error')));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    fixture.detectChanges();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load topics:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  describe('File Handling', () => {
    const testFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    it('should handle file selection from an input event', () => {
      const event = { target: { files: [testFile] } } as unknown as Event;
      component.onFileSelected(event);
      expect(component.selectedFile).toBe(testFile);
    });

    it('should handle file selection from a drop event', () => {
      const event = { dataTransfer: { files: [testFile] }, preventDefault: jest.fn() } as unknown as DragEvent;
      component.onDrop(event);
      expect(component.selectedFile).toBe(testFile);
    });

    it('should cancel file selection', () => {
      component.selectedFile = testFile;
      component.cancelUpload();
      expect(component.selectedFile).toBeNull();
    });

    it('should not upload if no file is selected', () => {
      component.selectedFile = null;
      const uploadSpy = jest.spyOn(notesApiService, 'uploadNote');
      component.onUpload();
      expect(uploadSpy).not.toHaveBeenCalled();
    });

    it('should handle upload failure', fakeAsync(() => {
      jest.spyOn(notesApiService, 'uploadNote').mockReturnValue(throwError(() => new Error('Upload Failed')));
      component.selectedFile = testFile;
      component.onUpload();
      tick();
      expect(component.uploadStatus).toContain('Upload failed');
    }));

    it('should handle topic creation failure after successful upload', fakeAsync(() => {
      jest.spyOn(notesApiService, 'uploadNote').mockReturnValue(of({ data: { file_name: 'test.pdf', id: 'f1' } }));
      jest.spyOn(progressApiService, 'createTopic').mockReturnValue(throwError(() => new Error('Create Topic Failed')));
      component.selectedFile = testFile;
      component.onUpload();
      tick();
      expect(component.uploadStatus).toContain('failed to create topic');
    }));
  });

  describe('PDF Viewer', () => {
    it('should not try to get URL if topic has no file_id', () => {
        const getUrlSpy = jest.spyOn(notesApiService, 'getPersonalNoteUrl');
        component.viewTopicPdf({ name: 'No File Topic' });
        expect(getUrlSpy).not.toHaveBeenCalled();
    });

    it('should handle errors when getting PDF URL', () => {
        jest.spyOn(notesApiService, 'getPersonalNoteUrl').mockReturnValue(throwError(() => new Error('URL Error')));
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        component.viewTopicPdf(seedTopics[0]);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to get PDF URL', expect.any(Error));
        consoleErrorSpy.mockRestore();
    });
  });

  describe('Dialogs', () => {
    it('should open the stats dialog', () => {
      const openSpy = jest.spyOn(dialog, 'open');
      component.openStatsDialog();
      expect(openSpy).toHaveBeenCalled();
    });

    it('should alert if trying to log hours with no active topics', () => {
      component.activeTopics = [];
      const alertSpy = jest.spyOn(window, 'alert');
      component.openLogHoursDialog();
      expect(alertSpy).toHaveBeenCalled();
    });

    it('should not add study log if dialog is cancelled', () => {
      const dialogRefSpy = { afterClosed: () => of(undefined) };
      jest.spyOn(dialog, 'open').mockReturnValue(dialogRefSpy as any);
      const addLogSpy = jest.spyOn(progressApiService, 'addStudyLog');
      component.openLogHoursDialog();
      expect(addLogSpy).not.toHaveBeenCalled();
    });

    it('should handle errors when adding a study log', () => {
      const dialogResult = { topicId: 't1', date: new Date(), hours: 1 };
      const dialogRefSpy = { afterClosed: () => of(dialogResult) };
      jest.spyOn(dialog, 'open').mockReturnValue(dialogRefSpy as any);
      jest.spyOn(progressApiService, 'addStudyLog').mockReturnValue(throwError(() => new Error('Log Error')));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      component.openLogHoursDialog();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to log study hours:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    it('should not try to summarize if topic has no file_id', () => {
      const alertSpy = jest.spyOn(window, 'alert');
      component.summarizeTopic({ name: 'No File Topic' });
      expect(alertSpy).toHaveBeenCalled();
    });
  });

  describe('Topic and Group Management', () => {
    it('should handle errors when marking topic as complete', () => {
      jest.spyOn(progressApiService, 'updateTopicStatus').mockReturnValue(throwError(() => new Error('Update Error')));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      component.markAsComplete(seedTopics[0]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update topic status:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    it('should handle errors when deleting a topic', () => {
      jest.spyOn(progressApiService, 'deleteTopic').mockReturnValue(throwError(() => new Error('Delete Error')));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      component.deleteTopic(seedTopics[0]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to delete topic:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    it('should not create rankings chart if user has no groups', () => {
      jest.spyOn(progressApiService, 'getUserGroups').mockReturnValue(of([]));
      const chartSpy = jest.spyOn(component, 'createRankingsChart');
      component.loadUserGroups();
      expect(chartSpy).not.toHaveBeenCalled();
    });

    it('should destroy an existing chart before creating a new one', () => {
      fixture.detectChanges(); // Create initial view
      component.onGroupTabChange(seedGroups[0]);
      expect(Chart).toHaveBeenCalledTimes(1);

      const destroySpy = component.rankingsChart.destroy;
      component.onGroupTabChange(seedGroups[0]); // Call again
      expect(destroySpy).toHaveBeenCalledTimes(1);
      expect(Chart).toHaveBeenCalledTimes(2);
    });

    it('should handle errors when fetching group rankings', () => {
      jest.spyOn(progressApiService, 'getGroupRankings').mockReturnValue(throwError(() => new Error('Ranking Error')));
      const chartSpy = jest.spyOn(component, 'createRankingsChart');
      component.onGroupTabChange(seedGroups[0]);
      expect(chartSpy).not.toHaveBeenCalled(); // createRankingsChart is in `next` block, so it shouldn't run
    });
  });

  describe('Navigation', () => {
    it('should navigate correctly', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      component.goToDashboard();
      expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
      component.goToProfile();
      expect(navigateSpy).toHaveBeenCalledWith(['/profile']);
      component.goToNotification();
      expect(navigateSpy).toHaveBeenCalledWith(['/notifications']);
    });
  });
});

