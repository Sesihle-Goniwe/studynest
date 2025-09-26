import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogHoursDialogComponent } from './log-hours-dialog';

describe('LogHoursDialog', () => {
  let component: LogHoursDialogComponent;
  let fixture: ComponentFixture<LogHoursDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogHoursDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogHoursDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
