import { createClient } from '@supabase/supabase-js';

// 填入你剛剛複製的 URL
const supabaseUrl = 'https://yhnptboegbalsxphqmga.supabase.co';

// 填入你剛剛複製的 anon key (通常是很長的一串 eyJhbGciOi...)
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlobnB0Ym9lZ2JhbHN4cGhxbWdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzE1MTksImV4cCI6MjA4MTU0NzUxOX0.gupRpdBtuJe4ANHz-FHEK3O9O5AK4QgQZDENBHmKGCc';

export const supabase = createClient(supabaseUrl, supabaseKey);
