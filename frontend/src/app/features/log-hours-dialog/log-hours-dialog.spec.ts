import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogHoursDialog } from './log-hours-dialog';

describe('LogHoursDialog', () => {
  let component: LogHoursDialog;
  let fixture: ComponentFixture<LogHoursDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogHoursDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogHoursDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
