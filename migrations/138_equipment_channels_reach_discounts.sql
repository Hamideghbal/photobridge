-- Existing stores retain both channels and nationwide reach until their manager changes settings.
ALTER TABLE equipment_rental_shops
  ADD COLUMN IF NOT EXISTS rental_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sale_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS rental_reach jsonb NOT NULL DEFAULT '{"mode":"all","provinces":[],"cities":[]}'::jsonb,
  ADD COLUMN IF NOT EXISTS sale_reach jsonb NOT NULL DEFAULT '{"mode":"all","provinces":[],"cities":[]}'::jsonb,
  ADD COLUMN IF NOT EXISTS sale_birthday_discount_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sale_birthday_discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sale_birthday_days_before integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS sale_birthday_days_after integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sale_birthday_sms_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE equipment_rental_shop_memberships
  ADD COLUMN IF NOT EXISTS sale_discount_percent numeric(5,2) NOT NULL DEFAULT 0;
ALTER TABLE equipment_sale_orders
  ADD COLUMN IF NOT EXISTS gross_amount bigint,
  ADD COLUMN IF NOT EXISTS discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_reason text;
