// src/app/features/summary-dialog/summary-dialog.spec.ts

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { of, ReplaySubject } from 'rxjs';
import { SummaryDialogComponent } from './summary-dialog';

describe('SummaryDialogComponent', () => {
  let component: SummaryDialogComponent;
  let fixture: ComponentFixture<SummaryDialogComponent>;

  // Use a ReplaySubject to control when the mock observable emits data
  const summary$ = new ReplaySubject<{ summary: string }>(1);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryDialogComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { summary$: summary$.asObservable() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Initial data binding
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the loading spinner initially', () => {
    const spinner = fixture.debugElement.query(By.css('mat-spinner'));
    // The spinner should exist before the observable emits
    expect(spinner).toBeTruthy();
  });

  it('should display the summary text after the observable emits', () => {
    const summaryText = 'This is the AI summary.';
    
    // Simulate the observable emitting the data
    summary$.next({ summary: summaryText });
    fixture.detectChanges();

    const spinner = fixture.debugElement.query(By.css('mat-spinner'));
    const markdownElement = fixture.debugElement.query(By.css('markdown'));

    // The spinner should now be gone
    expect(spinner).toBeFalsy();
    // The markdown element should exist and contain the summary text
    expect(markdownElement).toBeTruthy();
    expect(markdownElement.nativeElement.textContent).toContain(summaryText);
  });
});