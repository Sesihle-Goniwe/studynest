// src/environments/environment.ts
export const environment = {
  production: false,
  supabaseUrl: 'https://peuusdwgybtmnhizadqh.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldXVzZHdneWJ0bW5oaXphZHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODk3MDUsImV4cCI6MjA3MDA2NTcwNX0.RE29oKopammJQPhZkjqOSPzrWR5mf9RnSaiLtFtL2nc',
  supabaseOptions: {
    auth: {
      flowType: 'pkce',
      debug: true,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  },
  apiBaseUrl:'https://studynester.onrender.com'
};
