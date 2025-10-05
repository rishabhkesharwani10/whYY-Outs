import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ihaazfgscokevsxjwzhz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloYWF6ZmdzY29rZXZzeGp3emh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjA4MzMsImV4cCI6MjA3MTE5NjgzM30.E8rLj9_Nivirtj67gehfNeMl06dq2LTS-3e57n1lPvs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
