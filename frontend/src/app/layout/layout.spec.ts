// src/app/layout/layout.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { LayoutComponent } from './layout';

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Import the component being tested and the testing module for the router
      imports: [LayoutComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    // Inject the router instance from the testing module
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the sidebar closed on initial load', () => {
    expect(component.sidebarOpen).toBe(false);
  });

  // A parameterized test to check all navigation methods
  // [methodName, expectedRoute]
  const navigationTests = [
    { method: 'goToDashboard', route: '/dashboard' },
    { method: 'goToProfile', route: '/profile' },
    { method: 'goToNotification', route: '/notifications' },
    { method: 'goToMatches', route: '/matches' },
    { method: 'goToProgress', route: '/progress' },
    { method: 'goToStudyGroups', route: '/studygroup' },
  ];

  navigationTests.forEach(testCase => {
    it(`should navigate to ${testCase.route} and close the sidebar when ${testCase.method}() is called`, () => {
      // Arrange: Spy on the router's navigate method
      const navigateSpy = jest.spyOn(router, 'navigate');
      // Set the sidebar to be open to test that it closes
      component.sidebarOpen = true;

      // Act: Call the navigation method by its name
      (component as any)[testCase.method]();

      // Assert: Check that navigation was called with the correct route
      expect(navigateSpy).toHaveBeenCalledWith([testCase.route]);
      // Assert: Check that the sidebar is now closed
      expect(component.sidebarOpen).toBe(false);
    });
  });
});