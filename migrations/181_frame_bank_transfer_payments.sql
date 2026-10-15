ALTER TABLE equipment_rental_shops
 ADD COLUMN IF NOT EXISTS payment_card_number text,
 ADD COLUMN IF NOT EXISTS payment_iban text,
 ADD COLUMN IF NOT EXISTS payment_account_holder text;

-- One payment covers every line of a production checkout. Service wallets
-- are deliberately unrelated to this store's bank-transfer payments.
CREATE TABLE IF NOT EXISTS equipment_frame_payments (
 id uuid PRIMARY KEY,
 shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id),
 buyer_user_id uuid NOT NULL REFERENCES users(id),
 total_amount numeric NOT NULL CHECK(total_amount >= 0),
 bank_details jsonb NOT NULL DEFAULT '{}'::jsonb,
 status text NOT NULL DEFAULT 'awaiting_receipt' CHECK(status IN ('awaiting_receipt','pending','approved','rejected')),
 receipt_object_key text,
 receipt_name text,
 receipt_bytes integer,
 submitted_at timestamptz,
 reviewed_by uuid REFERENCES users(id),
 reviewed_at timestamptz,
 review_note text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE equipment_sale_orders ADD COLUMN IF NOT EXISTS frame_payment_id uuid REFERENCES equipment_frame_payments(id);
CREATE INDEX IF NOT EXISTS equipment_frame_payment_orders ON equipment_sale_orders(frame_payment_id) WHERE frame_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS equipment_frame_payments_buyer ON equipment_frame_payments(buyer_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS equipment_frame_payments_review ON equipment_frame_payments(shop_id,status,submitted_at);

-- Existing unpaid production orders remain payable through the new receipt UI.
INSERT INTO equipment_frame_payments(id,shop_id,buyer_user_id,total_amount,bank_details)
 SELECT o.id,o.shop_id,o.buyer_user_id,o.total_amount,
 jsonb_build_object('cardNumber',COALESCE(s.payment_card_number,''),'iban',COALESCE(s.payment_iban,''),'accountHolder',COALESCE(s.payment_account_holder,''))
 FROM equipment_sale_orders o JOIN equipment_rental_shops s ON s.id=o.shop_id
 WHERE o.production_stage IS NOT NULL AND o.status<>'cancelled' AND o.payment_status='unpaid'
 AND o.buyer_user_id IS NOT NULL AND o.frame_payment_id IS NULL
 ON CONFLICT(id) DO NOTHING;
UPDATE equipment_sale_orders o SET frame_payment_id=o.id
 WHERE o.frame_payment_id IS NULL AND EXISTS(SELECT 1 FROM equipment_frame_payments p WHERE p.id=o.id AND p.shop_id=o.shop_id AND p.buyer_user_id=o.buyer_user_id);
