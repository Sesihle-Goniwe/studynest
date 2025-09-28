// src/app/features/log-hours-dialog/log-hours-dialog.spec.ts

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LogHoursDialogComponent } from './log-hours-dialog';

// --- Mocks ---
const mockDialogRef = {
  close: jest.fn(),
};

const mockDialogData = {
  topics: [
    { id: 't1', name: 'Topic A.pdf' },
    { id: 't2', name: 'Topic B.pdf' },
  ],
  selectedTopicId: 't2', // Simulate opening the dialog with a pre-selected topic
};

describe('LogHoursDialogComponent', () => {
  let component: LogHoursDialogComponent;
  let fixture: ComponentFixture<LogHoursDialogComponent>;
  let dialogRef: MatDialogRef<LogHoursDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LogHoursDialogComponent,
        NoopAnimationsModule, // Important for testing Material components
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LogHoursDialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef);
    fixture.detectChanges();
  });

  // --- Tests ---

  it('should create and initialize with pre-selected topic ID', () => {
    expect(component).toBeTruthy();
    // Verify that the constructor correctly sets the topicId from the injected data
    expect(component.logData.topicId).toBe('t2');
  });

  it('should update logData properties based on user input', () => {
    // Simulate changing the selected topic in the template
    component.logData.topicId = 't1';
    // Simulate typing a number of hours in the input
    component.logData.hours = 5;

    fixture.detectChanges();

    expect(component.logData.topicId).toBe('t1');
    expect(component.logData.hours).toBe(5);
  });

  it('should show success message, wait, and close with data on submitLog', fakeAsync(() => {
    const closeSpy = jest.spyOn(dialogRef, 'close');
    component.logData.hours = 3; // Set some data to be returned

    // Call the submit method
    component.submitLog();

    // The success message should now be visible
    expect(component.showSuccessMessage).toBe(true);

    // Fast-forward time by 2 seconds (2000 ms)
    tick(2000);

    // The dialog should have been closed with the component's logData
    expect(closeSpy).toHaveBeenCalledWith(component.logData);
  }));

  it('should close the dialog with no data on cancel', () => {
    const closeSpy = jest.spyOn(dialogRef, 'close');

    // Call the cancel method
    component.cancel();

    // Verify that close() was called without any arguments
    expect(closeSpy).toHaveBeenCalledWith();
  });
});