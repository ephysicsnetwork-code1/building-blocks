CREATE TABLE public.app_settings (key text PRIMARY KEY, value text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.student_joins (full_name text PRIMARY KEY, grade text NOT NULL, section text NOT NULL, stream text, telegram_handle text NOT NULL, joined_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.teacher_access (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), full_name text NOT NULL, telegram_handle text NOT NULL, accessed_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.parent_requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), parent_name text NOT NULL, telegram_handle text NOT NULL, student_name text NOT NULL, status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now(), decided_at timestamptz);
GRANT ALL ON public.app_settings, public.student_joins, public.teacher_access, public.parent_requests TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_joins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_requests ENABLE ROW LEVEL SECURITY;
INSERT INTO public.app_settings (key, value) VALUES
 ('telegram_link','https://t.me/+za9uD7CLuG5mOWM0'),
 ('support_handle','@Spaceanduniverse13');