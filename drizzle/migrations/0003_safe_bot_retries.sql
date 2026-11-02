ALTER TABLE public.bot_notifications ADD COLUMN IF NOT EXISTS payload jsonb;
ALTER TABLE public.bot_deliveries ADD COLUMN IF NOT EXISTS retryable boolean NOT NULL DEFAULT false;
ALTER TABLE public.bot_deliveries ADD COLUMN IF NOT EXISTS retry_after timestamptz;
ALTER TABLE public.bot_deliveries ADD COLUMN IF NOT EXISTS retry_of uuid REFERENCES public.bot_deliveries(id);
CREATE UNIQUE INDEX IF NOT EXISTS bot_delivery_retry_once ON public.bot_deliveries(retry_of) WHERE retry_of IS NOT NULL;
CREATE INDEX IF NOT EXISTS bot_delivery_recipient_idx ON public.bot_deliveries(notification_id,chat_id,status);
CREATE OR REPLACE FUNCTION public.claim_bot_delivery_retry(delivery_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE original public.bot_deliveries%ROWTYPE; attempt uuid; original_payload jsonb;
BEGIN
 SELECT * INTO original FROM public.bot_deliveries WHERE id=delivery_id;
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'reason','Delivery not found'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(original.notification_id::text || ':' || coalesce(original.chat_id::text,''),0));
 SELECT * INTO original FROM public.bot_deliveries WHERE id=delivery_id FOR UPDATE;
 IF original.status <> 'failed' OR NOT original.retryable OR original.chat_id IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','This delivery is not safe to retry'); END IF;
 IF original.retry_after IS NOT NULL AND original.retry_after > now() THEN RETURN jsonb_build_object('ok',false,'reason','Telegram requested a wait before retrying'); END IF;
 IF EXISTS(SELECT 1 FROM public.bot_deliveries WHERE chat_id=original.chat_id AND status='blocked') THEN RETURN jsonb_build_object('ok',false,'reason','This user blocked the bot'); END IF;
 IF EXISTS(SELECT 1 FROM public.bot_deliveries WHERE notification_id=original.notification_id AND chat_id=original.chat_id AND status IN ('delivered','sending')) THEN RETURN jsonb_build_object('ok',false,'reason','Already delivered or a send is in progress'); END IF;
 IF EXISTS(SELECT 1 FROM public.bot_deliveries WHERE retry_of=delivery_id) THEN RETURN jsonb_build_object('ok',false,'reason','This attempt was already retried'); END IF;
 SELECT payload INTO original_payload FROM public.bot_notifications WHERE id=original.notification_id;
 IF original_payload IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','Original message details are unavailable; retry disabled'); END IF;
 INSERT INTO public.bot_deliveries(notification_id,chat_id,telegram_handle,display_name,status,retry_of) VALUES(original.notification_id,original.chat_id,original.telegram_handle,original.display_name,'sending',delivery_id) RETURNING id INTO attempt;
 UPDATE public.bot_deliveries SET retryable=false WHERE id=delivery_id;
 RETURN jsonb_build_object('ok',true,'id',attempt,'payload',original_payload || jsonb_build_object('chat_id',original.chat_id));
END $$;
REVOKE ALL ON FUNCTION public.claim_bot_delivery_retry(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_bot_delivery_retry(uuid) TO service_role;