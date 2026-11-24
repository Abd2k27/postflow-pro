-- Assisted mode removed from the app: every connection is now OAuth ("auto")
delete from public.social_accounts where connection_mode = 'assisted';
alter table public.social_accounts alter column connection_mode set default 'auto';
