// src/app/features/stats-dialog/stats-dialog.spec.ts

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Chart } from 'chart.js';
import { StatsDialogComponent } from './stats-dialog';

// Mocks
jest.mock('chart.js/auto', () => ({
  Chart: jest.fn().mockImplementation(() => ({ destroy: jest.fn() })),
}));

const mockDialogData = {
  studyLogs: [{ date: '2025-01-01T12:00:00Z', hours: 5 }],
  activeTopics: [{ id: 'a1' }],
  completedTopics: [{ id: 'c1' }],
};

// ✅ --- THE CORRECTED TEST HOST FOR STANDALONE --- ✅
@Component({
  standalone: true,
  // The host imports the component it needs to render
  imports: [StatsDialogComponent],
  // The template includes the <canvas> elements required by @ViewChild
  template: `
    <app-stats-dialog>
      <div class="stats-container">
        <div class="chart-container"><canvas #hoursChart></canvas></div>
        <div class="chart-container"><canvas #topicsChart></canvas></div>
      </div>
    </app-stats-dialog>
  `,
})
class TestHostComponent {}


describe('StatsDialogComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: StatsDialogComponent;
  let mockedChart: jest.MockedClass<typeof Chart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // You only need to import the TestHostComponent now
      imports: [TestHostComponent],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: mockDialogData }],
    }).compileComponents();

    // Create the HOST component
    fixture = TestBed.createComponent(TestHostComponent);
    // Find the StatsDialogComponent instance inside the host
    component = fixture.debugElement.query(By.directive(StatsDialogComponent)).componentInstance;

    mockedChart = Chart as jest.MockedClass<typeof Chart>;
    mockedChart.mockClear();
    
    fixture.detectChanges(); // Trigger ngAfterViewInit
  });

  it('should create and render both charts with valid data', () => {
    expect(component).toBeTruthy();
    expect(mockedChart).toHaveBeenCalledTimes(2);
  });
});