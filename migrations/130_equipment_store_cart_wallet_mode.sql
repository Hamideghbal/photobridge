-- PhotoBridge v0.17.663 — store-controlled wallet checkout + cart/preorder mode
ALTER TABLE equipment_rental_shops
  ADD COLUMN IF NOT EXISTS sales_wallet_checkout_enabled boolean NOT NULL DEFAULT false;
