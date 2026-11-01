ALTER TABLE public.student_joins ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.teacher_access ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.parent_requests ADD COLUMN IF NOT EXISTS gender text;
CREATE TABLE public.bot_notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), content_key text NOT NULL UNIQUE, message text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), last_sent_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bot_notifications TO service_role;
ALTER TABLE public.bot_notifications ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.bot_deliveries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), notification_id uuid NOT NULL REFERENCES public.bot_notifications(id), chat_id bigint, telegram_handle text, display_name text, status text NOT NULL DEFAULT 'sending', error_code integer, error_message text, telegram_message_id bigint, attempted_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz,
 CONSTRAINT bot_delivery_status CHECK (status IN ('sending','delivered','blocked','failed','not_started'))
);
GRANT ALL ON public.bot_deliveries TO service_role;
ALTER TABLE public.bot_deliveries ENABLE ROW LEVEL SECURITY;
CREATE INDEX bot_deliveries_notification_idx ON public.bot_deliveries(notification_id, attempted_at DESC);
CREATE TABLE public.portal_registrations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL, source_key text NOT NULL, full_name text NOT NULL, telegram_handle text, gender text, registered_at timestamptz NOT NULL, UNIQUE(kind, source_key)
);
GRANT ALL ON public.portal_registrations TO service_role;
ALTER TABLE public.portal_registrations ENABLE ROW LEVEL SECURITY;
CREATE INDEX portal_registrations_date_idx ON public.portal_registrations(registered_at DESC);
INSERT INTO public.portal_registrations(kind,source_key,full_name,telegram_handle,gender,registered_at) SELECT 'student',full_name,full_name,telegram_handle,gender,joined_at FROM public.student_joins ON CONFLICT DO NOTHING;
INSERT INTO public.portal_registrations(kind,source_key,full_name,telegram_handle,gender,registered_at) SELECT 'teacher',id::text,full_name,telegram_handle,gender,accessed_at FROM public.teacher_access ON CONFLICT DO NOTHING;
INSERT INTO public.portal_registrations(kind,source_key,full_name,telegram_handle,gender,registered_at) SELECT 'parent',id::text,parent_name,telegram_handle,gender,created_at FROM public.parent_requests ON CONFLICT DO NOTHING;
INSERT INTO public.portal_registrations(kind,source_key,full_name,telegram_handle,registered_at) SELECT 'bot',chat_id::text,coalesce(first_name,'Telegram user'),CASE WHEN username IS NULL THEN NULL ELSE '@'||username END,first_seen FROM public.telegram_users ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION public.record_portal_registration() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE k text; sk text; n text; h text; g text; t timestamptz;
BEGIN
 IF TG_TABLE_NAME = 'student_joins' THEN k := 'student'; sk := NEW.full_name; n := NEW.full_name; h := NEW.telegram_handle; g := NEW.gender; t := NEW.joined_at;
 ELSIF TG_TABLE_NAME = 'teacher_access' THEN k := 'teacher'; sk := NEW.id::text; n := NEW.full_name; h := NEW.telegram_handle; g := NEW.gender; t := NEW.accessed_at;
 ELSIF TG_TABLE_NAME = 'parent_requests' THEN k := 'parent'; sk := NEW.id::text; n := NEW.parent_name; h := NEW.telegram_handle; g := NEW.gender; t := NEW.created_at;
 ELSE k := 'bot'; sk := NEW.chat_id::text; n := coalesce(NEW.first_name,'Telegram user'); h := CASE WHEN NEW.username IS NULL THEN NULL ELSE '@'||NEW.username END; g := NULL; t := NEW.first_seen;
 END IF;
 INSERT INTO public.portal_registrations(kind,source_key,full_name,telegram_handle,gender,registered_at) VALUES(k,sk,n,h,g,t)
 ON CONFLICT(kind,source_key) DO UPDATE SET full_name=EXCLUDED.full_name,telegram_handle=EXCLUDED.telegram_handle,gender=coalesce(EXCLUDED.gender,portal_registrations.gender);
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.record_portal_registration() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER student_registration_history AFTER INSERT OR UPDATE ON public.student_joins FOR EACH ROW EXECUTE FUNCTION public.record_portal_registration();
CREATE TRIGGER teacher_registration_history AFTER INSERT OR UPDATE ON public.teacher_access FOR EACH ROW EXECUTE FUNCTION public.record_portal_registration();
CREATE TRIGGER parent_registration_history AFTER INSERT OR UPDATE ON public.parent_requests FOR EACH ROW EXECUTE FUNCTION public.record_portal_registration();
CREATE TRIGGER bot_registration_history AFTER INSERT OR UPDATE ON public.telegram_users FOR EACH ROW EXECUTE FUNCTION public.record_portal_registration();