import { Component, Inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Chart } from 'chart.js/auto';


@Component({
  selector: 'app-stats-dialog',
  standalone: true,
  imports: [
    CommonModule,  // Keep this, we will use it in the HTML
    MatDialogModule,
    MatButtonModule,// Keep this, we will use it in the HTML
  ],
  templateUrl: './stats-dialog.html',
  styleUrls: ['./stats-dialog.scss']
})
export class StatsDialogComponent implements AfterViewInit {
  // --- Fix 1: Rename 'chart' and add ViewChild/property for the new chart ---
  @ViewChild('hoursChart') hoursChart!: ElementRef<HTMLCanvasElement>;
  public hoursChartInstance: any; // Renamed from 'chart'

  @ViewChild('topicsChart') topicsChart!: ElementRef<HTMLCanvasElement>;
  public topicsChartInstance: any; // Added the missing property

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngAfterViewInit(): void {
    if (this.data.studyLogs && this.data.studyLogs.length > 0) {
      this.createHoursChart();
    }
    if (this.data.activeTopics && this.data.completedTopics) {
      this.createTopicsChart();
    }
  }

  createHoursChart(): void {
    if (this.hoursChartInstance) {
      this.hoursChartInstance.destroy();
    }
    const dailyHours = new Map<string, number>();
    this.data.studyLogs.forEach((log: { date: string; hours: number }) => {
      const date = new Date(log.date).toLocaleDateString();
      const currentHours = dailyHours.get(date) || 0;
      dailyHours.set(date, currentHours + log.hours);
    });

    const sortedDailyHours = new Map([...dailyHours.entries()].sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()));
    const labels = Array.from(sortedDailyHours.keys());
    const chartData = Array.from(sortedDailyHours.values());

    // --- Fix 2: Assign to the renamed property ---
    this.hoursChartInstance = new Chart(this.hoursChart.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Hours Studied',
          data: chartData,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Hours' } } }
      }
    });
  }

  createTopicsChart(): void {
    if (this.topicsChartInstance) {
      this.topicsChartInstance.destroy();
    }
    
    const activeCount = this.data.activeTopics.length;
    const completedCount = this.data.completedTopics.length;

    this.topicsChartInstance = new Chart(this.topicsChart.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Active Topics', 'Completed Topics'],
        datasets: [{
          label: 'Topic Status',
          data: [activeCount, completedCount],
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(75, 192, 192, 0.7)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      }
    });
  }
}