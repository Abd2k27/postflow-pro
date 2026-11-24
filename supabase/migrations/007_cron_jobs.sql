-- Tâches planifiées : publication des posts programmés et rafraîchissement des tokens.
-- Prérequis (hors git) : deux secrets dans le Vault
--   select vault.create_secret('https://<ref>.supabase.co', 'project_url');
--   select vault.create_secret('<CRON_SECRET>', 'cron_secret');   -- même valeur que le secret des fonctions
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create or replace function public.invoke_edge_function(fn text)
returns bigint
language sql
security definer
set search_path = ''
as $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/' || fn,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$$;

revoke all on function public.invoke_edge_function(text) from public, anon, authenticated;

select cron.schedule('process-scheduled-posts', '* * * * *', $$ select public.invoke_edge_function('process-scheduled') $$);
select cron.schedule('refresh-social-tokens', '0 */6 * * *', $$ select public.invoke_edge_function('refresh-tokens') $$);
