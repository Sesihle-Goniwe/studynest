import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryDialog } from './summary-dialog';

describe('SummaryDialog', () => {
  let component: SummaryDialog;
  let fixture: ComponentFixture<SummaryDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SummaryDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
