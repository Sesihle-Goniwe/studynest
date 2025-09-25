// setup-jest.ts

// Load the preset (core patches)
//import 'jest-preset-angular';

// ✅ Load Zone.js for Angular testing
import 'zone.js';           // installs Zone.js
import 'zone.js/testing';   // adds zone-testing APIs (fakeAsync, flush, etc.)

// Initialise Angular testing environment
import { TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

TestBed.initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

// Optional polyfills (pure ESM, no require)
import { webcrypto } from 'crypto';
import { TextEncoder, TextDecoder } from 'util';

const g = globalThis as any;
g.crypto = g.crypto ?? webcrypto;
g.TextEncoder = g.TextEncoder ?? TextEncoder;
g.TextDecoder = g.TextDecoder ?? TextDecoder;

// (optional) keep or remove
// console.log('[setup-jest] Angular TestBed + Zone.js initialised');
