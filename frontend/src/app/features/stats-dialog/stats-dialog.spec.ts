import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { StatsDialogComponent } from './stats-dialog';
import { Component } from '@angular/core';

// Mock Chart.js completely. We need to control its instances to test the 'destroy' method.
const mockChartInstance = {
  destroy: jest.fn(),
};
const ChartMock = jest.fn().mockImplementation(() => mockChartInstance);

jest.mock('chart.js/auto', () => ({
  Chart: ChartMock,
}));

// A test host component is the modern, correct way to test standalone components
// that rely on content projection or @ViewChild queries.
@Component({
  standalone: true,
  imports: [StatsDialogComponent],
  // The template MUST include the <canvas> elements so that @ViewChild can find them.
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

  // --- Helper function to create the component with specific data ---
  const configureTestingModule = async (dialogData: any) => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    // Grab the instance of our actual component from within the test host
    component = fixture.debugElement.query(By.directive(StatsDialogComponent)).componentInstance;
    
    // Clear any previous mock calls before each test scenario
    ChartMock.mockClear();
    mockChartInstance.destroy.mockClear();
  };

  describe('with all data provided', () => {
    beforeEach(async () => {
      await configureTestingModule({
        studyLogs: [
          { date: '2025-01-02T10:00:00Z', hours: 3 }, // Out of order to test sorting
          { date: '2025-01-01T12:00:00Z', hours: 5 },
          { date: '2025-01-01T18:00:00Z', hours: 2 }, // Same day to test aggregation
        ],
        activeTopics: [{ id: 'a1' }, { id: 'a2' }],
        completedTopics: [{ id: 'c1' }],
      });
      fixture.detectChanges(); // This triggers ngAfterViewInit
    });

    it('should create and render both charts', () => {
      expect(component).toBeTruthy();
      // Verifies that both createHoursChart and createTopicsChart were called
      expect(ChartMock).toHaveBeenCalledTimes(2);
    });

    it('should correctly process and sort study logs for the hours chart', () => {
      // Get the configuration object passed to the Chart constructor for the first chart
      const hoursChartConfig = ChartMock.mock.calls[0][1];
      
      // Test aggregation (5 + 2 = 7) and sorting
      const expectedLabels = ['1/1/2025', '1/2/2025'];
      const expectedData = [7, 3];

      expect(hoursChartConfig.type).toBe('bar');
      expect(hoursChartConfig.data.labels).toEqual(expectedLabels);
      expect(hoursChartConfig.data.datasets[0].data).toEqual(expectedData);
    });

    it('should correctly count topics for the topics chart', () => {
      // Get the configuration object for the second chart
      const topicsChartConfig = ChartMock.mock.calls[1][1];
      const expectedData = [2, 1]; // 2 active, 1 completed

      expect(topicsChartConfig.type).toBe('doughnut');
      expect(topicsChartConfig.data.labels).toEqual(['Active Topics', 'Completed Topics']);
      expect(topicsChartConfig.data.datasets[0].data).toEqual(expectedData);
    });

    it('should destroy existing charts before creating new ones', () => {
        // The first detectChanges() already created the charts.
        // Let's call the creation methods again to simulate a refresh.
        component.createHoursChart();
        component.createTopicsChart();
  
        // Verify that the destroy method on our mock instance was called for both charts
        expect(mockChartInstance.destroy).toHaveBeenCalledTimes(2);
      });
  });

  describe('with partial or no data', () => {
    it('should only create the hours chart if only studyLogs are provided', async () => {
      await configureTestingModule({
        studyLogs: [{ date: '2025-01-01T12:00:00Z', hours: 5 }],
        activeTopics: null, // Explicitly null
        completedTopics: null
      });
      fixture.detectChanges();
      
      expect(ChartMock).toHaveBeenCalledTimes(1);
      // Verify it was the hours chart by checking the label
      expect(ChartMock.mock.calls[0][1].data.datasets[0].label).toBe('Hours Studied');
    });

    it('should only create the topics chart if only topic data is provided', async () => {
        await configureTestingModule({
          studyLogs: [], // Empty array
          activeTopics: [{ id: 'a1' }],
          completedTopics: [{ id: 'c1' }]
        });
        fixture.detectChanges();
        
        expect(ChartMock).toHaveBeenCalledTimes(1);
        // Verify it was the topics chart by checking the label
        expect(ChartMock.mock.calls[0][1].data.datasets[0].label).toBe('Topic Status');
      });

    it('should not create any charts if no data is provided', async () => {
      await configureTestingModule({}); // Empty data object
      fixture.detectChanges();
      
      expect(ChartMock).not.toHaveBeenCalled();
    });
  });
});
