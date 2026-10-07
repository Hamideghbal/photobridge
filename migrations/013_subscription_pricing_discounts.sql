-- PhotoBridge v0.14.7 — structured subscription pricing + lab fixed discount

ALTER TABLE labs ADD COLUMN IF NOT EXISTS subscription_discount_amount bigint NOT NULL DEFAULT 0;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='labs_subscription_discount_amount_chk') THEN
    ALTER TABLE labs ADD CONSTRAINT labs_subscription_discount_amount_chk CHECK (subscription_discount_amount >= 0);
  END IF;
END $$;

ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS discount_percent numeric(5,2) NOT NULL DEFAULT 0;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='subscription_plans_discount_percent_chk') THEN
    ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_discount_percent_chk CHECK (discount_percent >= 0 AND discount_percent <= 100);
  END IF;
END $$;

-- Preserve the current manually-entered prices by inferring their public plan discount
-- from the current one-month price before switching to calculated pricing.
WITH base AS (
  SELECT COALESCE((SELECT price FROM subscription_plans WHERE months=1 LIMIT 1),0)::numeric monthly
)
UPDATE subscription_plans p
SET discount_percent = CASE
  WHEN p.months=1 OR base.monthly<=0 THEN 0
  ELSE GREATEST(0,LEAST(100,ROUND((100 - (p.price::numeric/(base.monthly*p.months))*100),2)))
END
FROM base
WHERE p.months IN (1,3,6) AND p.discount_percent=0;

INSERT INTO subscription_plans(name,months,price,discount_percent,active,sort_order)
SELECT 'اشتراک دوازده‌ماهه',12,COALESCE((SELECT price FROM subscription_plans WHERE months=1 LIMIT 1),0)*12,0,true,40
ON CONFLICT(months) DO NOTHING;

INSERT INTO platform_settings(key,value,updated_at)
SELECT 'subscription_pricing',jsonb_build_object(
  'dailyPrice',0,
  'monthlyPrice',COALESCE((SELECT price FROM subscription_plans WHERE months=1 LIMIT 1),0)
),now()
ON CONFLICT(key) DO NOTHING;

ALTER TABLE subscription_renewals ADD COLUMN IF NOT EXISTS plan_amount bigint;
ALTER TABLE subscription_renewals ADD COLUMN IF NOT EXISTS special_discount_amount bigint NOT NULL DEFAULT 0;
UPDATE subscription_renewals SET plan_amount=COALESCE(plan_amount,list_amount,amount) WHERE plan_amount IS NULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='subscription_renewals_special_discount_amount_chk') THEN
    ALTER TABLE subscription_renewals ADD CONSTRAINT subscription_renewals_special_discount_amount_chk CHECK (special_discount_amount >= 0);
  END IF;
END $$;
