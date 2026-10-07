-- v0.17.13: AI Studio now exposes one fixed processing mode (Low + Auto).
-- Preserve the existing Low tariff as the canonical rate, then flatten legacy tier columns
-- so older clients cannot accidentally reintroduce divergent quality pricing.
UPDATE platform_services
SET
  lab_token_price_per_1k = COALESCE(lab_token_price_low_per_1k, lab_token_price_per_1k, 0),
  customer_token_price_per_1k = COALESCE(customer_token_price_low_per_1k, customer_token_price_per_1k, 0)
WHERE category = 'image' AND service_key LIKE 'ai_%';

UPDATE platform_services
SET
  lab_token_price_low_per_1k = lab_token_price_per_1k,
  lab_token_price_medium_per_1k = lab_token_price_per_1k,
  lab_token_price_high_per_1k = lab_token_price_per_1k,
  customer_token_price_low_per_1k = customer_token_price_per_1k,
  customer_token_price_medium_per_1k = customer_token_price_per_1k,
  customer_token_price_high_per_1k = customer_token_price_per_1k
WHERE category = 'image' AND service_key LIKE 'ai_%';
