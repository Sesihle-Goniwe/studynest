import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryDialogComponent } from './summary-dialog';

describe('SummaryDialog', () => {
  let component: SummaryDialogComponent;
  let fixture: ComponentFixture<SummaryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SummaryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
