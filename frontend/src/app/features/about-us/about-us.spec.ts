import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';

// Make sure the component class name is correct
import { AboutUsComponent } from './about-us';

describe('AboutUsComponent', () => {
  let component: AboutUsComponent;
  let fixture: ComponentFixture<AboutUsComponent>;
  let router: Router;

  beforeEach(async () => {
    // Set up the same fake router as before
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [AboutUsComponent],
      providers: [{ provide: Router, useValue: routerSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutUsComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the main hero title', () => {
    // Find the H1 element in the rendered HTML
    const titleElement = fixture.debugElement.query(By.css('h1.hero-title'));
    
    // Check that the text content includes the expected phrase
    expect(titleElement.nativeElement.textContent).toContain('collaborative learning');
  });
  
  it('should navigate to the home page when goToHome() is called', () => {
    // Call the method directly
    component.goToHome();
    
    // Check if the router was called with the root path
    expect(router.navigate).toHaveBeenCalledWith(['']);
  });

  it('should navigate to the login page when the "Sign In" button is clicked', () => {
    // Find the login button and simulate a click
    const loginButton = fixture.debugElement.query(By.css('.login-button'));
    loginButton.triggerEventHandler('click', null);

    // Check if the router was called with the correct path
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should navigate to the home page when the logo is clicked', () => {
    const logo = fixture.debugElement.query(By.css('.logo h1'));
    logo.triggerEventHandler('click', null);
    
    expect(router.navigate).toHaveBeenCalledWith(['']);
  });
});