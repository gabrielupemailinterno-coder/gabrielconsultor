
-- 1) Add new column (nullable at first for backfill)
ALTER TABLE public.integration_webhooks ADD COLUMN IF NOT EXISTS event_name text;

-- 2) Explode multi-event webhooks: keep first key on original row,
--    create sibling rows for the rest with a suffixed name.
DO $$
DECLARE
  wh record;
  k text;
  first_key text;
BEGIN
  FOR wh IN SELECT * FROM public.integration_webhooks LOOP
    IF wh.event_keys IS NULL OR array_length(wh.event_keys, 1) IS NULL THEN
      -- no events → will be deleted below
      CONTINUE;
    END IF;

    first_key := wh.event_keys[1];

    -- Update the original row with the first event.
    -- If it had more than one event, rename it as "name - event".
    UPDATE public.integration_webhooks
      SET event_name = first_key,
          name = CASE
                   WHEN array_length(wh.event_keys, 1) > 1 THEN wh.name || ' - ' || first_key
                   ELSE wh.name
                 END
      WHERE id = wh.id;

    -- Create one clone per additional event.
    IF array_length(wh.event_keys, 1) > 1 THEN
      FOR k IN SELECT unnest(wh.event_keys[2:array_length(wh.event_keys,1)]) LOOP
        INSERT INTO public.integration_webhooks
          (name, url, enabled, secret, event_name, headers, timeout_ms, max_attempts, backoff_seconds)
        VALUES
          (wh.name || ' - ' || k, wh.url, wh.enabled, wh.secret, k, wh.headers, wh.timeout_ms, wh.max_attempts, wh.backoff_seconds);
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- 3) Drop rows still without event_name (originally had zero events).
DELETE FROM public.integration_webhooks WHERE event_name IS NULL;

-- 4) Deduplicate: if the same event ended up with more than one webhook after
--    the split, keep the most recent and delete the older duplicates.
DELETE FROM public.integration_webhooks a
USING public.integration_webhooks b
WHERE a.event_name = b.event_name
  AND a.created_at < b.created_at;

-- 5) Enforce constraints.
ALTER TABLE public.integration_webhooks ALTER COLUMN event_name SET NOT NULL;
ALTER TABLE public.integration_webhooks ADD CONSTRAINT integration_webhooks_event_name_key UNIQUE (event_name);

-- 6) Drop the legacy multi-event array column.
ALTER TABLE public.integration_webhooks DROP COLUMN IF EXISTS event_keys;
