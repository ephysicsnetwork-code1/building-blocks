CREATE TABLE public.exam_testers (
  telegram_handle text PRIMARY KEY,
  full_name text NOT NULL,
  section text NOT NULL,
  signed_up_at timestamptz NOT NULL DEFAULT now(),
  selected boolean NOT NULL DEFAULT false,
  notified boolean
);
GRANT ALL ON public.exam_testers TO service_role;
ALTER TABLE public.exam_testers ENABLE ROW LEVEL SECURITY;