import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
    'https://kvxujqgaaongkoczjyhc.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2eHVqcWdhYW9uZ2tvY3pqeWhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxOTU1ODQsImV4cCI6MjA4MDc3MTU4NH0.o5CLEM00nC_cZNEjYgZPvGnnxqS1Wu9PFrpw64fIdrs',
    {
        auth: {
            detectSessionInUrl: true,
            flowType: 'pkce',
            autoRefreshToken: true,
            persistSession: true,
        }
    }
);
