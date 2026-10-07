-- PhotoBridge v861 — online top-up for equipment-store sales wallet
ALTER TABLE service_wallet_gateway_payments DROP CONSTRAINT IF EXISTS service_wallet_gateway_payments_owner_type_check;
ALTER TABLE service_wallet_gateway_payments
  ADD CONSTRAINT service_wallet_gateway_payments_owner_type_check
  CHECK (owner_type IN ('lab','customer','rental_shop','rental_shop_sales'));
