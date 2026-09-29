-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Schedule daily reminder job at 3:30 AM UTC (9:00 AM IST)
SELECT cron.schedule(
  'daily-reminders',
  '30 3 * * *',
  $$
    SELECT net.http_post(
      url:='https://' || current_setting('request.jwt.claim.iss', true) || '/functions/v1/send-reminders',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body:='{}'::jsonb
    )
  $$
);
