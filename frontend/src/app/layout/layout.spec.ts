import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';

// Make sure the component class name is correct
import { LayoutComponent } from './layout';

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;
  let router: Router;

  // Before each test, set up the testing environment
  beforeEach(async () => {
    // Create a "spy" object for the Router. This is a fake router that
    // lets us track if its methods (like 'navigate') are called.
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LayoutComponent],
      // Provide the fake router instead of the real one for our tests
      providers: [{ provide: Router, useValue: routerSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    // Get the instance of our fake router
    router = TestBed.inject(Router);
    // This triggers the initial data binding
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the sidebar closed on initial load', () => {
    // Check the component's property
    expect(component.sidebarOpen).toBe(false);
    
    // Check the HTML element to make sure the 'open' class is not present
    const sidebarElement = fixture.debugElement.query(By.css('.sidebar'));
    expect(sidebarElement.classes['open']).toBeFalsy();
  });

  it('should open the sidebar when the toggle button is clicked', () => {
    // Find the toggle button element
    const toggleButton = fixture.debugElement.query(By.css('.sidebar-toggle'));
    
    // Simulate a click on the button
    toggleButton.triggerEventHandler('click', null);
    
    // Tell the test to update the HTML with any changes
    fixture.detectChanges();

    // Now, check if the property and the class have been updated
    expect(component.sidebarOpen).toBe(true);
    const sidebarElement = fixture.debugElement.query(By.css('.sidebar'));
    expect(sidebarElement.classes['open']).toBeTruthy();
  });

  it('should close the sidebar when the close button is clicked', () => {
    // First, open the sidebar to set up the test state
    component.sidebarOpen = true;
    fixture.detectChanges();

    // Find the close button and simulate a click
    const closeButton = fixture.debugElement.query(By.css('.sidebar-close'));
    closeButton.triggerEventHandler('click', null);
    fixture.detectChanges();

    // Check if the property and class were updated correctly
    expect(component.sidebarOpen).toBe(false);
    const sidebarElement = fixture.debugElement.query(By.css('.sidebar'));
    expect(sidebarElement.classes['open']).toBeFalsy();
  });

  it('should navigate to /profile when goToProfile() is called', () => {
    // Call the method on the component
    component.goToProfile();
    
    // Check that our fake router's 'navigate' method was called with the right path
    expect(router.navigate).toHaveBeenCalledWith(['/profile']);
  });
  
  it('should close the sidebar when a navigation method is called', () => {
    // Arrange: Open the sidebar first
    component.sidebarOpen = true;

    // Act: Call a navigation method
    component.goToDashboard();
    
    // Assert: Check that the sidebar is now closed
    expect(component.sidebarOpen).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});