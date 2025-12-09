-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule daily reminder job at 00:10 UTC
SELECT cron.schedule(
  'daily-reminders',
  '10 0 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://vktfcgtnpbnacjnepfhf.supabase.co/functions/v1/daily-reminders',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdGZjZ3RucGJuYWNqbmVwZmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMzQ1ODAsImV4cCI6MjA4MDYxMDU4MH0.1KLNcBSdwIOGtBE5E6zsFqGCZ1yHYXWwQU2mlWO2PpE'
      ),
      body:='{}'::jsonb
    ) as request_id;
  $$
);