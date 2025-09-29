import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from './supabase.service';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
};

// mock createClient to return mockSupabaseClient
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn(() => mockSupabaseClient),
  };
});

describe('SupabaseService', () => {
  let service: SupabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SUPABASE_URL') return 'http://localhost:54321';
              if (key === 'SUPABASE_KEY') return 'fake-key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SupabaseService>(SupabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize supabase client with env values', () => {
    expect(createClient).toHaveBeenCalledWith(
      'http://localhost:54321',
      'fake-key',
    );
  });

  it('should return supabase client via getClient()', () => {
    const client = service.getClient();
    expect(client).toBe(mockSupabaseClient);
  });
});
