import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupSession } from './group-session';

describe('GroupSession', () => {
  let component: GroupSession;
  let fixture: ComponentFixture<GroupSession>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupSession]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupSession);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
