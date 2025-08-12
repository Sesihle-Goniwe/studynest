// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { App } from './app/app';
import { routes } from './app/app.routes';
import { appConfig } from './app/app.config';
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
