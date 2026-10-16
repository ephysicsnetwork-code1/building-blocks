CREATE TABLE public.roster_entries (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL CHECK (kind IN ('student','teacher')), name text NOT NULL, grade text, section text, stream text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.roster_removals (kind text NOT NULL, name_norm text NOT NULL, removed_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (kind, name_norm));
CREATE TABLE public.telegram_users (chat_id bigint PRIMARY KEY, username text, first_name text, first_seen timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.roster_entries, public.roster_removals, public.telegram_users TO service_role;
ALTER TABLE public.roster_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_removals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;