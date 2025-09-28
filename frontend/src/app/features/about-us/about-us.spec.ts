// src/app/features/about-us/about-us.component.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AboutUsComponent } from './about-us';

describe('AboutUsComponent', () => {
  let component: AboutUsComponent;
  let fixture: ComponentFixture<AboutUsComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Import the component and the RouterTestingModule
      imports: [AboutUsComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutUsComponent);
    component = fixture.componentInstance;
    // Inject the router from the testing module
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to the login page when goToLogin() is called', () => {
    // Create a "spy" to watch the router's navigate method
    const navigateSpy = jest.spyOn(router, 'navigate');

    // Call the method directly on the component instance
    component.goToLogin();

    // Assert that the spy was called with the correct route
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should navigate to the home page when goToHome() is called', () => {
    // Create a spy for this test as well
    const navigateSpy = jest.spyOn(router, 'navigate');

    // Call the method
    component.goToHome();

    // Assert it was called with the root path
    expect(navigateSpy).toHaveBeenCalledWith(['']);
  });
});